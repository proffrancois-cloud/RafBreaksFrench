export const resolveAssetUrl = (url?: string) => {
  if (!url) return "";
  if (/^(https?:)?\/\//.test(url) || /^(data|blob):/.test(url)) return url;

  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
};
