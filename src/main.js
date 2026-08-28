'use strict';

const path = require('node:path');
const {
  app,
  BrowserWindow,
  WebContentsView,
  ipcMain,
  session,
  Menu,
} = require('electron');
const { HOME_URL, isHttpUrl, resolveNavigation } = require('./navigation');

const TOOLBAR_HEIGHT = 92;
const PARTITION = 'persist:atlas';

let mainWindow = null;
let pageView = null;

function isTrustedChromeSender(event) {
  return Boolean(mainWindow) && event.sender.id === mainWindow.webContents.id;
}

function getNavigationState(overrides = {}) {
  if (!pageView || pageView.webContents.isDestroyed()) {
    return {
      url: '',
      title: 'Nova guia',
      loading: false,
      canGoBack: false,
      canGoForward: false,
      secure: false,
      ...overrides,
    };
  }

  const contents = pageView.webContents;
  const url = contents.getURL();

  return {
    url,
    title: contents.getTitle() || 'Nova guia',
    loading: contents.isLoading(),
    canGoBack: contents.navigationHistory.canGoBack(),
    canGoForward: contents.navigationHistory.canGoForward(),
    secure: url.startsWith('https://'),
    ...overrides,
  };
}

function publishNavigationState(overrides = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send('atlas:navigation-state', getNavigationState(overrides));
}

function layoutPageView() {
  if (!mainWindow || !pageView || mainWindow.isDestroyed()) {
    return;
  }

  const [width, height] = mainWindow.getContentSize();
  pageView.setBounds({
    x: 0,
    y: TOOLBAR_HEIGHT,
    width,
    height: Math.max(0, height - TOOLBAR_HEIGHT),
  });
}

function focusAddressBar() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.focus();
  mainWindow.webContents.send('atlas:focus-address');
}

function handleShortcut(input) {
  if (!pageView || pageView.webContents.isDestroyed()) {
    return false;
  }

  const key = input.key.toLowerCase();
  const commandOrControl = input.control || input.meta;
  const history = pageView.webContents.navigationHistory;

  if (commandOrControl && key === 'l') {
    focusAddressBar();
    return true;
  }

  if ((commandOrControl && key === 'r') || key === 'f5') {
    pageView.webContents.reload();
    return true;
  }

  if (input.alt && key === 'left' && history.canGoBack()) {
    history.goBack();
    return true;
  }

  if (input.alt && key === 'right' && history.canGoForward()) {
    history.goForward();
    return true;
  }

  if (key === 'escape' && pageView.webContents.isLoading()) {
    pageView.webContents.stop();
    return true;
  }

  return false;
}

function attachShortcutHandler(contents) {
  contents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && handleShortcut(input)) {
      event.preventDefault();
    }
  });
}

function configurePageView(browserSession) {
  pageView = new WebContentsView({
    webPreferences: {
      session: browserSession,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.contentView.addChildView(pageView);
  layoutPageView();

  const contents = pageView.webContents;
  attachShortcutHandler(contents);

  contents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) {
      contents.loadURL(url);
    }
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (!isHttpUrl(url)) {
      event.preventDefault();
    }
  });

  contents.on('did-start-loading', () => publishNavigationState({ loading: true }));
  contents.on('did-stop-loading', () => publishNavigationState({ loading: false }));
  contents.on('did-navigate', () => publishNavigationState());
  contents.on('did-navigate-in-page', () => publishNavigationState());
  contents.on('page-title-updated', () => publishNavigationState());
  contents.on('render-process-gone', (_event, details) => {
    publishNavigationState({
      loading: false,
      title: details.reason === 'crashed' ? 'A página parou de funcionar' : 'Página indisponível',
    });
  });

  contents.loadURL(HOME_URL);
}

function registerIpcHandlers() {
  ipcMain.handle('atlas:navigate', (event, input) => {
    if (!isTrustedChromeSender(event) || typeof input !== 'string' || input.length > 4096) {
      return false;
    }

    pageView.webContents.loadURL(resolveNavigation(input));
    return true;
  });

  ipcMain.handle('atlas:command', (event, command) => {
    if (!isTrustedChromeSender(event) || !pageView || pageView.webContents.isDestroyed()) {
      return false;
    }

    const contents = pageView.webContents;
    const history = contents.navigationHistory;

    switch (command) {
      case 'back':
        if (history.canGoBack()) history.goBack();
        break;
      case 'forward':
        if (history.canGoForward()) history.goForward();
        break;
      case 'reload':
        if (contents.isLoading()) contents.stop();
        else contents.reload();
        break;
      case 'home':
        contents.loadURL(HOME_URL);
        break;
      default:
        return false;
    }

    return true;
  });

  ipcMain.handle('atlas:get-navigation-state', (event) => {
    if (!isTrustedChromeSender(event)) {
      return null;
    }
    return getNavigationState();
  });
}

function createMainWindow() {
  const browserSession = session.fromPartition(PARTITION);
  browserSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  browserSession.setPermissionCheckHandler(() => false);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 520,
    title: 'Atlas',
    backgroundColor: '#11151c',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('resize', layoutPageView);
  mainWindow.on('closed', () => {
    if (pageView && !pageView.webContents.isDestroyed()) {
      pageView.webContents.close();
    }
    pageView = null;
    mainWindow = null;
  });

  attachShortcutHandler(mainWindow.webContents);
  configurePageView(browserSession);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
