const { cpSync, existsSync } = require('node:fs');
const path = require('node:path');

const webpackRoot = path.resolve(__dirname, '..', '.webpack');
const architectureOutput = path.join(webpackRoot, process.arch);

if (!existsSync(architectureOutput)) {
  throw new Error(
    `Forge webpack output is missing for ${process.arch}: ${architectureOutput}`,
  );
}

// Forge packages into an architecture subdirectory. Electron source launches resolve
// the package main from .webpack/main, so mirror that fresh output after packaging.
for (const directory of ['main', 'renderer']) {
  cpSync(
    path.join(architectureOutput, directory),
    path.join(webpackRoot, directory),
    {
      force: true,
      recursive: true,
    },
  );
}
