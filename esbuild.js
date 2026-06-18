const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['agency_workspace/src/extension.ts', 'agency_workspace/src/mcp-server.ts'],
  bundle: true,
  outdir: 'dist',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  sourcemap: true,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
