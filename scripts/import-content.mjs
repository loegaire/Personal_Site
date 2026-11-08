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
import { execSync } from 'node:child_process';
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
const outputImportedResearch = join(outputResearchRoot, 'imported');
const skillSourceRoots = [
  join(ctfRoot, 'writeups', 'ctf_skill_research', 'staging_skills'),
  join(ctfRoot, 'writeups', 'ctf_skill_research', 'backups'),
];
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
  ['Reverse Engineering', /(^|[-_/ ])(rev|reverse|reversing|crackme|re\d)([-_/ ]|$)/i],
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

const tagMatchers = [
  ['ghidra', /\bghidra\b/i],
  ['ida', /\bida pro\b|\bidapro\b/i],
  ['gdb', /\bgdb\b/i],
  ['pwntools', /\bpwntools\b/i],
  ['angr', /\bangr\b/i],
  ['z3', /\bz3\b/i],
  ['volatility', /\bvolatility\b|\bvolshell\b/i],
  ['wireshark', /\bwireshark\b|\btshark\b/i],
  ['burp', /\bburp suite?\b/i],
  ['frida', /\bfrida\b/i],
  ['docker', /\bdocker\b|\bcontainerd\b|\bpodman\b/i],
  ['xss', /\bxss\b|cross-site scripting/i],
  ['sqli', /\bsqli\b|sql injection/i],
  ['ssrf', /\bssrf\b/i],
  ['jwt', /\bjwt\b|json web token/i],
  ['oauth', /\boauth\b/i],
  ['ssti', /\bssti\b|template injection/i],
  ['deserialization', /deseriali[sz]ation/i],
  ['buffer-overflow', /buffer overflow|\bbof\b/i],
  ['format-string', /format string|format-string/i],
  ['ret2libc', /ret2libc|return-to-libc/i],
  ['rop', /\brop chain\b|\brop\b/i],
  ['heap', /\bheap (overflow|exploit|grooming)\b|\btcache\b|\bfastbin\b/i],
  ['shellcode', /\bshellcode\b/i],
  ['sandbox-escape', /sandbox escape|\bseccomp\b/i],
  ['wasm', /\bwasm\b|web assembly/i],
  ['android', /\bandroid\b|\bapk\b/i],
  ['pcap', /\bpcap(ng)?\b/i],
  ['memory-forensics', /memory (dump|forensics)|\bmem\.raw\b/i],
  ['stego', /\bstego\b|steganograph/i],
  ['rsa', /\brsa\b/i],
  ['aes', /\baes-?\d*\b/i],
  ['ecc', /\becc\b|elliptic curve/i],
  ['lattice', /\blattice\b/i],
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
let gitDateMap = null;

function buildGitDateMap(root) {
  const dateSource = process.env.IMPORT_DATE_SOURCE || 'auto';
  if (dateSource === 'stat') return null;
  const wantsGit = dateSource === 'git' || existsSync(join(root, '.git'));
  if (!wantsGit) return null;
  let log;
  try {
    log = execSync('git log --reverse --format=__COMMIT__%cI --name-only --diff-filter=AM', {
      cwd: root,
      maxBuffer: 256 * 1024 * 1024,
      encoding: 'utf8',
    });
  } catch {
    return null;
  }
  const map = new Map();
  let commitDate = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('__COMMIT__')) {
      commitDate = line.slice('__COMMIT__'.length);
    } else if (line && commitDate) {
      const name = line.replace(/\r$/, '');
      if (!map.has(name)) map.set(name, { first: commitDate });
      map.get(name).last = commitDate;
    }
  }
  return map;
}

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

function inferTags(path, markdown, category, event, kind) {
  const sample = `${path}\n${markdown.slice(0, 20000)}`;
  const technique = tagMatchers
    .filter(([, matcher]) => matcher.test(sample))
    .map(([tag]) => tag)
    .slice(0, 5);
  const kindLabel = kind === 'field-note' ? 'Field notes' : 'Writeup';
  return [...new Set([category, event, kindLabel, ...technique])].slice(0, 8);
}

const skillCategoryPatterns = [
  ['Reverse Engineering', /(^|[-_])(ctf-)?reverse/],
  ['Binary Exploitation', /(^|[-_])(ctf-)?pwn/],
  ['Cryptography', /(^|[-_])(ctf-)?crypto/],
  ['Web Security', /(^|[-_])(ctf-)?web/],
  ['Forensics', /(^|[-_])(ctf-)?forensic/],
  ['Malware Analysis', /(^|[-_])(ctf-)?malware/],
  ['OSINT', /(^|[-_])(ctf-)?osint/],
  ['Mobile', /(^|[-_])(ctf-)?(mobile|android)/],
];

