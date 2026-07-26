import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const ctfRoot = resolve(process.env.CTF_ROOT || join(homedir(), 'ctf'));
const legacyWriteups = join(repoRoot, 'content', 'writeups');
const legacyResearch = join(repoRoot, 'content', 'research');
const outputWriteupsRoot = join(repoRoot, 'src', 'content', 'writeups');
const outputImportedWriteups = join(outputWriteupsRoot, 'imported');
const outputLocalWriteups = join(outputWriteupsRoot, 'local');
const outputResearchRoot = join(repoRoot, 'src', 'content', 'research');
const outputLocalResearch = join(outputResearchRoot, 'local');
const publicMedia = join(repoRoot, 'public', 'media');
const dataDir = join(repoRoot, 'src', 'data');
const siteBase = (process.env.SITE_BASE || '/Personal_Site').replace(/\/$/, '');

const excludedSegments = new Set([
  '.git',
  '.claude',
  '.codex',
  '.penhub',
  '.venv',
  'venv',
  'node_modules',
  'site-packages',
  'scratch',
  'target',
  'vendor',
  'dist',
  'build',
  '__pycache__',
  '.mypy_cache',
  '.pytest_cache',
  'ctf_skill_research',
  'artifacts',
  'extracted',
]);

const categoryMatchers = [
  ['Reverse Engineering', /(^|[-_/ ])(rev|reverse|reversing|crackme)([-_/ ]|$)/i],
  ['Binary Exploitation', /(^|[-_/ ])(pwn|binary|bof|heap|rop)([-_/ ]|$)/i],
  ['Cryptography', /(^|[-_/ ])(crypto|cryptography|cipher|rsa|aes)([-_/ ]|$)/i],
  ['Forensics', /(^|[-_/ ])(forensic|forensics|dfir|memory|pcap)([-_/ ]|$)/i],
  ['Web Security', /(^|[-_/ ])(web|xss|sqli|ssrf|http)([-_/ ]|$)/i],
  ['Blockchain', /(^|[-_/ ])(blockchain|web3|solidity|ethernaut)([-_/ ]|$)/i],
  ['OSINT', /(^|[-_/ ])(osint|geolocation)([-_/ ]|$)/i],
  ['Mobile', /(^|[-_/ ])(mobile|android|apk|ios)([-_/ ]|$)/i],
  ['Hardware / RF', /(^|[-_/ ])(hardware|rf|iot|can|scada|automotive)([-_/ ]|$)/i],
  ['AI', /(^|[-_/ ])(ai|machine learning|model)([-_/ ]|$)/i],
  ['Miscellaneous', /(^|[-_/ ])(misc|jail|puzzle|minecraft)([-_/ ]|$)/i],
];

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg']);
const attachmentExtensions = new Set([
  ...imageExtensions,
  '.pdf',
  '.py',
  '.js',
  '.mjs',
  '.ts',
  '.sh',
  '.txt',
  '.json',
  '.yaml',
  '.yml',
]);
const copiedAssets = new Map();
const redactions = { instanceTokens: 0, cloudCredentials: 0, bearerTokens: 0 };

function walk(directory, output = []) {
  if (!existsSync(directory)) return output;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (excludedSegments.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, output);
    else output.push(path);
  }
  return output;
}

function isAuthoredCtfDocument(path) {
  if (extname(path).toLowerCase() !== '.md') return false;
  const stats = statSync(path);
  if (stats.size < 64 || stats.size > 1_500_000) return false;
  const rel = relative(ctfRoot, path);
  const parts = rel.split(sep);
  if (parts.some((part) => excludedSegments.has(part))) return false;

  if (parts[0] === 'writeups' && parts.length === 2) {
    return !['readme.md', 'ctf.md'].includes(basename(path).toLowerCase());
  }

  const name = basename(path).toLowerCase();
  if (name === 'readme.md') {
    const markdown = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
    const solutionStart = markdown.search(/^## Solution\s*$/im);
    if (solutionStart === -1) return false;
    return stripMarkdown(markdown.slice(solutionStart)).length >= 80;
  }

  return (
    /^notes(?:[-_ ].*)?\.md$/.test(name) ||
    /writeup/.test(name) ||
    name === 'wu.md' ||
    name === 'report.md' ||
    /solution/.test(name)
  );
}

function splitFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return markdown;
  const end = markdown.indexOf('\n---\n', 4);
  return end === -1 ? markdown : markdown.slice(end + 5);
}

