'use strict';

const elements = {
  address: document.querySelector('#address'),
  addressForm: document.querySelector('#address-form'),
  back: document.querySelector('#back'),
  forward: document.querySelector('#forward'),
  reload: document.querySelector('#reload'),
  home: document.querySelector('#home'),
  newTab: document.querySelector('#new-tab'),
  securityIndicator: document.querySelector('#security-indicator'),
  tabsList: document.querySelector('#tabs-list'),
  toggleSidebar: document.querySelector('#toggle-sidebar'),
  updateStatus: document.querySelector('#update-status'),
  updateTitle: document.querySelector('#update-title'),
  updateDetail: document.querySelector('#update-detail'),
  addShortcut: document.querySelector('#add-shortcut'),
  shortcutsGrid: document.querySelector('#shortcuts-grid'),
  shortcutsEmpty: document.querySelector('#shortcuts-empty'),
};

let currentUrl = '';
let addressIsFocused = false;
let sidebarCollapsed = false;
let currentBrowserState = null;

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function hueFromString(value) {
  let hash = 0;
  for (const character of value) {
    hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  }
  return Math.abs(hash) % 360;
}

function createTabElement(tab) {
  const item = document.createElement('li');
  item.className = 'tab-item';
  item.classList.toggle('active', tab.active);
  item.classList.toggle('loading', tab.loading);
  item.dataset.tabId = tab.id;

  const hostname = hostnameFromUrl(tab.url);
  const tabButton = document.createElement('button');
  tabButton.type = 'button';
  tabButton.className = 'tab-button';
  tabButton.title = tab.title || hostname || 'Nova guia';
  tabButton.setAttribute('aria-label', `Abrir guia ${tab.title || 'Nova guia'}`);
  tabButton.setAttribute('aria-current', tab.active ? 'page' : 'false');

  const favicon = document.createElement('span');
  favicon.className = 'tab-favicon';
  favicon.setAttribute('aria-hidden', 'true');
  favicon.style.setProperty('--favicon-hue', String(hueFromString(hostname || tab.title || tab.id)));
  favicon.textContent = (hostname || tab.title || 'A').charAt(0);

  const label = document.createElement('span');
  label.className = 'tab-label';
  label.textContent = tab.title || hostname || 'Nova guia';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'tab-close';
  closeButton.title = 'Fechar guia';
  closeButton.setAttribute('aria-label', `Fechar guia ${tab.title || 'Nova guia'}`);
  closeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>';

  tabButton.append(favicon, label);
  item.append(tabButton, closeButton);
  return item;
}

function renderTabs(tabs) {
  const fragment = document.createDocumentFragment();
  for (const tab of tabs) {
    fragment.append(createTabElement(tab));
  }
  elements.tabsList.replaceChildren(fragment);

  const activeItem = elements.tabsList.querySelector('.tab-item.active');
  activeItem?.scrollIntoView({ block: 'nearest' });
}

function createShortcutElement(shortcut) {
  const item = document.createElement('div');
  item.className = 'shortcut-item';
  item.dataset.shortcutId = shortcut.id;

  const hostname = hostnameFromUrl(shortcut.url);
  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'favorite';
  openButton.title = shortcut.title;
  openButton.setAttribute('aria-label', `Abrir ${shortcut.title}`);
  openButton.style.setProperty('--shortcut-hue', String(hueFromString(hostname || shortcut.title)));

  const glyph = document.createElement('span');
  glyph.className = 'shortcut-glyph';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = (hostname || shortcut.title || 'A').charAt(0);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'shortcut-remove';
  removeButton.title = 'Remover atalho';
  removeButton.setAttribute('aria-label', `Remover atalho ${shortcut.title}`);
  removeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>';

  openButton.append(glyph);
  item.append(openButton, removeButton);
  return item;
}

function renderShortcuts(shortcuts) {
  const fragment = document.createDocumentFragment();
  for (const shortcut of shortcuts) {
    fragment.append(createShortcutElement(shortcut));
  }
  elements.shortcutsGrid.replaceChildren(fragment);
  elements.shortcutsEmpty.hidden = shortcuts.length > 0;
}

