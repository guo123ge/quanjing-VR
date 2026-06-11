import { createWriteStream, existsSync } from "fs";
import { mkdir, readdir, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(rootDir, "data", "backups");
  await mkdir(backupDir, { recursive: true });
  const archivePath = path.join(backupDir, `backup-${timestamp}.txt`);
  const out = createWriteStream(archivePath, { encoding: "utf8" });

  writeLine(out, "AI Panorama Renovation Backup Manifest");
  writeLine(out, `Created: ${new Date().toISOString()}`);
  await addIfExists(out, path.join(rootDir, "data", "panorama.db"));
  await walk(out, path.join(rootDir, "public", "uploads"));
  out.end();
  console.log(`Backup manifest written: ${archivePath}`);
  console.log("请在正式部署中用 tar/zip 同步打包 manifest 中列出的数据库和 uploads 文件。");
}

async function addIfExists(out, filePath) {
  if (!existsSync(filePath)) return;
  const info = await stat(filePath);
  writeLine(out, `${filePath}\t${info.size}`);
}

async function walk(out, dir) {
  if (!existsSync(dir)) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(out, full);
    else await addIfExists(out, full);
  }
}

function writeLine(out, line) {
  out.write(`${line}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
