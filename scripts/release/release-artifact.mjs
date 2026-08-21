import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export const RELEASE_SHA_PATTERN = /^[0-9a-f]{40}$/;
export const RELEASE_NODE_VERSION = "24.19.0";

const FORBIDDEN_FILE_PATTERNS = [
  /(?:^|\/)\.env(?:\.|$)/i,
  /\.(?:db|sqlite)(?:-(?:shm|wal))?$/i,
  /\.(?:log|pid)$/i,
  /\.(?:asc|conf|config|gpg|ini|kdbx|key|p12|pem|pfx|toml|ya?ml)$/i,
  /(?:^|\/)(?:credential|credentials|secret|secrets)(?:[._-]|$)/i,
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
  /["']?(?:BETTER_AUTH_SECRET|DUM_CLOUDFLARE_TUNNEL_TOKEN|CLOUDFLARE_TUNNEL_TOKEN|TUNNEL_TOKEN)["']?\s*[:=]\s*["']?[^\s"'`,;}]{16,}/i,
  /-----BEGIN (?:PGP |RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

const SECRET_SCANNABLE_EXTENSIONS = new Set([
  "", ".cjs", ".js", ".json", ".mjs", ".txt",
]);

export function compareOrdinal(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

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

function samePhysicalPath(left, right) {
  const normalize = (value) => {
    const resolved = path.resolve(value);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  return normalize(left) === normalize(right);
}

async function lstatOrNull(filename) {
  try {
    return await fs.lstat(filename);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function assertPhysicalPath(filename) {
  const resolved = path.resolve(filename);
  const parsed = path.parse(resolved);
  const relativeParts = resolved.slice(parsed.root.length).split(path.sep).filter(Boolean);
  let current = parsed.root;
  for (const part of relativeParts) {
    current = path.join(current, part);
    const stats = await lstatOrNull(current);
    if (!stats) break;
    if (stats.isSymbolicLink()) throw new Error("release_reparse_forbidden");
    const physical = await fs.realpath(current);
    if (!samePhysicalPath(physical, current)) {
      throw new Error("release_reparse_forbidden");
    }
  }
  return resolved;
}

export async function assertPhysicalTree(rootDirectory, allowReparse = async () => false) {
  const root = await assertPhysicalPath(rootDirectory);
  const rootStats = await fs.lstat(root);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error("release_source_invalid");
  }

  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const stats = await fs.lstat(absolute);
      if (entry.isSymbolicLink() || stats.isSymbolicLink()) {
        if (await allowReparse(absolute, stats)) continue;
        throw new Error("release_reparse_forbidden");
      }
      const physical = await fs.realpath(absolute);
      if (!samePhysicalPath(physical, absolute)) {
        throw new Error("release_reparse_forbidden");
      }
      if (stats.isDirectory()) pending.push(absolute);
      else if (!stats.isFile()) throw new Error("release_entry_type_forbidden");
    }
  }
  return root;
}

async function walk(root, current = root) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => compareOrdinal(a.name, b.name))) {
    const absolute = path.join(current, entry.name);
    if (entry.isSymbolicLink()) throw new Error("release_symlink_forbidden");
    const stats = await fs.lstat(absolute);
    const physical = await fs.realpath(absolute);
    if (!samePhysicalPath(physical, absolute)) throw new Error("release_reparse_forbidden");
    if (stats.isDirectory()) files.push(...await walk(root, absolute));
    else if (stats.isFile()) files.push(path.relative(root, absolute).replaceAll("\\", "/"));
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
  const extension = path.extname(filename).toLowerCase();
  if (!SECRET_SCANNABLE_EXTENSIONS.has(extension)) return;
  const content = await fs.readFile(filename, "utf8");
  if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(content))) {
    throw new Error("release_secret_forbidden");
  }
}

export async function scanReleaseDirectory(releaseDirectory) {
  const releaseRoot = path.resolve(releaseDirectory);
  await assertPhysicalPath(releaseRoot);
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

export async function assertSafeReleaseMutation(outputRoot, target) {
  const root = path.resolve(outputRoot);
  const releaseTarget = path.resolve(target);
  const relative = path.relative(root, releaseTarget);
  if (
    !relative
    || relative.startsWith("..")
    || path.isAbsolute(relative)
    || relative.split(path.sep).length !== 2
    || relative.split(path.sep)[0] !== "releases"
    || !RELEASE_SHA_PATTERN.test(relative.split(path.sep)[1] ?? "")
  ) {
    throw new Error("release_path_invalid");
  }
  await assertPhysicalPath(root);
  await assertPhysicalPath(path.dirname(releaseTarget));
  const targetStats = await lstatOrNull(releaseTarget);
  if (targetStats) {
    await assertPhysicalPath(releaseTarget);
    if (!targetStats.isDirectory()) throw new Error("release_path_invalid");
    await walk(releaseTarget);
  }
}

export function assertManifestFilesMatch(actual, expected) {
  if (!Array.isArray(expected) || actual.length !== expected.length) {
    throw new Error("release_manifest_hash_mismatch");
  }
  for (let index = 0; index < actual.length; index += 1) {
    const actualEntry = actual[index];
    const expectedEntry = expected[index];
    if (
      !expectedEntry
      || Object.keys(expectedEntry).sort(compareOrdinal).join(",") !== "path,sha256"
      || expectedEntry.path !== actualEntry.path
      || expectedEntry.sha256 !== actualEntry.sha256
      || !/^[0-9a-f]{64}$/.test(expectedEntry.sha256)
    ) {
      throw new Error("release_manifest_hash_mismatch");
    }
  }
}

export async function writeReleaseManifest(releaseDirectory, releaseSha, hashes) {
  const manifest = {
    schemaVersion: 1,
    releaseSha: assertReleaseSha(releaseSha),
    nodeVersion: RELEASE_NODE_VERSION,
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
