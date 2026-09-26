/*
MIT License

Copyright (c) 2026 Shane Froebel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

// Fails when the npm tarball would ship files it should not, or grows past a
// sane size (#143). It runs `npm pack --dry-run`, so it checks exactly what
// `files` and the build produce. Run it after `npm run build`.
import { execFileSync } from "node:child_process";

// Unpacked-size ceiling for the tarball, in bytes. The runtime build plus
// README, LICENSE and CHANGELOG is about 75 kB. 250 kB leaves room for the
// docs and changelog to grow while still catching a bundled dependency or
// stray build output (node-hl7-client alone is several MB).
const MAX_UNPACKED_BYTES = 250_000;

const FORBIDDEN = [
  { pattern: /\.map$/, reason: "source map" },
  {
    pattern: /^(src|__tests__|test|tests|docs|scripts|coverage|temp)\//,
    reason: "non-runtime folder",
  },
  { pattern: /\.(test|spec)\.[cm]?[jt]s$/, reason: "test file" },
];

// TypeScript sources are forbidden; declaration files are the one TypeScript
// output that belongs in the package.
const isTypeScriptSource = (filePath) =>
  /\.[cm]?ts$/.test(filePath) && !/\.d\.[cm]?ts$/.test(filePath);

console.log("check:pack: running npm pack --dry-run");
const out = execFileSync(
  "npm",
  ["pack", "--dry-run", "--json", "--ignore-scripts"],
  {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  },
);
const [pack] = JSON.parse(out);

console.log(
  `${pack.name}@${pack.version}: ${pack.entryCount} files, ` +
    `${pack.unpackedSize} bytes unpacked, ${pack.size} bytes packed ` +
    `(ceiling ${MAX_UNPACKED_BYTES} bytes unpacked)`,
);
for (const file of pack.files) {
  console.log(`  ${file.size}\t${file.path}`);
}

const problems = [];
if (!pack.files.some((file) => file.path.startsWith("dist/"))) {
  problems.push("no dist/ output (run `npm run build` first)");
}
for (const file of pack.files) {
  for (const { pattern, reason } of FORBIDDEN) {
    if (pattern.test(file.path)) {
      problems.push(`${file.path} (${reason})`);
    }
  }
  if (isTypeScriptSource(file.path)) {
    problems.push(`${file.path} (TypeScript source)`);
  }
}
if (pack.unpackedSize > MAX_UNPACKED_BYTES) {
  problems.push(
    `unpacked size ${pack.unpackedSize} bytes is over the ` +
      `${MAX_UNPACKED_BYTES} byte ceiling`,
  );
}

if (problems.length > 0) {
  console.error(`Package check failed (${problems.length} problems):`);
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exitCode = 1;
} else {
  console.log("Package contents OK.");
}
