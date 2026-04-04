import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\x1b[36m%s\x1b[0m', '--- 玄珀 (Deepond) Unified Runner ---');

const runCommand = (command, args, name, color) => {
  const child = spawn(command, args, { shell: true });
  
  child.stdout.on('data', (data) => {
    process.stdout.write(`\x1b[${color}m[${name}]\x1b[0m ${data}`);
  });
  
  child.stderr.on('data', (data) => {
    process.stderr.write(`\x1b[31m[${name} Error]\x1b[0m ${data}`);
  });
  
  return child;
};

// Kill existing processes on ports 3000 and 4000 (optional but recommended)
// For simplicity in JS, we'll just start and let the user handle errors or use the .bat's cleanup.

const backend = runCommand('npm', ['run', 'server'], 'Backend', '33'); // Yellow
const frontend = runCommand('npm', ['run', 'dev'], 'Frontend', '32'); // Green

// Give it a few seconds then open browser
setTimeout(() => {
  console.log('\n\x1b[32m%s\x1b[0m', '🚀 Launching 玄珀 (Deepond) in your browser...');
  spawn('start', ['http://localhost:7000'], { shell: true });
}, 3000);

process.on('SIGINT', () => {
  console.log('\n\x1b[35m%s\x1b[0m', 'Stopping 玄珀 (Deepond)...');
  backend.kill();
  frontend.kill();
  process.exit();
});