function normaliseExportedReadme(markdown, sourcePath) {
  if (basename(sourcePath).toLowerCase() !== 'readme.md' || !markdown.includes('\\r\\n')) {
    return markdown;
  }

  return markdown
    .replace(/(?:\\x[0-9a-f]{2}){2,}/gi, (escapedBytes) => {
      const bytes = escapedBytes
        .split('\\x')
        .filter(Boolean)
        .map((value) => Number.parseInt(value, 16));
      return Buffer.from(bytes).toString('utf8');
    })
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n');
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[\[[^\]]+\]\]/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[>*+-]\s+/gm, '')
    .replace(/[`*_~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 110);
}

function inferTitle(markdown, path, baseRoot) {
  const heading = markdown.match(/^#\s+(.{2,180})$/m)?.[1]?.trim();
  if (heading && !/^(notes?|writeups?|solution|analysis report)$/i.test(heading)) return heading;

  const relParts = relative(baseRoot, path).split(sep);
  const stem = basename(path, extname(path));
  const parent = relParts.at(-2) || stem;
  const derived = /^(notes?|writeups?|wu|report|solution)$/i.test(stem) ? parent : stem;
  const label = /note/i.test(stem) ? 'Field Notes' : /article/i.test(stem) ? 'Article' : 'Writeup';
  return `${titleCase(derived)} — ${label}`;
}

function inferEvent(path, baseRoot) {
  const relParts = relative(baseRoot, path).split(sep);
  if (baseRoot === legacyResearch) return 'Research';
  if (baseRoot === legacyWriteups) {
    const match = basename(path).match(/^\(([^)]+)\)/);
    return match ? match[1].replace(/[-_]/g, ' ') : 'Archive';
  }
  const event = relParts[0] || 'CTF';
  if (event === 'writeups') {
    const match = basename(path).match(/^\(([^)]+)\)/);
    return match ? match[1].replace(/[-_]/g, ' ') : 'CTF Archive';
  }
  return event;
}

function inferCategory(path, markdown, kind) {
  if (kind === 'research') return 'Research';
  const pathCategory = categoryMatchers.find(([, matcher]) => matcher.test(path))?.[0];
  if (pathCategory) return pathCategory;
  return categoryMatchers.find(([, matcher]) => matcher.test(markdown.slice(0, 5000)))?.[0] || 'Miscellaneous';
}

function inferKind(path, baseRoot) {
  if (baseRoot === legacyResearch) return 'research';
  const name = basename(path).toLowerCase();
  if (name.includes('article')) return 'article';
  if (name.startsWith('notes') || name === 'report.md') return 'field-note';
  return 'writeup';
}

function inferStatus(markdown, kind) {
  const sample = markdown.slice(0, 12_000);
  const partial = /\b(in progress|unsolved|pending|not verified|partial|blocked)\b/i.test(sample);
  const solved = /\b(solved|verified|final flag|recovered flag)\b/i.test(sample) || /\b[A-Z0-9_]{2,18}\{[^}\n]{3,160}\}/.test(sample);
  if (partial && !solved) return 'partial';
  if (solved || kind === 'writeup') return 'solved';
  return 'reference';
}

function inferDescription(markdown, title, status) {
  const body = splitFrontmatter(markdown);
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => stripMarkdown(paragraph))
    .filter((paragraph) => paragraph.length > 45 && !paragraph.startsWith(title));
  let description = paragraphs[0] || `${status === 'partial' ? 'Working notes' : 'Technical notes'} from ${title}.`;
  description = description.replace(/^Description\s*>?\s*#{1,6}\s*English\s*/i, '');
  description = description.replace(/\b(?:[A-Z0-9_]{2,18})\{[^}\n]{3,160}\}/g, '[flag omitted from preview]');
  return description.length > 210 ? `${description.slice(0, 207).trim()}…` : description;
}

function sanitiseSecrets(markdown) {
  let output = markdown;
  output = output.replace(/\bctfd_[a-f0-9]{32,}\b/gi, () => {
    redactions.instanceTokens += 1;
    return '[redacted instance token]';
  });
  output = output.replace(/\bAKIA[A-Z0-9]{16}\b/g, () => {
    redactions.cloudCredentials += 1;
    return 'AKIA…REDACTED';
  });
  output = output.replace(
    /((?:aws_secret_access_key|aws_session_token)\s*[:=]\s*)(["']?)[^\s"'`]+/gi,
    (_, prefix) => {
      redactions.cloudCredentials += 1;
      return `${prefix}[redacted]`;
    },
  );
  output = output.replace(/\bBearer\s+[A-Za-z0-9._~+/-]{24,}=*/g, () => {
    redactions.bearerTokens += 1;
    return 'Bearer [redacted]';
  });
  return output;
}

