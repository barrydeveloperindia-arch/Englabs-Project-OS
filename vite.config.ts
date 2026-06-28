import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


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
        const historyFile = 'G:\\HR Team Managements\\Englabs Projects APK\\Patty Cash Details\\update_history.json';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (fs.existsSync(historyFile)) {
          const content = fs.readFileSync(historyFile, 'utf8');
          res.end(content);
        } else {
          res.end(JSON.stringify([]));
        }
        return;
      }

      // GET /api/attendance/live
      if (req.url === '/api/attendance/live' && req.method === 'GET') {
        try {
          const supabaseUrl = 'https://ngprtoaoqqrscbjbahpb.supabase.co';
          const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncHJ0b2FvcXFyc2NiamJhaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MzI0MjcsImV4cCI6MjA5MjUwODQyN30.zWWUosJZgPWy6vXD6uV94Q50PsABb1ot8bl6KMX5WME';

          const headers = {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          };

          // 1. Fetch active employees
          const employeesRes = await fetch(`${supabaseUrl}/rest/v1/employees?select=employee_id,name,role,status`, { headers });
          const employees = await employeesRes.json() as any[];

          // 2. Fetch today's access logs
          const tzOffset = 5.5 * 60 * 60 * 1000;
          const istDate = new Date(Date.now() + tzOffset);
          const todayStr = istDate.toISOString().split('T')[0];

          const logsRes = await fetch(`${supabaseUrl}/rest/v1/access_logs?select=*,employees(name,role)&created_at=gte.${todayStr}T00:00:00Z&order=created_at.asc`, { headers });
          const logs = await logsRes.json() as any[];

          // 3. Scan project database files to build name-to-project map
          const nameToProjectMap: { [name: string]: string } = {};
          try {
            const dataDir = path.join(__dirname, 'data');
            if (fs.existsSync(dataDir)) {
              const files = fs.readdirSync(dataDir).filter(f => f.startsWith('C') && f.endsWith('.json'));
              for (const file of files) {
                try {
                  const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
                  const pid = content.projectId;
                  if (!pid) continue;
                  
                  const names: string[] = [];
                  if (content.dailyStandup && content.dailyStandup.supervisor) {
                    names.push(content.dailyStandup.supervisor);
                  }
                  if (content.metrics && Array.isArray(content.metrics.workforce)) {
                    names.push(...content.metrics.workforce);
                  }
                  if (content.production && Array.isArray(content.production.stages)) {
                    content.production.stages.forEach((s: any) => {
                      if (s.lead) names.push(s.lead);
                    });
                  }
                  
                  names.forEach(name => {
                    if (name && typeof name === 'string' && name.trim()) {
                      const cleanName = name.trim().toLowerCase();
                      if (!nameToProjectMap[cleanName]) {
                        nameToProjectMap[cleanName] = pid;
                      }
                    }
                  });
                } catch (err) {}
              }
            }
          } catch (err) {
            console.error("Error building name-to-project map:", err);
          }

          // Compile stats & check-ins
          const activeEmployees = employees.filter(e => e.status !== 'Deleted' && e.status !== 'Disabled');
          const totalActiveStaff = activeEmployees.length;

          const todayCheckIns = new Map<string, { time: string, method: string, confidence: number }>();
          logs.forEach(log => {
            if (log.status === 'success') {
              const logTime = new Date(log.created_at);
              const timeStr = logTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true, 
                timeZone: 'Asia/Kolkata' 
              });

              let method = 'FACE';
              if (log.metadata && log.metadata.method) {
                method = String(log.metadata.method).toUpperCase();
              }

              let conf = 100;
              if (log.confidence !== null && log.confidence !== undefined) {
                const c = parseFloat(log.confidence);
                conf = c <= 1.0 ? Math.round(c * 100) : Math.round(c);
              }

              todayCheckIns.set(log.employee_id, { 
                time: timeStr,
                method: method,
                confidence: conf
              });
            }
          });

          // Build roster
          const roster = activeEmployees.map((emp, index) => {
            const checkInInfo = todayCheckIns.get(emp.employee_id);
            const isPresent = !!checkInInfo;
            
            // Map employee name to project site
            let project = '-';
            if (isPresent) {
              project = 'GENERAL';
              const empNameLower = emp.name.trim().toLowerCase();
              if (nameToProjectMap[empNameLower]) {
                project = nameToProjectMap[empNameLower];
              } else {
                const firstWord = empNameLower.split(' ')[0];
                const matchedKey = Object.keys(nameToProjectMap).find(k => k.startsWith(firstWord) || firstWord.startsWith(k));
                if (matchedKey) {
                  project = nameToProjectMap[matchedKey];
                }
              }
            }

            return {
              id: index + 1,
              staffId: emp.employee_id,
              name: emp.name,
              role: emp.role === 'admin' ? 'Supervisor' : 'Employee',
              status: isPresent ? 'PRESENT' : 'ABSENT',
              checkIn: isPresent ? checkInInfo.time : '-',
              project: project,
              method: isPresent ? checkInInfo.method : '-',
              confidence: isPresent ? checkInInfo.confidence : null
            };
          });

          const presentToday = todayCheckIns.size;
          const absentToday = totalActiveStaff - presentToday;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            stats: {
              totalActiveStaff,
              presentToday,
              absentToday,
              pendingOvertime: 14.5
            },
            roster
          }));
        } catch (err: any) {
          console.error("Error in live attendance API:", err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
      }

      // GET /api/attendance/history
      if (req.url.startsWith('/api/attendance/history') && req.method === 'GET') {
        try {
          const supabaseUrl = 'https://ngprtoaoqqrscbjbahpb.supabase.co';
          const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncHJ0b2FvcXFyc2NiamJhaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MzI0MjcsImV4cCI6MjA5MjUwODQyN30.zWWUosJZgPWy6vXD6uV94Q50PsABb1ot8bl6KMX5WME';

          const headers = {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          };

          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const startDate = urlObj.searchParams.get('startDate');
          const endDate = urlObj.searchParams.get('endDate');

          if (!startDate || !endDate) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: "startDate and endDate parameters are required" }));
            return;
          }

          // 1. Fetch attendance records in date range
          const attendanceRes = await fetch(`${supabaseUrl}/rest/v1/attendance?select=*,employees(name,role,status)&date=gte.${startDate}&date=lte.${endDate}&order=date.desc`, { headers });
          const attendanceRecords = await attendanceRes.json() as any[];

          // 2. Scan project database files to build name-to-project map
          const nameToProjectMap: { [name: string]: string } = {};
          try {
            const dataDir = path.join(__dirname, 'data');
            if (fs.existsSync(dataDir)) {
              const files = fs.readdirSync(dataDir).filter(f => f.startsWith('C') && f.endsWith('.json'));
              for (const file of files) {
                try {
                  const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
                  const pid = content.projectId;
                  if (!pid) continue;
                  
                  const names: string[] = [];
                  if (content.dailyStandup && content.dailyStandup.supervisor) {
                    names.push(content.dailyStandup.supervisor);
                  }
                  if (content.metrics && Array.isArray(content.metrics.workforce)) {
                    names.push(...content.metrics.workforce);
                  }
                  if (content.production && Array.isArray(content.production.stages)) {
                    content.production.stages.forEach((s: any) => {
                      if (s.lead) names.push(s.lead);
                    });
                  }
                  
                  names.forEach(name => {
                    if (name && typeof name === 'string' && name.trim()) {
                      const cleanName = name.trim().toLowerCase();
                      if (!nameToProjectMap[cleanName]) {
                        nameToProjectMap[cleanName] = pid;
                      }
                    }
                  });
                } catch (err) {}
              }
            }
          } catch (err) {
            console.error("Error building name-to-project map:", err);
          }

          // 3. Format and return records
          const data = attendanceRecords.map((rec, index) => {
            const emp = rec.employees || {};
            const isPresent = !!rec.check_in;

            // Map employee name to project site
            let project = '-';
            if (isPresent && emp.name) {
              project = 'GENERAL';
              const empNameLower = emp.name.trim().toLowerCase();
              if (nameToProjectMap[empNameLower]) {
                project = nameToProjectMap[empNameLower];
              } else {
                const firstWord = empNameLower.split(' ')[0];
                const matchedKey = Object.keys(nameToProjectMap).find(k => k.startsWith(firstWord) || firstWord.startsWith(k));
                if (matchedKey) {
                  project = nameToProjectMap[matchedKey];
                }
              }
            }

            const checkInTime = rec.check_in ? new Date(rec.check_in).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata'
            }) : '-';

            const checkOutTime = rec.check_out ? new Date(rec.check_out).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata'
            }) : '-';

            return {
              id: rec.id || index + 1,
              staffId: rec.employee_id,
              name: emp.name || 'Unknown',
              role: emp.role === 'admin' ? 'Supervisor' : 'Employee',
              date: rec.date,
              checkIn: checkInTime,
              checkOut: checkOutTime,
              workingHours: rec.working_hours,
              status: rec.status || 'PRESENT',
              method: rec.method || 'face',
              project
            };
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data }));
        } catch (err: any) {
          console.error("Error in historical attendance API:", err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
      }

      // GET /api/staff/photo
      if (req.url.startsWith('/api/staff/photo') && req.method === 'GET') {
        const photoPath = path.join(__dirname, 'data', 'gurpreet_singh_photo.jpg');
        if (fs.existsSync(photoPath)) {
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          fs.createReadStream(photoPath).pipe(res);
        } else {
          res.writeHead(404);
          res.end();
        }
        return;
      }

      // GET /api/staff/pdf
      if (req.url.startsWith('/api/staff/pdf') && req.method === 'GET') {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const type = urlObj.searchParams.get('type');
        const filePath = type === 'appointment'
          ? 'G:\\HR Team Managements\\Englabs Projects APK\\Porter Team\\Porter Staff\\Letters\\Appointment_Letter_Gurpreet_Singh.pdf'
          : 'G:\\HR Team Managements\\Englabs Projects APK\\Porter Team\\Porter Staff\\Letters\\Joining_Letter_Gurpreet_Singh.pdf';
        if (fs.existsSync(filePath)) {
          res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${type === 'appointment' ? 'Appointment_Letter_Gurpreet_Singh.pdf' : 'Joining_Letter_Gurpreet_Singh.pdf'}"`
          });
          fs.createReadStream(filePath).pipe(res);
        } else {
          res.writeHead(404);
          res.end("File Not Found");
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@components': path.resolve(__dirname, './src/shared/components'),
      '@common': path.resolve(__dirname, './src/shared/components/common'),
      '@features': path.resolve(__dirname, './src/modules'),
      '@lib': path.resolve(__dirname, './src/shared/utils'),
      '@services': path.resolve(__dirname, './src/shared/services'),
      '@domain': path.resolve(__dirname, './src/shared/services'),
      '@config': path.resolve(__dirname, './src/shared/utils/config'),
      '@data': path.resolve(__dirname, './data'),
    }
  },
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
    exclude: ['**/node_modules/**', '**/dist/**', '**/src/tests/e2e/**', '**/src_backup_pre_refactor/**'],
  },
})
