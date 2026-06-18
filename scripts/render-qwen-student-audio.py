#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
import os
import shutil
from pathlib import Path

import lameenc
import numpy as np
import torch
from qwen_tts import Qwen3TTSModel, VoiceClonePromptItem


DEFAULT_BASE_MODEL_ID = os.environ.get(
    "QWEN_TTS_BASE_MODEL_ID",
    str(
        Path.home()
        / ".cache"
        / "huggingface"
        / "hub"
        / "models--Qwen--Qwen3-TTS-12Hz-0.6B-Base"
        / "snapshots"
        / "5d83992436eae1d760afd27aff78a71d676296fc"
    ),
)

VOICE_LIBRARY_ROOT = Path(os.environ.get("FRENCHEASE_ROOT", Path.cwd().parent / "Playground" / "FrenchEase")) / (
    "Paper_2_Listening/02_audio_pipeline/voice_library"
)

VOICE_PROMPTS = {
    "Adil": VOICE_LIBRARY_ROOT / "adil" / "voice_clone_prompt.pt",
    "Francois": VOICE_LIBRARY_ROOT / "francois" / "voice_clone_prompt.pt",
    "Olga": VOICE_LIBRARY_ROOT / "olga" / "voice_clone_prompt.pt",
}


def load_voice_clone_prompt(prompt_path: Path) -> list[VoiceClonePromptItem]:
    payload = torch.load(prompt_path, map_location="cpu", weights_only=True)
    raw_items = payload.get("items")
    if not isinstance(raw_items, list) or not raw_items:
        raise ValueError(f"Invalid voice prompt payload: {prompt_path}")

    items: list[VoiceClonePromptItem] = []
    for raw_item in raw_items:
        if not isinstance(raw_item, dict):
            raise ValueError(f"Invalid voice prompt item in {prompt_path}")

        ref_code = raw_item.get("ref_code")
        if ref_code is not None and not torch.is_tensor(ref_code):
            ref_code = torch.tensor(ref_code)

        ref_spk_embedding = raw_item.get("ref_spk_embedding")
        if ref_spk_embedding is None:
            raise ValueError(f"Missing ref_spk_embedding in {prompt_path}")
        if not torch.is_tensor(ref_spk_embedding):
            ref_spk_embedding = torch.tensor(ref_spk_embedding)

        items.append(
            VoiceClonePromptItem(
                ref_code=ref_code,
                ref_spk_embedding=ref_spk_embedding,
                x_vector_only_mode=bool(raw_item.get("x_vector_only_mode", False)),
                icl_mode=bool(raw_item.get("icl_mode", not bool(raw_item.get("x_vector_only_mode", False)))),
                ref_text=raw_item.get("ref_text"),
            )
        )
    return items


def split_text(text: str, max_chars: int = 1200) -> list[str]:
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    current = ""
    for part in text.replace("; ", ". ").split(". "):
        sentence = part.strip()
        if not sentence:
            continue
        if not sentence.endswith((".", "!", "?")):
            sentence = f"{sentence}."
        candidate = f"{current} {sentence}".strip() if current else sentence
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            chunks.append(current)
        current = sentence
    if current:
        chunks.append(current)
    return chunks


def make_silence(duration_ms: int, sample_rate: int) -> np.ndarray:
    frame_count = int(sample_rate * (duration_ms / 1000.0))
    return np.zeros(frame_count, dtype=np.float32)


def encode_mp3(audio: np.ndarray, sample_rate: int, mp3_path: Path, bitrate_kbps: int = 128) -> None:
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak > 0:
        ceiling = math.pow(10.0, -1.0 / 20.0)
        audio = audio * min(1.0, ceiling / peak)

    clipped = np.clip(audio, -1.0, 1.0)
    pcm16 = (clipped * 32767.0).astype(np.int16)

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(bitrate_kbps)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(1)
    encoder.set_quality(2)

    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    mp3_path.write_bytes(encoder.encode(pcm16.tobytes()) + encoder.flush())


def render_item(model: Qwen3TTSModel, item: dict[str, str], force: bool) -> dict[str, object]:
    output_path = Path(item["outputPath"]).expanduser().resolve()
    public_output_path = Path(item["publicOutputPath"]).expanduser().resolve()
    voice = item["voice"]
    prompt_path = VOICE_PROMPTS.get(voice)
    if prompt_path is None:
        raise ValueError(f"Unsupported Qwen voice clone: {voice}")
    if not prompt_path.exists():
        raise FileNotFoundError(f"Missing Qwen voice prompt for {voice}: {prompt_path}")

    if output_path.exists() and public_output_path.exists() and not force:
        print(f"Skipped existing {item['id']} ({voice})", flush=True)
        return {
            "id": item["id"],
            "voice": voice,
            "mp3": str(output_path),
            "publicMp3": str(public_output_path),
            "status": "skipped-existing",
        }

    prompt = load_voice_clone_prompt(prompt_path)
    parts: list[np.ndarray] = []
    sample_rate: int | None = None
    chunks = split_text(item["text"])

    for chunk_index, chunk in enumerate(chunks, start=1):
        print(f"Rendering {item['id']} ({voice}) chunk {chunk_index}/{len(chunks)}", flush=True)
        wavs, current_sample_rate = model.generate_voice_clone(
            text=chunk,
            language="French",
            voice_clone_prompt=prompt,
            non_streaming_mode=True,
            max_new_tokens=384,
        )
        if sample_rate is None:
            sample_rate = current_sample_rate
        elif sample_rate != current_sample_rate:
            raise ValueError(f"Inconsistent sample rate for {item['id']}: {sample_rate} vs {current_sample_rate}")

        parts.append(np.asarray(wavs[0], dtype=np.float32).reshape(-1))
        parts.append(make_silence(250, sample_rate))

    if not parts or sample_rate is None:
        raise ValueError(f"No audio generated for {item['id']}")
    parts.pop()

    encode_mp3(np.concatenate(parts), sample_rate, output_path)
    public_output_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(output_path, public_output_path)

    return {
        "id": item["id"],
        "voice": voice,
        "mp3": str(output_path),
        "publicMp3": str(public_output_path),
        "sampleRate": sample_rate,
        "chunks": len(chunks),
        "status": "rendered",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Render FrenchEase SL student texts with Qwen cloned voices.")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--base-model-id", default=DEFAULT_BASE_MODEL_ID)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    manifest_path = args.manifest.expanduser().resolve()
    payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    items = payload.get("items")
    if not isinstance(items, list):
        raise ValueError("Manifest must contain an items list")

    cpu_count = os.cpu_count() or 1
    torch.set_num_threads(cpu_count)
    torch.set_num_interop_threads(1)

    model = Qwen3TTSModel.from_pretrained(args.base_model_id, device_map="cpu")

    results = [render_item(model, item, args.force) for item in items]
    render_manifest_path = manifest_path.with_name("student_audio_render_manifest.json")
    render_manifest_path.write_text(
        json.dumps(
            {
                "engine": "qwen-tts",
                "baseModelId": args.base_model_id,
                "voices": sorted(VOICE_PROMPTS),
                "files": results,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {render_manifest_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