function assetUrl(group, slug, filename) {
  return `${siteBase}/media/${group}/${slug}/${encodeURIComponent(filename).replace(/%2F/gi, '/')}`;
}

function copyAsset(source, group, slug) {
  if (!existsSync(source) || !statSync(source).isFile()) return null;
  const extension = extname(source).toLowerCase();
  if (!attachmentExtensions.has(extension)) return null;
  const limit = imageExtensions.has(extension) || extension === '.pdf' ? 15_000_000 : 2_000_000;
  if (statSync(source).size > limit) return null;

  const key = resolve(source);
  if (copiedAssets.has(key)) return copiedAssets.get(key);
  const filename = basename(source);
  const destinationDirectory = join(publicMedia, group, slug);
  mkdirSync(destinationDirectory, { recursive: true });
  copyFileSync(source, join(destinationDirectory, filename));
  const url = assetUrl(group, slug, filename);
  copiedAssets.set(key, url);
  return url;
}

function rewriteAssets(markdown, sourcePath, group, slug) {
  let output = markdown.replace(/!\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, '![]($1)');
  const replaceTarget = (full, prefix, rawTarget, suffix = '') => {
    const target = rawTarget.trim().replace(/^<|>$/g, '');
    if (/^(?:https?:|data:|#)/i.test(target)) return full;
    const decoded = decodeURIComponent(target.split(/[?#]/)[0]);
    const localHomeTarget = decoded.startsWith('~/') ? join(homedir(), decoded.slice(2)) : null;
    const source = localHomeTarget || (decoded.startsWith('/') ? decoded : resolve(dirname(sourcePath), decoded));
    const copied = copyAsset(source, group, slug);
    if (copied) return `${prefix}${copied}${suffix}`;
    if (decoded.startsWith('/')) return full;
    if (imageExtensions.has(extname(decoded).toLowerCase())) {
      return `${prefix}${siteBase}/media/missing-attachment.svg${suffix}`;
    }
    return full;
  };

  output = output.replace(/(!\[[^\]]*]\()([^)]+)(\))/g, replaceTarget);
  output = output.replace(/(?<!!)(\[[^\]]+]\()([^)]+)(\))/g, replaceTarget);
  output = output.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, replaceTarget);
  return output;
}

function normaliseCodeFences(markdown) {
  const aliases = new Map([
    ['c', 'c'],
    ['c++', 'cpp'],
    ['python', 'python'],
    ['gdb', 'shell'],
    ['binary', 'text'],
    ['au', 'text'],
  ]);
  return markdown.replace(/^[ \t]*```[ \t]*([A-Za-z][\w+-]*)[^\n]*$/gm, (full, language) => {
    if (full.slice(3).includes('```')) return full;
    if (!language) return full;
    const normalised = aliases.get(language.toLowerCase());
    return normalised ? `\`\`\`${normalised}` : `\`\`\`${language.toLowerCase()}`;
  });
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function formatDocument(metadata, body) {
  const tags = `[${metadata.tags.map(yamlString).join(', ')}]`;
  return `---
title: ${yamlString(metadata.title)}
description: ${yamlString(metadata.description)}
published: ${yamlString(metadata.published)}
updated: ${yamlString(metadata.updated)}
event: ${yamlString(metadata.event)}
category: ${yamlString(metadata.category)}
kind: ${yamlString(metadata.kind)}
status: ${yamlString(metadata.status)}
tags: ${tags}
readingTime: ${metadata.readingTime}
wordCount: ${metadata.wordCount}
featured: ${metadata.featured}
sourcePath: ${yamlString(metadata.sourcePath)}
---

${body.trim()}
`;
}

