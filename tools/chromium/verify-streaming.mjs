import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const executable = resolve(
  process.argv.slice(2).find((argument) => !argument.startsWith('--') && argument.endsWith('.exe')) ??
    'C:/src/atlas-chromium/src/out/AtlasRelease/chrome.exe',
);
const headless = process.argv.includes('--headless');
const keepProfile = process.argv.includes('--keep-profile');
const debugUpdater = process.argv.includes('--debug-updater');
const waitArgument = process.argv.find((argument) => argument.startsWith('--wait='));
const waitSeconds = Math.max(3, Number(waitArgument?.split('=')[1] ?? 3));

if (!existsSync(executable)) {
  throw new Error(`Executavel do Atlas nao encontrado: ${executable}`);
}

const profilePrefix = join(tmpdir(), 'atlas-streaming-check-');
const profile = mkdtempSync(profilePrefix);
const debuggingPort = 19000 + Math.floor(Math.random() * 1000);
const logFile = join(profile, 'chrome_debug.log');
const testUrl = 'https://example.com/';
const browser = spawn(
  executable,
  [
    ...(headless ? ['--headless=new', '--disable-gpu'] : ['--window-position=-32000,-32000']),
    '--no-first-run',
    '--no-default-browser-check',
    '--component-updater=fast-update',
    ...(debugUpdater
      ? [
          '--enable-logging',
          `--log-file=${logFile}`,
          '--vmodule=component_updater*=2,update_client*=2',
        ]
      : []),
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
);

const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function waitForTargets() {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`);
      if (response.ok) return response.json();
    } catch {
      // O navegador ainda esta inicializando.
    }
    await delay(100);
  }
  throw new Error(
    `Atlas nao abriu a porta de depuracao em 30 segundos. exitCode=${browser.exitCode}`,
  );
}

async function connect(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', rejectOpen, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolveMessage, rejectMessage } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) rejectMessage(new Error(message.error.message));
    else resolveMessage(message.result);
  });

  return {
    call(method, params = {}) {
      const id = ++nextId;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolveMessage, rejectMessage) => {
        pending.set(id, { resolveMessage, rejectMessage });
      });
    },
    close() {
      socket.close();
    },
  };
}

try {
  const targets = await waitForTargets();
  const page = targets.find((target) => target.type === 'page');
  if (!page) throw new Error('Nenhuma pagina do Atlas foi encontrada.');

  const cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.call('Page.enable');
  const navigation = await cdp.call('Page.navigate', { url: testUrl });
  if (navigation.errorText) {
    throw new Error(`Falha ao abrir ${testUrl}: ${navigation.errorText}`);
  }
  let loaded = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const currentLocation = await cdp.call('Runtime.evaluate', {
      expression: 'location.href',
      returnByValue: true,
    });
    if (currentLocation.result.value === testUrl) {
      loaded = true;
      break;
    }
    await delay(100);
  }
  if (!loaded) throw new Error(`A aba nao concluiu a abertura de ${testUrl}.`);
  await delay(waitSeconds * 1000);

  const expression = `
    (async () => {
      const mediaSource = globalThis.MediaSource;
      const result = {
        url: location.href,
        userAgent: navigator.userAgent,
        h264Mse: Boolean(mediaSource?.isTypeSupported('video/mp4; codecs="avc1.42E01E"')),
        aacMse: Boolean(mediaSource?.isTypeSupported('audio/mp4; codecs="mp4a.40.2"')),
        h264Element: document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"'),
        aacElement: document.createElement('audio').canPlayType('audio/mp4; codecs="mp4a.40.2"'),
        emeApi: typeof navigator.requestMediaKeySystemAccess === 'function',
        widevine: false,
        widevineError: null,
      };
      if (result.emeApi) {
        try {
          await navigator.requestMediaKeySystemAccess('com.widevine.alpha', [{
            initDataTypes: ['cenc'],
            videoCapabilities: [{
              contentType: 'video/mp4; codecs="avc1.42E01E"',
              robustness: 'SW_SECURE_CRYPTO',
            }],
            audioCapabilities: [{
              contentType: 'audio/mp4; codecs="mp4a.40.2"',
              robustness: 'SW_SECURE_CRYPTO',
            }],
          }]);
          result.widevine = true;
        } catch (error) {
          result.widevineError = error.name + ': ' + error.message;
        }
      }
      return result;
    })()
  `;
  const evaluation = await cdp.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  cdp.close();
  console.log(JSON.stringify(evaluation.result.value, null, 2));
  if (debugUpdater && existsSync(logFile)) {
    console.error(readFileSync(logFile, 'utf8').trim());
  }
} finally {
  spawnSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], {
    stdio: 'ignore',
    windowsHide: true,
  });
  await delay(1000);
  const safeProfile = resolve(profile);
  if (keepProfile) {
    console.error(`Perfil de teste preservado em: ${safeProfile}`);
  } else if (safeProfile.startsWith(resolve(profilePrefix))) {
    rmSync(safeProfile, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 200,
    });
  }
}
