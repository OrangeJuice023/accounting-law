#!/usr/bin/env node
/**
 * Minimal static server with SPA history fallback for production-build tests.
 * Mirrors Cloudflare Pages behavior: unknown non-file paths serve index.html.
 * Usage: node scripts/serve-spa.mjs <dir> <port>
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const dir = process.argv[2] ?? 'dist';
const port = Number(process.argv[3] ?? 4174);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let pathname = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
    let file = join(dir, pathname);
    if (!file.startsWith(join(dir, '')) || !existsSync(file) || statSync(file).isDirectory()) {
      // SPA fallback (but never for missing content/assets — those are real 404s).
      if (/^\/?(content|assets)\//.test(url.pathname)) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('not found');
        return;
      }
      file = join(dir, 'index.html');
    }
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('error');
  }
});

server.listen(port, () => {
  console.log(`serve-spa: serving ${dir} at http://localhost:${port}/`);
});
