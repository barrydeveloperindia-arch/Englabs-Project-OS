import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

// Helper to run python script
function runPythonScript(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join('c:\\Users\\SAM\\Documents\\Antigravity\\Englabs Projects\\scripts', 'reconcile_backend.py');
    const cmd = `python "${scriptPath}" ${args.map(a => `"${a}"`).join(' ')}`;
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Python execution error:', stderr || error.message);
        reject(stderr || error.message);
      } else {
        try {
          // Find the JSON block in stdout (sometimes there are logging messages before the JSON)
          const jsonStart = stdout.indexOf('{');
          const jsonEnd = stdout.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
            resolve(JSON.parse(jsonStr));
          } else {
            resolve({ success: false, error: 'No JSON found in output', raw: stdout });
          }
        } catch (e) {
          console.error('Error parsing stdout:', stdout);
          reject('Invalid JSON response from script');
        }
      }
    });
  });
}

// Custom plugin for API server
const apiPlugin = () => ({
  name: 'api-server',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      // POST /api/reconcile
      if (req.url === '/api/reconcile' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk);
        req.on('end', async () => {
          try {
            const params = JSON.parse(body);
            let args: string[] = [];
            
            if (params.action === 'reconcile_all') {
              args = ['--reconcile-all'];
            } else if (params.action === 'reconcile_ids') {
              args = ['--reconcile-ids', ...params.ids];
            } else if (params.action === 'detect_file') {
              args = ['--detect-file', params.filePath];
            } else {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Invalid action' }));
              return;
            }
            
            const result = await runPythonScript(args);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message || err }));
          }
        });
        return;
      }
      
      // POST /api/upload
      if (req.url === '/api/upload' && req.method === 'POST') {
        const fileName = req.headers['x-file-name'] || `upload_${Date.now()}.png`;
        const uploadDir = 'c:\\Users\\SAM\\Documents\\Antigravity\\Englabs Projects\\scratch';
        fs.mkdirSync(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, fileName);
        
        const writeStream = fs.createWriteStream(filePath);
        req.pipe(writeStream);
        
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, filePath }));
        });
        req.on('error', (err: any) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
        return;
      }
      
      // GET /api/history
      if (req.url === '/api/history' && req.method === 'GET') {
        const historyFile = 'G:\\Englabs_HR Team Managements\\Site Cash Details\\update_history.json';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (fs.existsSync(historyFile)) {
          const content = fs.readFileSync(historyFile, 'utf8');
          res.end(content);
        } else {
          res.end(JSON.stringify([]));
        }
        return;
      }
      
      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiPlugin()
  ],
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**']
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', '**/src/tests/e2e/**'],
  },
})
