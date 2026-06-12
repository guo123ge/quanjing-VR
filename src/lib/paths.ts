import path from "path";

export const rootDir = process.cwd();
export const dataDir = path.join(rootDir, "data");
export const uploadDir = path.join(rootDir, "public", "uploads");
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(urlPath: string) {
  if (!basePath || urlPath.startsWith(basePath)) return urlPath;
  return `${basePath}${urlPath.startsWith("/") ? urlPath : `/${urlPath}`}`;
}

export function stripBasePath(urlPath: string) {
  if (!basePath || !urlPath.startsWith(`${basePath}/`)) return urlPath;
  return urlPath.slice(basePath.length);
}

export function publicUploadPath(fileName: string) {
  return withBasePath(`/uploads/${fileName}`);
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
