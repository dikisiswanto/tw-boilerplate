import { execFile } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { build as esbuild } from 'esbuild';
import nunjucks from 'nunjucks';

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, '..');

async function runCli(file, args) {
  return execFileAsync(file, args, {
    cwd: root,
    shell: process.platform === 'win32',
  });
}

const src = resolve(root, 'src');
const build = resolve(root, 'build');
const production = process.argv.includes('--production');

const paths = {
  html: join(src, 'html', 'pages'),
  scripts: join(src, 'scripts'),
  styles: join(src, 'styles', 'main.css'),
  images: join(root, 'public', 'images'),
  fonts: join(root, 'public', 'fonts'),
};

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function copyDirectory(source, destination) {
  await ensureDir(destination);
  await cp(source, destination, { recursive: true, force: true });
}

function normalizeHtml(html) {
  return html
    .replace(/^\uFEFF/, '')
    .replace(/<!doctype\s+html>/i, '<!DOCTYPE html>')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trimEnd()
    .concat('\n');
}

async function renderHtml() {
  const env = nunjucks.configure(join(src, 'html'), {
    autoescape: true,
    noCache: true,
  });

  const entries = (await readdir(paths.html, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && extname(entry.name) === '.html')
    .map((entry) => entry.name);

  await ensureDir(build);

  for (const filename of entries) {
    const template = relative(join(src, 'html'), join(paths.html, filename));
    const output = join(build, filename);
    const rendered = env.render(template, { production });
    const html = normalizeHtml(rendered);
    await writeFile(output, html, 'utf8');
  }
}

async function buildCss() {
  const cli = join(
    root,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tailwindcss.cmd' : 'tailwindcss',
  );
  const cssDir = join(build, 'assets', 'css');
  await ensureDir(cssDir);

  const devOutput = join(cssDir, 'style.css');
  await runCli(cli, ['-i', paths.styles, '-o', devOutput]);

  const css = await readFile(devOutput, 'utf8');
  if (!css.includes('mx-auto') && !css.includes('text-5xl')) {
    throw new Error(
      'Tailwind CSS build completed but no expected utility classes were generated. Check @source paths.',
    );
  }

  if (production) {
    await runCli(cli, [
      '-i',
      paths.styles,
      '-o',
      join(cssDir, 'style.min.css'),
      '--minify',
    ]);
  } else {
    await cp(devOutput, join(cssDir, 'style.min.css'));
  }
}

async function buildJs() {
  const jsDir = join(build, 'assets', 'js');
  const tempDir = join(build, '.tmp');
  await ensureDir(jsDir);
  await ensureDir(tempDir);

  const transpiled = join(tempDir, 'script.js');
  await runCli(
    join(
      root,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'babel.cmd' : 'babel',
    ),
    [join(paths.scripts, 'main.js'), '--out-file', transpiled, '--source-maps'],
  );

  await esbuild({
    entryPoints: [transpiled],
    outfile: join(jsDir, 'script.min.js'),
    bundle: true,
    minify: production,
    sourcemap: !production,
    target: 'es2015',
    format: 'iife',
  });

  if (!production) {
    await cp(join(jsDir, 'script.min.js'), join(jsDir, 'script.js'));
  }
}

async function buildAssets() {
  await copyDirectory(paths.images, join(build, 'assets', 'img'));
  await copyDirectory(paths.fonts, join(build, 'assets', 'fonts'));
}

async function main() {
  await rm(build, { recursive: true, force: true });
  await ensureDir(build);
  await Promise.all([renderHtml(), buildCss(), buildJs(), buildAssets()]);
  await rm(join(build, '.tmp'), { recursive: true, force: true });
  console.log(
    `Build complete: ${relative(root, build)}${production ? ' (production)' : ''}`,
  );
}

await main();
