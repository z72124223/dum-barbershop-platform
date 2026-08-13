import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
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

for (const required of [standaloneSource, staticSource, publicSource]) {
  if (!(await fs.lstat(required).catch(() => null))?.isDirectory()) {
    throw new Error("standalone_build_missing");
  }
  await assertPhysicalTree(required);
}

await assertSafeReleaseMutation(outputRoot, target);
if (await fs.lstat(target).catch(() => null)) {
  throw new Error("release_already_exists");
}

await fs.mkdir(path.dirname(target), { recursive: true });
await assertSafeReleaseMutation(outputRoot, target);
await fs.mkdir(target, { recursive: false });
const appTarget = path.join(target, "app");
await fs.cp(standaloneSource, appTarget, { recursive: true, dereference: false });
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
