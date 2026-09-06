import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE_PATH = resolve(ROOT, "scripts/sw.template.js");
const DEFAULT_OUTPUT_PATH = resolve(ROOT, "public/sw.js");
const BUILD_ID_TOKEN = "__STUDYMAP_BUILD_ID__";

function getOption(name) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}

const explicitBuildId = getOption("--build-id");
if (explicitBuildId === "") {
  throw new Error("--build-id must not be empty");
}

const sourceRevision =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local";
const buildId =
  explicitBuildId ?? `${sourceRevision}-${Date.now().toString(36)}-${randomUUID()}`;
const outputPath = resolve(process.cwd(), getOption("--output") ?? DEFAULT_OUTPUT_PATH);

const template = await readFile(TEMPLATE_PATH, "utf8");
const tokenCount = template.split(BUILD_ID_TOKEN).length - 1;
if (tokenCount !== 1) {
  throw new Error(
    `Expected exactly one ${BUILD_ID_TOKEN} token in ${relative(ROOT, TEMPLATE_PATH)}, found ${tokenCount}`,
  );
}

// A replacer function keeps "$"-sequences in the build ID from being
// interpreted as special replacement patterns, and JSON encoding keeps the
// generated script valid even if a future build ID contains characters that
// would otherwise need JavaScript string escaping.
const rendered = template.replace(BUILD_ID_TOKEN, () => JSON.stringify(buildId));

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, rendered, "utf8");

console.log(`[sw] generated ${relative(ROOT, outputPath)} for build ${buildId}`);
