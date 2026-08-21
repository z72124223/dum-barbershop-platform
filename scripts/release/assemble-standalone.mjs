import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  RELEASE_NODE_VERSION,
  assertPhysicalTree,
  assertReleaseSha,
  assertSafeReleaseMutation,
  resolveReleaseDirectory,
  scanReleaseDirectory,
  writeReleaseManifest,
} from "./release-artifact.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const repositoryRoot = path.resolve(import.meta.dirname, "..", "..");
if (process.versions.node !== RELEASE_NODE_VERSION) {
  throw new Error("release_node_version_invalid");
}
const releaseSha = assertReleaseSha(
  option("--sha", process.env.DUM_RELEASE_SHA)
    ?? execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }).trim(),
);
const headSha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repositoryRoot,
  encoding: "utf8",
}).trim();
if (headSha !== releaseSha) throw new Error("release_sha_not_head");

const outputRoot = path.resolve(repositoryRoot, option("--output-root", ".artifacts"));
const { target } = resolveReleaseDirectory(outputRoot, releaseSha);
const standaloneSource = path.join(repositoryRoot, ".next", "standalone");
const staticSource = path.join(repositoryRoot, ".next", "static");
const publicSource = path.join(repositoryRoot, "public");

for (const required of [staticSource, publicSource]) {
  if (!(await fs.lstat(required).catch(() => null))?.isDirectory()) {
    throw new Error("standalone_build_missing");
  }
  await assertPhysicalTree(required);
}

const standaloneStats = await fs.lstat(standaloneSource).catch(() => null);
if (!standaloneStats?.isDirectory() || standaloneStats.isSymbolicLink()) {
  throw new Error("standalone_build_missing");
}
// Next 16 emits one Windows junction for the traced better-sqlite3 native
// package. Materialise that exact build output in the immutable release; do
// not permit arbitrary source links.
const tracedModules = path.join(standaloneSource, ".next", "node_modules");
const tracedEntries = await fs.readdir(tracedModules, { withFileTypes: true }).catch(() => []);
for (const entry of tracedEntries) {
  const entryPath = path.join(tracedModules, entry.name);
  const stats = await fs.lstat(entryPath);
  if (!stats.isSymbolicLink()) continue;
  const expectedName = /^better-sqlite3-[0-9a-f]+$/;
  const expectedTarget = path.join(repositoryRoot, "node_modules", "better-sqlite3");
  if (!expectedName.test(entry.name) || path.resolve(await fs.realpath(entryPath)) !== path.resolve(expectedTarget)) {
    throw new Error("release_reparse_forbidden");
  }
  await assertPhysicalTree(expectedTarget);
}

await assertSafeReleaseMutation(outputRoot, target);
if (await fs.lstat(target).catch(() => null)) {
  throw new Error("release_already_exists");
}

await fs.mkdir(path.dirname(target), { recursive: true });
await assertSafeReleaseMutation(outputRoot, target);
await fs.mkdir(target, { recursive: false });
const appTarget = path.join(target, "app");
await fs.cp(standaloneSource, appTarget, { recursive: true, dereference: true });
await fs.mkdir(path.join(appTarget, ".next"), { recursive: true });
await fs.cp(staticSource, path.join(appTarget, ".next", "static"), {
  recursive: true,
  dereference: false,
});
await fs.cp(publicSource, path.join(appTarget, "public"), {
  recursive: true,
  dereference: false,
});

const hashes = await scanReleaseDirectory(target);
await writeReleaseManifest(target, releaseSha, hashes);
process.stdout.write(`${JSON.stringify({ status: "ok", releaseSha, files: hashes.length })}\n`);
