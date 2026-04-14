import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const buildOutputCandidates = [
  resolve(projectRoot, 'dist', 'budgetwise-ui', 'browser'),
  resolve(projectRoot, 'dist', 'budgetwise-ui'),
];

const sentryDsn = process.env.SENTRY_DSN?.trim();
const sentryOrg = process.env.SENTRY_ORG?.trim();
const sentryProject = process.env.SENTRY_PROJECT?.trim();

if (!sentryDsn) {
  console.log('Skipping Sentry source map upload because SENTRY_DSN is not set.');
  process.exit(0);
}

if (!sentryOrg || !sentryProject) {
  console.warn(
    'Skipping Sentry source map upload because SENTRY_ORG or SENTRY_PROJECT is not set.',
  );
  process.exit(0);
}

const buildOutputDirectory = buildOutputCandidates.find((candidate) =>
  existsSync(candidate),
);

if (!buildOutputDirectory) {
  console.warn('Skipping Sentry source map upload because no frontend build output was found.');
  process.exit(0);
}

const collectMapFiles = (directory) => {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectMapFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.map')) {
      files.push(fullPath);
    }
  }

  return files;
};

const sourceMapFiles = collectMapFiles(buildOutputDirectory);

if (sourceMapFiles.length === 0) {
  console.warn('Skipping Sentry source map upload because no source maps were generated.');
  process.exit(0);
}

const sentryCliBinary = resolve(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'sentry-cli.cmd' : 'sentry-cli',
);

if (!existsSync(sentryCliBinary) || !statSync(sentryCliBinary).isFile()) {
  console.warn('Skipping Sentry source map upload because sentry-cli is unavailable.');
  process.exit(0);
}

const baseCommandOptions = {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
};

execFileSync(
  sentryCliBinary,
  ['sourcemaps', 'inject', buildOutputDirectory],
  baseCommandOptions,
);

execFileSync(
  sentryCliBinary,
  [
    'sourcemaps',
    'upload',
    '--org',
    sentryOrg,
    '--project',
    sentryProject,
    '--validate',
    buildOutputDirectory,
  ],
  baseCommandOptions,
);

for (const sourceMapFile of sourceMapFiles) {
  rmSync(sourceMapFile);
}

console.log(
  `Uploaded ${sourceMapFiles.length} source maps to Sentry and removed them from the build output.`,
);
