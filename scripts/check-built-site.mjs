import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const distRoot = join(repoRoot, 'dist');
const configuredBase = '/Personal_Site';

function walk(directory, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, output);
    else output.push(path);
  }
  return output;
}

function destinationFor(rawUrl, htmlPath) {
  if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(rawUrl)) return null;
  const withoutQuery = rawUrl.split(/[?#]/)[0];
  if (!withoutQuery) return null;

  let path;
  if (withoutQuery.startsWith('/')) {
    if (!withoutQuery.startsWith(configuredBase)) return null;
    const withoutBase = withoutQuery.startsWith(configuredBase)
      ? withoutQuery.slice(configuredBase.length)
      : withoutQuery;
    path = join(distRoot, decodeURIComponent(withoutBase));
  } else {
    path = resolve(dirname(htmlPath), decodeURIComponent(withoutQuery));
  }
  if (path.endsWith('/')) path = join(path, 'index.html');
  if (!extname(path) && !existsSync(path)) path = join(path, 'index.html');
  return path;
}

if (!existsSync(distRoot)) {
  throw new Error('dist/ does not exist. Run npm run build first.');
}

const files = walk(distRoot);
const htmlFiles = files.filter((path) => extname(path) === '.html');
const missing = [];
const malformed = [];

for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, 'utf8');
  const isRedirect = /<meta\s+http-equiv=["']refresh["']/i.test(html);
  if (!/<title>[^<]+<\/title>/.test(html)) malformed.push(`${relative(distRoot, htmlPath)}: missing title`);
  if (!isRedirect && !/<main\b/.test(html)) malformed.push(`${relative(distRoot, htmlPath)}: missing main landmark`);

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const target = destinationFor(match[1], htmlPath);
    if (target && !existsSync(target)) {
      missing.push(`${relative(distRoot, htmlPath)} -> ${match[1]}`);
    }
  }
}

const renderedText = htmlFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
if (/\bctfd_[a-f0-9]{32,}\b/i.test(renderedText)) malformed.push('rendered HTML contains a CTFd instance token');
if (/\bAKIA[A-Z0-9]{16}\b/.test(renderedText)) malformed.push('rendered HTML contains an AWS access-key identifier');

if (missing.length || malformed.length) {
  console.error(JSON.stringify({ missing, malformed }, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        htmlPages: htmlFiles.length,
        totalBuildFiles: files.length,
        checkedLocalLinks: true,
        checkedRenderedCredentials: true,
      },
      null,
      2,
    ),
  );
}
