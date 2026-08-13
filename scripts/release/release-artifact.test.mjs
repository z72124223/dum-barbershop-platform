import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertManifestFilesMatch,
  assertPhysicalPath,
  assertPhysicalTree,
  assertReleaseSha,
  assertSafeReleaseMutation,
  compareOrdinal,
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
  assert.equal(manifest.nodeVersion, "24.19.0");
  assert.equal(manifest.bindHost, "127.0.0.1");
});

test("artifact ordering is explicit ordinal and manifest comparison is structural", async (t) => {
  const { root, release } = await fixture();
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const name of ["z.js", "a.js", "0.js", "ä.js"]) {
    await fs.writeFile(path.join(release, "app", name), name);
  }
  const first = await scanReleaseDirectory(release);
  const second = await scanReleaseDirectory(release);
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.map((entry) => entry.path),
    ["app/0.js", "app/a.js", "app/server.js", "app/z.js", "app/ä.js"],
  );
  assert.equal(compareOrdinal("Z", "a"), -1);
  assert.doesNotThrow(() => assertManifestFilesMatch(first, structuredClone(first)));
  const reordered = structuredClone(first).reverse();
  assert.throws(() => assertManifestFilesMatch(first, reordered), /release_manifest_hash_mismatch/);
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

test("secret scan rejects quoted env, JSON, credential extensions, and large candidates", async (t) => {
  const quoted = await fixture();
  const json = await fixture();
  const credential = await fixture();
  const large = await fixture();
  t.after(() => Promise.all([quoted, json, credential, large].map(({ root }) => (
    fs.rm(root, { recursive: true, force: true })
  ))));

  await fs.writeFile(
    path.join(quoted.release, "app", "quoted.txt"),
    'DUM_CLOUDFLARE_TUNNEL_TOKEN="fictional-value-that-must-not-ship"\n',
  );
  await assert.rejects(scanReleaseDirectory(quoted.release), /release_secret_forbidden/);

  await fs.writeFile(
    path.join(json.release, "app", "runtime.json"),
    JSON.stringify({ BETTER_AUTH_SECRET: "fictional-value-that-must-not-ship" }),
  );
  await assert.rejects(scanReleaseDirectory(json.release), /release_secret_forbidden/);

  await fs.writeFile(path.join(credential.release, "app", "identity.pfx"), "fixture");
  await assert.rejects(scanReleaseDirectory(credential.release), /release_runtime_data_forbidden/);

  await fs.writeFile(
    path.join(large.release, "app", "large.txt"),
    `${"x".repeat(1_100_000)}\nTUNNEL_TOKEN='fictional-value-that-must-not-ship'\n`,
  );
  await assert.rejects(scanReleaseDirectory(large.release), /release_secret_forbidden/);
});

test("release mutation rejects a junction in an existing ancestor", async (t) => {
  const container = await fs.mkdtemp(path.join(os.tmpdir(), "dum-release-link-"));
  const physical = path.join(container, "physical");
  const linked = path.join(container, "linked");
  await fs.mkdir(physical);
  try {
    await fs.symlink(physical, linked, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (["EPERM", "EACCES", "ENOTSUP"].includes(error?.code)) {
      t.skip("junction creation is unavailable on this host");
      await fs.rm(container, { recursive: true, force: true });
      return;
    }
    throw error;
  }
  t.after(async () => {
    await fs.unlink(linked).catch(() => undefined);
    await fs.rm(container, { recursive: true, force: true });
  });

  const target = path.join(linked, "releases", SHA);
  await assert.rejects(assertPhysicalPath(target), /release_reparse_forbidden/);
  await assert.rejects(
    assertSafeReleaseMutation(linked, target),
    /release_reparse_forbidden/,
  );
});

test("release mutation accepts only the exact SHA child below releases", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dum-release-guard-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "releases"));
  await assert.doesNotReject(
    assertSafeReleaseMutation(root, path.join(root, "releases", SHA)),
  );
  await assert.rejects(
    assertSafeReleaseMutation(root, path.join(root, "releases", SHA, "child")),
    /release_path_invalid/,
  );
  await assert.rejects(
    assertSafeReleaseMutation(root, path.join(root, "state", SHA)),
    /release_path_invalid/,
  );
});

test("source validation rejects a nested symlink or junction before copy", async (t) => {
  const container = await fs.mkdtemp(path.join(os.tmpdir(), "dum-release-source-"));
  const source = path.join(container, "source");
  const outside = path.join(container, "outside");
  const nested = path.join(source, "nested");
  await fs.mkdir(source);
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, "credential.txt"), "fictional external data");
  try {
    await fs.symlink(outside, nested, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (["EPERM", "EACCES", "ENOTSUP"].includes(error?.code)) {
      t.skip("junction creation is unavailable on this host");
      await fs.rm(container, { recursive: true, force: true });
      return;
    }
    throw error;
  }
  t.after(async () => {
    await fs.unlink(nested).catch(() => undefined);
    await fs.rm(container, { recursive: true, force: true });
  });
  await assert.rejects(assertPhysicalTree(source), /release_reparse_forbidden/);
});
