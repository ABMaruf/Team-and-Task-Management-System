export const getClientUrls = (path) => {
  const bases = [process.env.CLIENT_URL, process.env.CLIENT_URL_LOCAL].filter(Boolean);
  const fallback = 'http://localhost:5173';
  const baseList = bases.length > 0 ? bases : [fallback];
  const urls = baseList.map((base) => {
    try {
      return new URL(path, base).toString();
    } catch (error) {
      const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
      return `${trimmed}${path}`;
    }
  });
  return Array.from(new Set(urls));
};
