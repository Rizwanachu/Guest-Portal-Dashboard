#!/usr/bin/env node
/**
 * Bundles api/index.ts (Express app) for Vercel's Build Output API.
 * Must run inside the api-server workspace package so esbuild is resolvable.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

// Allow any bundled CJS packages to use require()
globalThis.require = createRequire(import.meta.url);

const API_SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(API_SERVER_DIR, '../..');
const FUNC_DIR = path.join(ROOT, '.vercel', 'output', 'functions', 'api.func');

const { build } = await import('esbuild');
const { default: esbuildPluginPino } = await import('esbuild-plugin-pino');

await build({
  entryPoints: [path.join(ROOT, 'api', 'index.ts')],
  platform: 'node',
  bundle: true,
  format: 'esm',
  outdir: FUNC_DIR,
  outExtension: { '.js': '.mjs' },
  // Keep the same externals as the existing build.mjs — native/huge packages
  // that can't be bundled. Everything actually used by this project will be inlined.
  external: [
    '*.node',
    'pg-native',
    'bufferutil',
    'utf-8-validate',
    'sharp', 'canvas', 'bcrypt', 'argon2', 'fsevents', 're2',
    'farmhash', 'xxhash-addon', 'ssh2', 'cpu-features', 'dtrace-provider',
    'isolated-vm', 'lightningcss', 'oracledb', 'mongodb-client-encryption',
    'knex', 'typeorm', 'protobufjs', 'onnxruntime-node',
    '@tensorflow/*', '@prisma/client', '@mikro-orm/*', '@grpc/*', '@swc/*',
    '@aws-sdk/*', '@azure/*', '@opentelemetry/*', '@google-cloud/*', '@google/*',
    'googleapis', 'firebase-admin', '@parcel/watcher', '@sentry/profiling-node',
    'aws-sdk', 'classic-level', 'dd-trace', 'ffi-napi', 'grpc', 'hiredis',
    'kerberos', 'leveldown', 'miniflare', 'mysql2', 'newrelic', 'odbc',
    'piscina', 'realm', 'ref-napi', 'rocksdb', 'sequelize', 'serialport',
    'snappy', 'tinypool', 'usb', 'workerd', 'wrangler', 'zeromq',
    'playwright', 'puppeteer', 'electron',
  ],
  // CJS-in-ESM compatibility shim (same as the existing build.mjs)
  banner: {
    js: `import { createRequire as __cr } from 'node:module';
import __path from 'node:path';
import __url from 'node:url';
globalThis.require = __cr(import.meta.url);
globalThis.__filename = __url.fileURLToPath(import.meta.url);
globalThis.__dirname = __path.dirname(globalThis.__filename);
`,
  },
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
  logLevel: 'info',
});

// Vercel Build Output API function manifest
writeFileSync(path.join(FUNC_DIR, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
}));

console.log('✓ API → .vercel/output/functions/api.func');
