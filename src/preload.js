'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('atlas', {
  navigate: (input) => ipcRenderer.invoke('atlas:navigate', input),
  command: (command) => ipcRenderer.invoke('atlas:command', command),
  activateTab: (id) => ipcRenderer.invoke('atlas:activate-tab', id),
  closeTab: (id) => ipcRenderer.invoke('atlas:close-tab', id),
  setSidebarCollapsed: (collapsed) => ipcRenderer.invoke('atlas:set-sidebar-collapsed', collapsed),
  installUpdate: () => ipcRenderer.invoke('atlas:install-update'),
  addShortcut: () => ipcRenderer.invoke('atlas:add-shortcut'),
  removeShortcut: (id) => ipcRenderer.invoke('atlas:remove-shortcut', id),
  getBrowserState: () => ipcRenderer.invoke('atlas:get-browser-state'),
  onBrowserState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('atlas:browser-state', listener);
    return () => ipcRenderer.removeListener('atlas:browser-state', listener);
  },
  onFocusAddress: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('atlas:focus-address', listener);
    return () => ipcRenderer.removeListener('atlas:focus-address', listener);
  },
});
