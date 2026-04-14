import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const environmentsDir = resolve(projectRoot, 'src', 'environments');
const targetPath = resolve(environmentsDir, 'environment.prod.ts');
const examplePath = resolve(environmentsDir, 'environment.prod.example.ts');

const apiUrl = process.env.BUDGETWISE_API_URL?.trim();
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const sentryDsn = process.env.SENTRY_DSN?.trim() ?? '';

mkdirSync(dirname(targetPath), { recursive: true });

if (apiUrl && supabaseUrl && supabaseAnonKey) {
  const generatedEnvironment = `export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(apiUrl)},
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
  sentryDsn: ${JSON.stringify(sentryDsn)},
};
`;

  writeFileSync(targetPath, generatedEnvironment, 'utf8');
  console.log('Generated src/environments/environment.prod.ts from deployment environment variables.');
} else if (!existsSync(targetPath)) {
  copyFileSync(examplePath, targetPath);
  console.warn(
    'Missing BUDGETWISE_API_URL, SUPABASE_URL, or SUPABASE_ANON_KEY. Using placeholder production environment values.',
  );
} else {
  const existingContent = readFileSync(targetPath, 'utf8');
  const placeholderContent = readFileSync(examplePath, 'utf8');

  if (existingContent === placeholderContent) {
    console.warn(
      'Building with placeholder production environment values. Set BUDGETWISE_API_URL, SUPABASE_URL, and SUPABASE_ANON_KEY for a real deployment build.',
    );
  } else {
    console.log('Using existing src/environments/environment.prod.ts.');
  }
}
