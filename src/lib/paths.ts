import path from "path";

export const rootDir = process.cwd();
export const dataDir = path.join(rootDir, "data");
export const uploadDir = path.join(rootDir, "public", "uploads");

export function publicUploadPath(fileName: string) {
  return `/uploads/${fileName}`;
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
