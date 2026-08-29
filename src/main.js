'use strict';

const path = require('node:path');
const { randomUUID } = require('node:crypto');
const {
  app,
  BrowserWindow,
  WebContentsView,
  ipcMain,
  session,
  Menu,
} = require('electron');
const { autoUpdater } = require('electron-updater');
const { HOME_URL, isHttpUrl, resolveNavigation } = require('./navigation');
const { loadShortcuts, saveShortcuts } = require('./shortcuts-store');
const { loadWindowState, saveWindowState } = require('./window-state');

const TOPBAR_HEIGHT = 56;
const SIDEBAR_WIDTH = 244;
const SIDEBAR_COLLAPSED_WIDTH = 72;
const CONTENT_GAP = 8;
const PARTITION = 'persist:atlas';

let mainWindow = null;
let activeTabId = null;
let attachedTabId = null;
let nextTabId = 1;
let sidebarCollapsed = false;
let shortcuts = [];
const tabs = new Map();
let updateCheckInterval = null;
const updateState = {
  status: app.isPackaged ? 'idle' : 'development',
  currentVersion: app.getVersion(),
  availableVersion: null,
  percent: null,
};

function getWindowStateFilePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function getShortcutsFilePath() {
  return path.join(app.getPath('userData'), 'shortcuts.json');
}

function persistCurrentWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false;
  }

  return saveWindowState(getWindowStateFilePath(), {
    isMaximized: mainWindow.isMaximized(),
  });
}

function isTrustedChromeSender(event) {
  return Boolean(mainWindow) && !mainWindow.isDestroyed() && event.sender.id === mainWindow.webContents.id;
}

function getActiveTab() {
  return activeTabId ? tabs.get(activeTabId) ?? null : null;
}

function getTabNavigationState(tab) {
  if (!tab || tab.view.webContents.isDestroyed()) {
    return {
      url: '',
      title: 'Nova guia',
      loading: false,
      canGoBack: false,
      canGoForward: false,
      secure: false,
    };
  }

  const contents = tab.view.webContents;
  const url = contents.getURL();

  return {
    url,
    title: contents.getTitle() || tab.title || 'Nova guia',
    loading: contents.isLoading(),
    canGoBack: contents.navigationHistory.canGoBack(),
    canGoForward: contents.navigationHistory.canGoForward(),
    secure: url.startsWith('https://'),
  };
}

function getBrowserState() {
  const activeTab = getActiveTab();

  return {
    activeTabId,
    sidebarCollapsed,
    shortcuts: shortcuts.map((shortcut) => ({ ...shortcut })),
    update: { ...updateState },
    active: getTabNavigationState(activeTab),
    tabs: [...tabs.values()].map((tab) => {
      const state = getTabNavigationState(tab);
      return {
        id: tab.id,
        title: state.title,
        url: state.url,
        loading: state.loading,
        active: tab.id === activeTabId,
      };
    }),
  };
}

function setUpdateState(patch) {
  Object.assign(updateState, patch);
  publishBrowserState();
}

function checkForUpdates() {
  if (!app.isPackaged || updateState.status === 'downloading' || updateState.status === 'ready') {
    return;
  }

  autoUpdater.checkForUpdates().catch((error) => {
    console.warn('[Atlas updater] Não foi possível verificar atualizações:', error.message);
    setUpdateState({ status: 'error', percent: null });
  });
}

function configureAutoUpdater() {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.disableWebInstaller = true;

  autoUpdater.on('checking-for-update', () => {
    setUpdateState({ status: 'checking', percent: null });
  });
  autoUpdater.on('update-not-available', () => {
    setUpdateState({ status: 'idle', availableVersion: null, percent: null });
  });
  autoUpdater.on('update-available', (info) => {
    setUpdateState({ status: 'downloading', availableVersion: info.version, percent: 0 });
  });
  autoUpdater.on('download-progress', (progress) => {
    setUpdateState({ status: 'downloading', percent: Math.round(progress.percent) });
  });
  autoUpdater.on('update-downloaded', (info) => {
    setUpdateState({ status: 'ready', availableVersion: info.version, percent: 100 });
  });
  autoUpdater.on('error', (error) => {
    console.warn('[Atlas updater] Falha no auto-update:', error.message);
    setUpdateState({ status: 'error', percent: null });
  });

  setTimeout(checkForUpdates, 15_000);
  updateCheckInterval = setInterval(checkForUpdates, 4 * 60 * 60 * 1_000);
}

