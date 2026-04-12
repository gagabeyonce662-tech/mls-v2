import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { join, resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'source-code-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/api/code')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const filePath = url.searchParams.get('file');
            const lineStr = url.searchParams.get('line');
            
            if (!filePath) {
              res.statusCode = 400;
              return res.end('Missing file parameter');
            }

            try {
              // The explorer is in <root>/graph-explorer, files are in <root>/
              const projectRoot = resolve(__dirname, '..');
              const fullPath = join(projectRoot, filePath);
              const content = readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');

              const targetLine = lineStr ? parseInt(lineStr.replace('L', '')) : 1;
              const start = Math.max(0, targetLine - 10);
              const end = Math.min(lines.length, targetLine + 50);
              
              const snippet = lines.slice(start, end).join('\n');

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                snippet,
                startLine: start + 1,
                targetLine
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(`Error reading file: ${err}`);
            }
            return;
          }
          next();
        });
      }
    }
  ],
})
