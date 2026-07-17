#!/usr/bin/env node
/**
 * Vercel Build Output API v3 builder.
 * Produces .vercel/output/ so Vercel skips all framework-detection logic.
 *
 * Structure produced:
 *   .vercel/output/config.json        — routing
 *   .vercel/output/static/            — Vite frontend build
 *   .vercel/output/functions/api.func — bundled Express API
 */
import { execSync } from 'node:child_process';
import { mkdirSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(ROOT, '.vercel', 'output');
const FUNC_DIR = path.join(OUTPUT, 'functions', 'api.func');
const STATIC_DIR = path.join(OUTPUT, 'static');

// Clean previous output
rmSync(OUTPUT, { recursive: true, force: true });
mkdirSync(STATIC_DIR, { recursive: true });
mkdirSync(FUNC_DIR, { recursive: true });

// 1. Build frontend (Vite outputs to artifacts/guest-checkin/dist)
console.log('\n--- Building frontend ---');
execSync('PORT=3000 BASE_PATH=/ pnpm --filter @workspace/guest-checkin run build', {
  stdio: 'inherit',
  cwd: ROOT,
});

// 2. Copy static files into output
cpSync(path.join(ROOT, 'artifacts', 'guest-checkin', 'dist'), STATIC_DIR, { recursive: true });
console.log('✓ Static files → .vercel/output/static');

// 3. Bundle API (runs inside api-server package where esbuild is a devDep)
console.log('\n--- Bundling API ---');
execSync('pnpm --filter @workspace/api-server exec node vercel-bundle.mjs', {
  stdio: 'inherit',
  cwd: ROOT,
});

// 4. Routing config
writeFileSync(path.join(OUTPUT, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    // /api/* → Express serverless function (function sees original URL)
    { src: '/api/(.*)', dest: '/api' },
    // Serve static assets from outputDirectory
    { handle: 'filesystem' },
    // SPA fallback — all unmatched routes → index.html
    { src: '/(.*)', dest: '/index.html' },
  ],
}, null, 2));
console.log('✓ config.json written');

console.log('\n✓ .vercel/output ready\n');