function importDocuments(candidates, baseRoot, group, outputDirectory, seenHashes, usedSlugs, manifest) {
  for (const sourcePath of candidates) {
    const raw = readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
    const bodyWithoutFrontmatter = normaliseExportedReadme(splitFrontmatter(raw), sourcePath);
    if (!bodyWithoutFrontmatter.trim()) continue;
    const hash = createHash('sha256').update(bodyWithoutFrontmatter.trim()).digest('hex');
    if (seenHashes.has(hash)) continue;
    seenHashes.add(hash);

    const kind = inferKind(sourcePath, baseRoot);
    const title = inferTitle(bodyWithoutFrontmatter, sourcePath, baseRoot);
    const rel = relative(baseRoot, sourcePath);
    const genericName = /^(notes?|writeups?|wu|report|solution|readme)$/i.test(
      basename(sourcePath, extname(sourcePath)),
    );
    const slugSeed = genericName ? rel.replace(/[\\/][^\\/]+$/, '') : rel.replace(/\.md$/i, '');
    let slug = slugify(slugSeed) || slugify(title);
    if (usedSlugs.has(slug)) slug = `${slug}-${hash.slice(0, 7)}`;
    usedSlugs.add(slug);

    let body = rewriteAssets(bodyWithoutFrontmatter, sourcePath, group, slug);
    body = sanitiseSecrets(body);
    body = normaliseCodeFences(body);

    const stats = statSync(sourcePath);
    const published = stats.birthtimeMs > 0 ? stats.birthtime : stats.mtime;
    const updated = stats.mtime;
    const plain = stripMarkdown(body);
    const wordCount = plain ? plain.split(/\s+/).length : 0;
    const status = inferStatus(body, kind);
    const event = inferEvent(sourcePath, baseRoot);
    const category = inferCategory(sourcePath, body, kind);
    const sourcePathLabel =
      baseRoot === ctfRoot
        ? `~/ctf/${relative(ctfRoot, sourcePath).split(sep).join('/')}`
        : baseRoot === legacyWriteups
          ? `content/writeups/${relative(baseRoot, sourcePath).split(sep).join('/')}`
          : `content/research/${relative(baseRoot, sourcePath).split(sep).join('/')}`;
    const featured =
      status === 'solved' &&
      wordCount >= 700 &&
      !/notes/i.test(basename(sourcePath)) &&
      manifest.filter((entry) => entry.featured).length < 6;
    const metadata = {
      title,
      description: inferDescription(body, title, status),
      published: published.toISOString().slice(0, 10),
      updated: updated.toISOString().slice(0, 10),
      event,
      category,
      kind,
      status,
      tags: [...new Set([category, event, kind === 'field-note' ? 'Field notes' : 'Writeup'])],
      readingTime: Math.max(1, Math.ceil(wordCount / 220)),
      wordCount,
      featured,
      sourcePath: sourcePathLabel,
    };

    mkdirSync(outputDirectory, { recursive: true });
    writeFileSync(join(outputDirectory, `${slug}.md`), formatDocument(metadata, body));
    manifest.push({ collection: group, slug, output: `${group}/${slug}.md`, ...metadata });
  }
}

function seedExistingDocuments(directory, seenHashes, usedSlugs) {
  if (!existsSync(directory)) return;
  for (const path of walk(directory).filter((entry) => extname(entry).toLowerCase() === '.md')) {
    const raw = readFileSync(path, 'utf8');
    const body = splitFrontmatter(raw);
    seenHashes.add(createHash('sha256').update(body.trim()).digest('hex'));
    usedSlugs.add(relative(directory, path).replace(/\.md$/i, '').split(sep).join('/'));
  }
}

function removeLegacyFlatGeneratedFiles(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      rmSync(join(directory, entry.name), { force: true });
    }
  }
}

