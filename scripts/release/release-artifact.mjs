import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export const RELEASE_SHA_PATTERN = /^[0-9a-f]{40}$/;

const FORBIDDEN_FILE_PATTERNS = [
  /(?:^|\/)\.env(?:\.|$)/i,
  /\.(?:db|sqlite)(?:-(?:shm|wal))?$/i,
  /\.(?:log|pid)$/i,
];

const FORBIDDEN_APP_ROOTS = new Set([
  "config",
  "data",
  "database",
  "db",
  "logs",
  "runtime-config",
  "state",
]);

const SECRET_VALUE_PATTERNS = [
  /BETTER_AUTH_SECRET\s*=\s*[^\s"'`]{16,}/,
  /(?:tunnel|cloudflared)[_-]?token\s*=\s*[^\s"'`]{16,}/i,
  /-----BEGIN (?:PGP |RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

export function assertReleaseSha(value) {
  if (!RELEASE_SHA_PATTERN.test(value ?? "")) {
    throw new Error("release_sha_invalid");
  }
  return value;
}

export function resolveReleaseDirectory(outputRoot, releaseSha) {
  const root = path.resolve(outputRoot);
  const target = path.resolve(root, "releases", assertReleaseSha(releaseSha));
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("release_path_invalid");
  }
  return { root, target };
}

async function walk(root, current = root) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(current, entry.name);
    if (entry.isSymbolicLink()) throw new Error("release_symlink_forbidden");
    if (entry.isDirectory()) files.push(...await walk(root, absolute));
    else if (entry.isFile()) files.push(path.relative(root, absolute).replaceAll("\\", "/"));
    else throw new Error("release_entry_type_forbidden");
  }
  return files;
}

async function sha256(filename) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest("hex");
}

function assertAllowedPath(relativePath) {
  for (const pattern of FORBIDDEN_FILE_PATTERNS) {
    if (pattern.test(relativePath)) throw new Error("release_runtime_data_forbidden");
  }
  const parts = relativePath.split("/");
  if (parts[0] === "app" && FORBIDDEN_APP_ROOTS.has(parts[1]?.toLowerCase())) {
    throw new Error("release_runtime_data_forbidden");
  }
}

async function assertNoEmbeddedSecret(filename) {
  const stats = await fs.stat(filename);
  if (stats.size > 1_048_576) return;
  const extension = path.extname(filename).toLowerCase();
  if (!["", ".cjs", ".js", ".json", ".mjs", ".txt"].includes(extension)) return;
  const content = await fs.readFile(filename, "utf8");
  if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(content))) {
    throw new Error("release_secret_forbidden");
  }
}

export async function scanReleaseDirectory(releaseDirectory) {
  const releaseRoot = path.resolve(releaseDirectory);
  const appRoot = path.join(releaseRoot, "app");
  const entrypoint = path.join(appRoot, "server.js");
  if (!(await fs.stat(entrypoint).catch(() => null))?.isFile()) {
    throw new Error("release_entrypoint_missing");
  }

  const files = await walk(releaseRoot);
  const hashes = [];
  for (const relativePath of files) {
    if (relativePath === "release-manifest.json") continue;
    assertAllowedPath(relativePath);
    const absolute = path.join(releaseRoot, ...relativePath.split("/"));
    await assertNoEmbeddedSecret(absolute);
    hashes.push({ path: relativePath, sha256: await sha256(absolute) });
  }
  return hashes;
}

export async function writeReleaseManifest(releaseDirectory, releaseSha, hashes) {
  const manifest = {
    schemaVersion: 1,
    releaseSha: assertReleaseSha(releaseSha),
    entrypoint: "app/server.js",
    bindHost: "127.0.0.1",
    files: hashes,
  };
  await fs.writeFile(
    path.join(releaseDirectory, "release-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" },
  );
  return manifest;
}
