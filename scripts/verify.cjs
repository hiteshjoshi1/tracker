const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const resultsPath = path.join(root, 'verification-results', 'summary.json');
const summary = { commit: '', workingTreeDirty: false, status: 'running', stages: [] };
const environment = { ...process.env, CI: '1', TZ: 'UTC', DEBUG: '', EXPO_NO_TELEMETRY: '1' };
const npmCli = process.env.npm_execpath;

function save() {
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2) + '\n');
}

function javaHome() {
  const candidates = process.env.JAVA_HOME
    ? [path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')]
    : ['java', '/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/java',
      '/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home/bin/java',
      '/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home/bin/java'];
  for (const binary of candidates) {
    const result = spawnSync(binary, ['-XshowSettings:properties', '-version'], { encoding: 'utf8', timeout: 10000 });
    const output = (result.stdout || '') + (result.stderr || '');
    const major = Number(output.match(/version\s+"(\d+)/)?.[1]);
    const home = output.match(/^\s*java\.home\s*=\s*(.+)$/m)?.[1]?.trim();
    if (result.status === 0 && major >= 21 && home) return home;
  }
  throw new Error('Java 21 or newer is required. Set JAVA_HOME to an installed JDK (Android Studio includes one).');
}

function portInUse(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const finish = value => { socket.destroy(); resolve(value); };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(500, () => finish(false));
  });
}

async function preflight() {
  const nodePin = fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim().replace(/^v/, '');
  if (process.versions.node !== nodePin) throw new Error(`Use Node ${nodePin} from .nvmrc (nvm install && nvm use).`);
  if (!npmCli) throw new Error('Run this check with npm run verify.');
  const npmPin = require('../package.json').packageManager.replace(/^npm@/, '');
  const npmVersion = spawnSync(process.execPath, [npmCli, '--version'], { encoding: 'utf8', timeout: 10000 });
  if (npmVersion.status !== 0 || npmVersion.stdout.trim() !== npmPin) throw new Error(`Use npm ${npmPin}, bundled with the pinned Node runtime.`);
  for (const file of ['node_modules/jest/bin/jest.js', 'node_modules/typescript/bin/tsc',
    'tools/quality/node_modules/eslint/bin/eslint.js', 'tools/firebase/node_modules/firebase-tools/lib/bin/firebase.js']) {
    if (!fs.existsSync(path.join(root, file))) throw new Error('Install all lockfiles first: npm ci && npm ci --prefix tools/quality && npm ci --prefix tools/firebase.');
  }
  environment.JAVA_HOME = javaHome();
  for (const port of [8080, 9099, 4400, 4500, 9150]) {
    if (await portInUse(port)) throw new Error(`Local emulator port ${port} is occupied. Stop the manual Firebase preview before verify; its fixtures will be reset.`);
  }
  console.log(`[verify] ${root}\n[verify] Node ${nodePin}, npm ${npmPin}, JAVA_HOME=${environment.JAVA_HOME}`);
}

async function main() {
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  summary.commit = commit.status === 0 ? commit.stdout.trim() : 'unknown';
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  summary.workingTreeDirty = status.status !== 0 || status.stdout.trim().length > 0;
  await preflight();
  for (const name of ['lint', 'typecheck', 'test:unit', 'test:policy', 'test:rules', 'test:local']) {
    console.log(`\n[verify] Running ${name}`);
    const started = Date.now();
    const result = spawnSync(process.execPath, [npmCli, 'run', name], { cwd: root, env: environment, stdio: 'inherit' });
    const code = result.status === null ? 1 : result.status;
    summary.stages.push({ name, exitCode: code, durationMs: Date.now() - started });
    if (code !== 0) {
      summary.status = 'failed';
      save();
      console.error(`[verify] ${name} failed${result.signal ? ` (${result.signal})` : ''}; later stages did not run.`);
      process.exitCode = code;
      return;
    }
  }
  summary.status = 'passed';
  save();
  console.log('\n[verify] All six stages passed. Native compilation and phone approval are separate checks.');
}

main().catch(error => {
  summary.status = 'failed';
  summary.error = error.message;
  save();
  console.error(`[verify] ${error.message}`);
  process.exitCode = 1;
});