function publishBrowserState() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const state = getBrowserState();
  const title = state.active.title || 'Nova guia';
  mainWindow.setTitle(`${title} — Atlas`);
  mainWindow.webContents.send('atlas:browser-state', state);
}

function layoutActiveView() {
  const activeTab = getActiveTab();
  if (!mainWindow || mainWindow.isDestroyed() || !activeTab) {
    return;
  }

  const [windowWidth, windowHeight] = mainWindow.getContentSize();
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const x = sidebarWidth + CONTENT_GAP;
  const y = TOPBAR_HEIGHT + 4;

  activeTab.view.setBounds({
    x,
    y,
    width: Math.max(0, windowWidth - x - CONTENT_GAP),
    height: Math.max(0, windowHeight - y - CONTENT_GAP),
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
  const activeTab = getActiveTab();
  if (!activeTab || activeTab.view.webContents.isDestroyed()) {
    return false;
  }

  const key = input.key.toLowerCase();
  const commandOrControl = input.control || input.meta;
  const contents = activeTab.view.webContents;
  const history = contents.navigationHistory;

  if (commandOrControl && key === 'l') {
    focusAddressBar();
    return true;
  }

  if (commandOrControl && key === 't') {
    createTab(HOME_URL, { activate: true });
    focusAddressBar();
    return true;
  }

  if (commandOrControl && key === 'w') {
    closeTab(activeTab.id);
    return true;
  }

  if ((commandOrControl && key === 'r') || key === 'f5') {
    contents.reload();
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

  if (key === 'escape' && contents.isLoading()) {
    contents.stop();
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

function configureTab(tab) {
  const contents = tab.view.webContents;
  attachShortcutHandler(contents);

  contents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) {
      setImmediate(() => createTab(url, { activate: true }));
    }
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (!isHttpUrl(url)) {
      event.preventDefault();
    }
  });

  const updateState = () => publishBrowserState();
  contents.on('did-start-loading', updateState);
  contents.on('did-stop-loading', updateState);
  contents.on('did-navigate', updateState);
  contents.on('did-navigate-in-page', updateState);
  contents.on('page-title-updated', updateState);
  contents.on('render-process-gone', (_event, details) => {
    tab.title = details.reason === 'crashed' ? 'A página parou de funcionar' : 'Página indisponível';
    publishBrowserState();
  });
}

function createTab(url = HOME_URL, { activate = true } = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return null;
  }

  const id = `tab-${nextTabId++}`;
  const browserSession = session.fromPartition(PARTITION);
  const view = new WebContentsView({
    webPreferences: {
      session: browserSession,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });
  const tab = { id, title: 'Nova guia', view };

  tabs.set(id, tab);
  configureTab(tab);
  view.webContents.loadURL(isHttpUrl(url) ? url : resolveNavigation(url));

  if (activate) {
    activateTab(id);
  } else {
    publishBrowserState();
  }

  return id;
}

function activateTab(id) {
  const tab = tabs.get(id);
  if (!tab || !mainWindow || mainWindow.isDestroyed()) {
    return false;
  }

  if (attachedTabId && tabs.has(attachedTabId)) {
    mainWindow.contentView.removeChildView(tabs.get(attachedTabId).view);
  }

  activeTabId = id;
  attachedTabId = id;
  mainWindow.contentView.addChildView(tab.view);
  layoutActiveView();
  tab.view.webContents.focus();
  publishBrowserState();
  return true;
}

function closeTab(id) {
  const tabOrder = [...tabs.keys()];
  const closingIndex = tabOrder.indexOf(id);
  const tab = tabs.get(id);
  if (!tab) {
    return false;
  }

  const wasActive = id === activeTabId;
  if (id === attachedTabId && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.contentView.removeChildView(tab.view);
    attachedTabId = null;
  }

  tabs.delete(id);
  if (!tab.view.webContents.isDestroyed()) {
    tab.view.webContents.close();
  }

  if (tabs.size === 0) {
    activeTabId = null;
    createTab(HOME_URL, { activate: true });
    return true;
  }

  if (wasActive) {
    const remainingIds = [...tabs.keys()];
    const nextId = remainingIds[Math.min(closingIndex, remainingIds.length - 1)];
    activateTab(nextId);
  } else {
    publishBrowserState();
  }

  return true;
}

function registerIpcHandlers() {
  ipcMain.handle('atlas:navigate', (event, input) => {
    const activeTab = getActiveTab();
    if (
      !isTrustedChromeSender(event)
      || !activeTab
      || typeof input !== 'string'
      || input.length > 4096
    ) {
      return false;
    }

    activeTab.view.webContents.loadURL(resolveNavigation(input));
    return true;
  });

  ipcMain.handle('atlas:command', (event, command) => {
    const activeTab = getActiveTab();
    if (!isTrustedChromeSender(event) || !activeTab || activeTab.view.webContents.isDestroyed()) {
      return false;
    }

    const contents = activeTab.view.webContents;
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
      case 'new-tab':
        createTab(HOME_URL, { activate: true });
        focusAddressBar();
        break;
      default:
        return false;
    }

    return true;
  });

  ipcMain.handle('atlas:activate-tab', (event, id) => {
    return isTrustedChromeSender(event) && typeof id === 'string' && activateTab(id);
  });

  ipcMain.handle('atlas:close-tab', (event, id) => {
    return isTrustedChromeSender(event) && typeof id === 'string' && closeTab(id);
  });

  ipcMain.handle('atlas:set-sidebar-collapsed', (event, collapsed) => {
    if (!isTrustedChromeSender(event) || typeof collapsed !== 'boolean') {
      return false;
    }
    sidebarCollapsed = collapsed;
    layoutActiveView();
    publishBrowserState();
    return true;
  });

  ipcMain.handle('atlas:get-browser-state', (event) => {
    return isTrustedChromeSender(event) ? getBrowserState() : null;
  });

  ipcMain.handle('atlas:add-shortcut', (event) => {
    const activeTab = getActiveTab();
    if (!isTrustedChromeSender(event) || !activeTab || activeTab.view.webContents.isDestroyed()) {
      return false;
    }

    const contents = activeTab.view.webContents;
    const url = contents.getURL();
    if (!isHttpUrl(url)) return false;

    const existing = shortcuts.find((shortcut) => shortcut.url === url);
    if (existing) return existing.id;

    const shortcut = {
      id: randomUUID(),
      title: (contents.getTitle() || new URL(url).hostname).trim().slice(0, 120),
      url,
    };
    const nextShortcuts = [...shortcuts, shortcut];
    if (!saveShortcuts(getShortcutsFilePath(), nextShortcuts)) return false;

    shortcuts = nextShortcuts;
    publishBrowserState();
    return shortcut.id;
  });

  ipcMain.handle('atlas:remove-shortcut', (event, id) => {
    if (!isTrustedChromeSender(event) || typeof id !== 'string') return false;

    const nextShortcuts = shortcuts.filter((shortcut) => shortcut.id !== id);
    if (nextShortcuts.length === shortcuts.length) return false;
    if (!saveShortcuts(getShortcutsFilePath(), nextShortcuts)) return false;

    shortcuts = nextShortcuts;
    publishBrowserState();
    return true;
  });

  ipcMain.handle('atlas:install-update', (event) => {
    if (!isTrustedChromeSender(event) || !app.isPackaged || updateState.status !== 'ready') {
      return false;
    }

    setImmediate(() => autoUpdater.quitAndInstall(true, true));
    return true;
  });
}

function createMainWindow() {
  const browserSession = session.fromPartition(PARTITION);
  const savedWindowState = loadWindowState(getWindowStateFilePath());
  shortcuts = loadShortcuts(getShortcutsFilePath());
  browserSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  browserSession.setPermissionCheckHandler(() => false);

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 820,
    minHeight: 560,
    title: 'Atlas',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#111216',
      symbolColor: '#b9bdc7',
      height: TOPBAR_HEIGHT,
    },
    backgroundColor: '#101114',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => {
    if (savedWindowState.isMaximized) {
      mainWindow.maximize();
    }
    mainWindow.show();
    layoutActiveView();
  });
  mainWindow.on('resize', layoutActiveView);
  mainWindow.on('maximize', persistCurrentWindowState);
  mainWindow.on('unmaximize', persistCurrentWindowState);
  mainWindow.on('close', persistCurrentWindowState);
  mainWindow.on('closed', () => {
    for (const tab of tabs.values()) {
      if (!tab.view.webContents.isDestroyed()) {
        tab.view.webContents.close();
      }
    }
    tabs.clear();
    activeTabId = null;
    attachedTabId = null;
    mainWindow = null;
  });

  attachShortcutHandler(mainWindow.webContents);
  createTab(HOME_URL, { activate: true });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerIpcHandlers();
  createMainWindow();
  configureAutoUpdater();

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

app.on('before-quit', () => {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }
});