function main() {
  for (const path of [
    outputWriteupsRoot,
    outputImportedWriteups,
    outputLocalWriteups,
    outputResearchRoot,
    outputLocalResearch,
    publicMedia,
    dataDir,
  ]) {
    mkdirSync(path, { recursive: true });
  }
  removeLegacyFlatGeneratedFiles(outputWriteupsRoot);
  removeLegacyFlatGeneratedFiles(outputResearchRoot);
  rmSync(outputLocalWriteups, { recursive: true, force: true });
  rmSync(outputLocalResearch, { recursive: true, force: true });

  const hasLocalCtfArchive = existsSync(ctfRoot);
  const ctfFiles = hasLocalCtfArchive ? walk(ctfRoot).filter(isAuthoredCtfDocument).sort() : [];
  const legacyWriteupFiles = existsSync(legacyWriteups)
    ? walk(legacyWriteups)
        .filter(
          (path) =>
            extname(path).toLowerCase() === '.md' &&
            !basename(path).startsWith('_') &&
            !(dirname(path) === legacyWriteups && basename(path).toLowerCase() === 'readme.md'),
        )
        .sort()
    : [];
  const researchFiles = existsSync(legacyResearch)
    ? walk(legacyResearch).filter((path) => extname(path).toLowerCase() === '.md').sort()
    : [];

  const seenHashes = new Set();
  const usedWriteupSlugs = new Set();
  const manifest = [];
  if (hasLocalCtfArchive) {
    rmSync(outputImportedWriteups, { recursive: true, force: true });
    importDocuments(
      ctfFiles,
      ctfRoot,
      'writeups',
      outputImportedWriteups,
      seenHashes,
      usedWriteupSlugs,
      manifest,
    );
  } else {
    seedExistingDocuments(outputImportedWriteups, seenHashes, usedWriteupSlugs);
  }
  importDocuments(
    legacyWriteupFiles,
    legacyWriteups,
    'writeups',
    outputLocalWriteups,
    seenHashes,
    usedWriteupSlugs,
    manifest,
  );
  importDocuments(
    researchFiles,
    legacyResearch,
    'research',
    outputLocalResearch,
    seenHashes,
    new Set(),
    manifest,
  );

  const pdfPath = join(legacyWriteups, '2026 Hacktheon Sejong.pdf');
  if (existsSync(pdfPath)) {
    const slug = 'hacktheon-sejong-2026';
    const attachment = copyAsset(pdfPath, 'writeups', slug);
    const stats = statSync(pdfPath);
    const metadata = {
      title: 'Hacktheon Sejong 2026',
      description: 'Competition notes and writeup preserved as a downloadable PDF.',
      published: stats.birthtime.toISOString().slice(0, 10),
      updated: stats.mtime.toISOString().slice(0, 10),
      event: 'Hacktheon Sejong 2026',
      category: 'Miscellaneous',
      kind: 'writeup',
      status: 'reference',
      tags: ['Miscellaneous', 'Hacktheon Sejong 2026', 'PDF'],
      readingTime: 1,
      wordCount: 0,
      featured: false,
      sourcePath: 'legacy-site/2026 Hacktheon Sejong.pdf',
      attachment,
    };
    const markdown = formatDocument(metadata, `The original writeup is available as a [PDF download](${attachment}).`);
    writeFileSync(join(outputLocalWriteups, `${slug}.md`), markdown);
    manifest.push({ collection: 'writeups', slug, output: `writeups/${slug}.md`, ...metadata });
  }

  const stats = {
    generatedAt: new Date().toISOString(),
    scannedCtfDocuments: ctfFiles.length,
    importedWriteups: manifest.filter((entry) => entry.collection === 'writeups').length,
    importedResearch: manifest.filter((entry) => entry.collection === 'research').length,
    copiedAssets: copiedAssets.size,
    redactions,
    byCategory: Object.fromEntries(
      [...new Set(manifest.map((entry) => entry.category))]
        .sort()
        .map((category) => [category, manifest.filter((entry) => entry.category === category).length]),
    ),
    byEvent: Object.fromEntries(
      [...new Set(manifest.map((entry) => entry.event))]
        .sort()
        .map((event) => [event, manifest.filter((entry) => entry.event === event).length]),
    ),
  };

  writeFileSync(join(dataDir, 'content-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(dataDir, 'content-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
  console.log(JSON.stringify(stats, null, 2));
}

main();
