'use strict';

const elements = {
  address: document.querySelector('#address'),
  addressForm: document.querySelector('#address-form'),
  back: document.querySelector('#back'),
  forward: document.querySelector('#forward'),
  reload: document.querySelector('#reload'),
  home: document.querySelector('#home'),
  securityIndicator: document.querySelector('#security-indicator'),
  tabTitle: document.querySelector('#tab-title'),
};

let currentUrl = '';
let addressIsFocused = false;

function renderState(state) {
  if (!state) return;

  currentUrl = state.url || '';
  elements.back.disabled = !state.canGoBack;
  elements.forward.disabled = !state.canGoForward;
  elements.reload.setAttribute('aria-label', state.loading ? 'Parar carregamento' : 'Recarregar');
  elements.reload.title = state.loading ? 'Parar carregamento (Esc)' : 'Recarregar (Ctrl+R)';
  elements.tabTitle.textContent = state.title || 'Nova guia';
  elements.tabTitle.title = state.title || 'Nova guia';
  elements.securityIndicator.classList.toggle('secure', Boolean(state.secure));
  elements.securityIndicator.setAttribute(
    'aria-label',
    state.secure ? 'Conexão segura' : 'Informações do site',
  );
  document.body.classList.toggle('is-loading', Boolean(state.loading));
  document.title = state.title ? `${state.title} — Atlas` : 'Atlas';

  if (!addressIsFocused) {
    elements.address.value = currentUrl;
  }
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

elements.back.addEventListener('click', () => window.atlas.command('back'));
elements.forward.addEventListener('click', () => window.atlas.command('forward'));
elements.reload.addEventListener('click', () => window.atlas.command('reload'));
elements.home.addEventListener('click', () => window.atlas.command('home'));

window.atlas.onNavigationState(renderState);
window.atlas.onFocusAddress(focusAddress);
window.atlas.getNavigationState().then(renderState);