function renderUpdateState(update) {
  const visible = update?.status === 'downloading' || update?.status === 'ready';
  elements.updateStatus.hidden = !visible;
  elements.updateStatus.classList.toggle('downloading', update?.status === 'downloading');
  elements.updateStatus.classList.toggle('ready', update?.status === 'ready');

  if (!visible) return;

  if (update.status === 'ready') {
    elements.updateStatus.disabled = false;
    elements.updateStatus.setAttribute('aria-label', 'Reiniciar o Atlas para instalar a atualização');
    elements.updateTitle.textContent = `Atlas ${update.availableVersion || ''} pronto`.trim();
    elements.updateDetail.textContent = 'Reiniciar para atualizar';
    return;
  }

  elements.updateStatus.disabled = true;
  elements.updateStatus.setAttribute('aria-label', 'Atualização do Atlas sendo baixada');
  elements.updateTitle.textContent = 'Atualizando o Atlas';
  elements.updateDetail.textContent = Number.isFinite(update.percent)
    ? `Baixando em segundo plano · ${update.percent}%`
    : 'Baixando em segundo plano';
}

function renderState(state) {
  if (!state) return;

  currentBrowserState = state;
  const active = state.active || {};
  currentUrl = active.url || '';
  sidebarCollapsed = Boolean(state.sidebarCollapsed);
  elements.back.disabled = !active.canGoBack;
  elements.forward.disabled = !active.canGoForward;
  elements.reload.setAttribute('aria-label', active.loading ? 'Parar carregamento' : 'Recarregar');
  elements.reload.title = active.loading ? 'Parar carregamento (Esc)' : 'Recarregar (Ctrl+R)';
  elements.securityIndicator.classList.toggle('secure', Boolean(active.secure));
  elements.securityIndicator.setAttribute(
    'aria-label',
    active.secure ? 'Conexão segura' : 'Informações do site',
  );
  elements.toggleSidebar.setAttribute(
    'aria-label',
    sidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral',
  );
  elements.toggleSidebar.title = sidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral';
  document.body.classList.toggle('is-loading', Boolean(active.loading));
  document.body.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  elements.addShortcut.disabled = !hostnameFromUrl(currentUrl);

  if (!addressIsFocused) {
    elements.address.value = currentUrl;
  }

  renderTabs(state.tabs || []);
  renderShortcuts(state.shortcuts || []);
  renderUpdateState(state.update);
}

function focusAddress() {
  elements.address.focus();
  elements.address.select();
}

elements.address.addEventListener('focus', () => {
  addressIsFocused = true;
  elements.address.select();
});

elements.address.addEventListener('blur', () => {
  addressIsFocused = false;
  elements.address.value = currentUrl;
});

elements.addressForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await window.atlas.navigate(elements.address.value);
  elements.address.blur();
});

elements.tabsList.addEventListener('click', async (event) => {
  const tabItem = event.target.closest('.tab-item');
  if (!tabItem) return;

  if (event.target.closest('.tab-close')) {
    await window.atlas.closeTab(tabItem.dataset.tabId);
    return;
  }

  if (event.target.closest('.tab-button')) {
    await window.atlas.activateTab(tabItem.dataset.tabId);
  }
});

elements.shortcutsGrid.addEventListener('click', async (event) => {
  const item = event.target.closest('.shortcut-item');
  if (!item) return;

  if (event.target.closest('.shortcut-remove')) {
    await window.atlas.removeShortcut(item.dataset.shortcutId);
    return;
  }

  const shortcut = currentBrowserState?.shortcuts?.find(({ id }) => id === item.dataset.shortcutId);
  if (shortcut && event.target.closest('.favorite')) {
    await window.atlas.navigate(shortcut.url);
  }
});

elements.back.addEventListener('click', () => window.atlas.command('back'));
elements.forward.addEventListener('click', () => window.atlas.command('forward'));
elements.reload.addEventListener('click', () => window.atlas.command('reload'));
elements.home.addEventListener('click', () => window.atlas.command('home'));
elements.newTab.addEventListener('click', () => window.atlas.command('new-tab'));
elements.toggleSidebar.addEventListener('click', () => {
  window.atlas.setSidebarCollapsed(!sidebarCollapsed);
});
elements.updateStatus.addEventListener('click', () => window.atlas.installUpdate());
elements.addShortcut.addEventListener('click', () => window.atlas.addShortcut());

window.atlas.onBrowserState(renderState);
window.atlas.onFocusAddress(focusAddress);
window.atlas.getBrowserState().then(renderState);