function parseSkillFrontmatter(raw) {
  const meta = {};
  if (!raw.startsWith('---\n')) return meta;
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return meta;
  for (const line of raw.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.+)$/);
    if (match) meta[match[1].toLowerCase()] = match[2].trim();
  }
  return meta;
}

function importSkillDocuments(sourceRoots, seenHashes, usedSlugs, manifest) {
  for (const sourceRoot of sourceRoots) {
    if (!existsSync(sourceRoot)) continue;
    const files = walk(sourceRoot)
      .filter((path) => extname(path).toLowerCase() === '.md')
      .sort();
    for (const sourcePath of files) {
      const stats = statSync(sourcePath);
      if (stats.size < 64 || stats.size > 1_500_000) continue;
      const raw = readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
      const meta = parseSkillFrontmatter(raw);
      let body = splitFrontmatter(raw);
      if (!body.trim()) continue;
      const hash = createHash('sha256').update(body.trim()).digest('hex');
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);

      const relParts = relative(sourceRoot, sourcePath).split(sep);
      if (/^broad-ctf-skills/i.test(relParts[0] || '')) relParts.shift();
      const stem = basename(sourcePath, extname(sourcePath));
      const genericName = /^(skill|readme|security)$/i.test(stem);
      const seedParts = genericName ? relParts.slice(0, -1) : relParts;
      let slug = `skill-${slugify(seedParts.join('/').replace(/\.md$/i, '')) || 'skill'}`;
      if (usedSlugs.has(slug)) slug = `${slug}-${hash.slice(0, 7)}`;
      usedSlugs.add(slug);

      const labelSource = meta.name || (genericName ? seedParts.at(-1) : stem);
      const title = titleCase(String(labelSource).replace(/[-_]+/g, ' '));
      const categorySeed = `${seedParts.join(' ')} ${stem}`;
      const category = skillCategoryPatterns.find(([, matcher]) =>
        matcher.test(categorySeed.split(/[\\/]/)[0]),
      )?.[0] || 'Miscellaneous';

      body = rewriteAssets(body, sourcePath, 'research', slug);
      body = sanitiseSecrets(body);
      body = normaliseCodeFences(body);

      const relForGit = relative(ctfRoot, sourcePath).split(sep).join('/');
      const gitDates = gitDateMap?.get(relForGit);
      const published = gitDates?.first ? new Date(gitDates.first) : stats.birthtimeMs > 0 ? stats.birthtime : stats.mtime;
      const updated = gitDates?.last ? new Date(gitDates.last) : stats.mtime;
      const plain = stripMarkdown(body);
      const wordCount = plain ? plain.split(/\s+/).length : 0;
      const technique = tagMatchers
        .filter(([, matcher]) => matcher.test(`${sourcePath}\n${body.slice(0, 20000)}`))
        .map(([tag]) => tag)
        .slice(0, 4);
      let description = meta.description || inferDescription(body, title, 'reference');
      if (description.length > 210) description = `${description.slice(0, 207).trim()}…`;
      const metadata = {
        title,
        description,
        published: published.toISOString().slice(0, 10),
        updated: updated.toISOString().slice(0, 10),
        event: 'Agentic Skills',
        category,
        kind: 'skill',
        status: 'reference',
        tags: [...new Set(['agentic_skill', category, 'Agentic Skills', ...technique])].slice(0, 8),
        readingTime: Math.max(1, Math.ceil(wordCount / 220)),
        wordCount,
        featured: false,
        sourcePath: `~/ctf/${relForGit}`,
      };

      mkdirSync(outputImportedResearch, { recursive: true });
      writeFileSync(join(outputImportedResearch, `${slug}.md`), formatDocument(metadata, body));
      manifest.push({ collection: 'research', slug, output: `research/${slug}.md`, ...metadata });
    }
  }
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
    const relForGit = baseRoot === ctfRoot ? relative(ctfRoot, sourcePath).split(sep).join('/') : null;
    const gitDates = relForGit ? gitDateMap?.get(relForGit) : null;
    const published = gitDates?.first ? new Date(gitDates.first) : stats.birthtimeMs > 0 ? stats.birthtime : stats.mtime;
    const updated = gitDates?.last ? new Date(gitDates.last) : stats.mtime;
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
      tags: inferTags(sourcePath, body, category, event, kind),
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
    outputImportedResearch,
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
    gitDateMap = buildGitDateMap(ctfRoot);
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
  if (skillSourceRoots.some((root) => existsSync(root))) {
    rmSync(outputImportedResearch, { recursive: true, force: true });
    importSkillDocuments(skillSourceRoots, seenHashes, new Set(), manifest);
  }

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
    generatedAt: process.env.IMPORT_GENERATED_AT ? new Date(process.env.IMPORT_GENERATED_AT).toISOString() : new Date().toISOString(),
    agenticSkills: manifest.filter((entry) => entry.kind === 'skill').length,
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
