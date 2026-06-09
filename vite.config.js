import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base44 from '@base44/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

function readBase44AppId() {
  try {
    const raw = fs.readFileSync(path.join(root, 'base44', '.app.jsonc'), 'utf8');
    const match = raw.match(/"id"\s*:\s*"([^"]+)"/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function readAppBuildId() {
  try {
    const raw = fs.readFileSync(path.join(root, 'src/lib/appBuild.js'), 'utf8');
    const match = raw.match(/APP_BUILD_ID\s*=\s*['"]([^'"]+)['"]/);
    return match?.[1] ?? 'dev';
  } catch {
    return 'dev';
  }
}

function writeVersionJson(buildId) {
  const out = path.join(root, 'public/version.json');
  fs.writeFileSync(
    out,
    `${JSON.stringify({ buildId, builtAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8',
  );
}

function appVersionJsonPlugin() {
  return {
    name: 'app-version-json',
    buildStart() {
      writeVersionJson(readAppBuildId());
    },
    configureServer() {
      writeVersionJson(readAppBuildId());
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  const appId = env.VITE_BASE44_APP_ID || readBase44AppId() || '';
  const appBaseUrl = env.VITE_BASE44_APP_BASE_URL || '';

  return {
    logLevel: 'error',
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      headers: {
        'Cache-Control': 'no-store',
      },
      hmr: {
        host: '192.168.1.13',
        port: 5173,
      },
      watch: {
        ignored: ['**/src/components/chats/**'],
      },
    },
    define: {
      'import.meta.env.VITE_BASE44_APP_ID': JSON.stringify(appId),
      'import.meta.env.VITE_BASE44_APP_BASE_URL': JSON.stringify(appBaseUrl),
    },
    plugins: [
      appVersionJsonPlugin(),
      base44({
        legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
        hmrNotifier: true,
        navigationNotifier: true,
        analyticsTracker: true,
        visualEditAgent: true,
      }),
      react(),
    ],
  };
});
