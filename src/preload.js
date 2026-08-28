'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('atlas', {
  navigate: (input) => ipcRenderer.invoke('atlas:navigate', input),
  command: (command) => ipcRenderer.invoke('atlas:command', command),
  getNavigationState: () => ipcRenderer.invoke('atlas:get-navigation-state'),
  onNavigationState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('atlas:navigation-state', listener);
    return () => ipcRenderer.removeListener('atlas:navigation-state', listener);
  },
  onFocusAddress: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('atlas:focus-address', listener);
    return () => ipcRenderer.removeListener('atlas:focus-address', listener);
  },
});
