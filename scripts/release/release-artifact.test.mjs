import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertReleaseSha,
  resolveReleaseDirectory,
  scanReleaseDirectory,
  writeReleaseManifest,
} from "./release-artifact.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dum-release-"));
  const release = path.join(root, "releases", SHA);
  await fs.mkdir(path.join(release, "app"), { recursive: true });
  await fs.writeFile(path.join(release, "app", "server.js"), "console.log('fixture');\n");
  return { root, release };
}

test("release path is pinned to a full lowercase commit SHA", () => {
  assert.equal(assertReleaseSha(SHA), SHA);
  assert.throws(() => assertReleaseSha("main"), /release_sha_invalid/);
  const { target } = resolveReleaseDirectory("C:\\safe-root", SHA);
  assert.equal(path.basename(target), SHA);
});

test("artifact scan hashes an app and writes a stable manifest", async (t) => {
  const { root, release } = await fixture();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const hashes = await scanReleaseDirectory(release);
  assert.deepEqual(hashes.map((entry) => entry.path), ["app/server.js"]);
  const manifest = await writeReleaseManifest(release, SHA, hashes);
  assert.equal(manifest.releaseSha, SHA);
  assert.equal(manifest.bindHost, "127.0.0.1");
});

test("artifact scan rejects runtime data, secrets, and symlinks", async (t) => {
  const runtimeData = await fixture();
  const secret = await fixture();
  t.after(() => Promise.all([
    fs.rm(runtimeData.root, { recursive: true, force: true }),
    fs.rm(secret.root, { recursive: true, force: true }),
  ]));

  await fs.writeFile(path.join(runtimeData.release, "app", "live.sqlite"), "fixture");
  await assert.rejects(scanReleaseDirectory(runtimeData.release), /release_runtime_data_forbidden/);

  await fs.writeFile(
    path.join(secret.release, "app", "leak.txt"),
    "BETTER_AUTH_SECRET=fictional-secret-that-must-never-ship",
  );
  await assert.rejects(scanReleaseDirectory(secret.release), /release_secret_forbidden/);
});
