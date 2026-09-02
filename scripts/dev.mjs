import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const build = join(root, 'build');
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';
let building = false;
let queued = false;
const clients = new Set();

function runBuild() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const child = spawn(process.execPath, [join(root, 'scripts', 'build.mjs')], { cwd: root, stdio: 'inherit' });
  child.on('exit', () => {
    building = false;
    if (clients.size) {
      for (const response of clients) response.write('data: reload\\n\\n');
    }
    if (queued) {
      queued = false;
      runBuild();
    }
  });
}

function watchPath(path) {
  watch(path, { recursive: true }, () => runBuild());
}

function injectReload(html) {
  const client = `<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>`;
  return html.replace('</body>', `${client}</body>`);
}

const server = createServer(async (request, response) => {
  if (request.url === '/__reload') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    clients.add(response);
    request.on('close', () => clients.delete(response));
    return;
  }

  let requestPath;
  try {
    requestPath = decodeURIComponent((request.url ?? '/').split('?')[0]);
  } catch {
    response.writeHead(400).end('Bad Request');
    return;
  }

  if (!requestPath.startsWith('/')) requestPath = `/${requestPath}`;
  if (requestPath === '/') requestPath = '/index.html';

  const file = resolve(build, `.${requestPath}`);
  const relativeFile = relative(build, file);
  if (relativeFile.startsWith('..') || relativeFile === '..' || resolve(build, relativeFile) !== file) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    const content = await readFile(file);
    if (extname(file) === '.html') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(injectReload(content.toString()));
    } else {
      response.end(content);
    }
  } catch {
    response.writeHead(404).end('Not found');
  }
});

function pathSeparator() {
  return process.platform === 'win32' ? '\\\\' : '/';
}

runBuild();
watchPath(join(root, 'src'));
watchPath(join(root, 'public'));
server.listen(port, host, () => console.log(`Dev server: http://${host}:${port}`));
