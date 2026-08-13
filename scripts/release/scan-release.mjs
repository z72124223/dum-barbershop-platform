import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  assertManifestFilesMatch,
  assertReleaseSha,
  resolveReleaseDirectory,
  scanReleaseDirectory,
} from "./release-artifact.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const repositoryRoot = path.resolve(import.meta.dirname, "..", "..");
const releaseSha = assertReleaseSha(option("--sha", process.env.DUM_RELEASE_SHA));
const outputRoot = path.resolve(repositoryRoot, option("--output-root", ".artifacts"));
const { target } = resolveReleaseDirectory(outputRoot, releaseSha);
const manifest = JSON.parse(await fs.readFile(path.join(target, "release-manifest.json"), "utf8"));
if (
  manifest.schemaVersion !== 1
  || manifest.releaseSha !== releaseSha
  || manifest.entrypoint !== "app/server.js"
  || manifest.bindHost !== "127.0.0.1"
) {
  throw new Error("release_manifest_invalid");
}
const hashes = await scanReleaseDirectory(target);
assertManifestFilesMatch(hashes, manifest.files);
process.stdout.write(`${JSON.stringify({ status: "ok", releaseSha, files: hashes.length })}\n`);
