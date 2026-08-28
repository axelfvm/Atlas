'use strict';

const HOME_URL = 'https://duckduckgo.com/';
const SEARCH_URL = 'https://duckduckgo.com/?q=';

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function looksLikeAddress(value) {
  if (/^localhost(?::\d+)?(?:\/|$)/i.test(value)) {
    return true;
  }

  if (/^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/|$)/.test(value)) {
    return true;
  }

  return /^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,}(?::\d+)?(?:\/|$)/i.test(value);
}

function resolveNavigation(input) {
  const value = String(input ?? '').trim();

  if (!value) {
    return HOME_URL;
  }

  if (isHttpUrl(value)) {
    return new URL(value).toString();
  }

  if (looksLikeAddress(value)) {
    const protocol = /^localhost(?::\d+)?(?:\/|$)/i.test(value) ? 'http://' : 'https://';
    return new URL(`${protocol}${value}`).toString();
  }

  return `${SEARCH_URL}${encodeURIComponent(value)}`;
}

module.exports = {
  HOME_URL,
  isHttpUrl,
  resolveNavigation,
};
