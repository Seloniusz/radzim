const net = require('node:net');
const axios = require('axios');
const cheerio = require('cheerio');

const MAX_JOB_DESCRIPTION_LENGTH = 8000;
const READER_BASE_URL = 'https://r.jina.ai/';
const DIRECT_REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7'
};

function isPrivateIPv4(hostname) {
  const parts = hostname.split('.').map(Number);

  return parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 0;
}

function isPrivateIPv6(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  return normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:');
}

function validatePublicJobUrl(url) {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Adres oferty musi prowadzić do publicznej strony HTTP lub HTTPS');
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const ipVersion = net.isIP(hostname);
  const isLocalHostname = hostname === 'localhost' || hostname.endsWith('.localhost');
  const isPrivateIp = ipVersion === 4
    ? isPrivateIPv4(hostname)
    : ipVersion === 6 && isPrivateIPv6(hostname);

  if (!['http:', 'https:'].includes(parsedUrl.protocol) || isLocalHostname || isPrivateIp) {
    throw new Error('Adres oferty musi prowadzić do publicznej strony HTTP lub HTTPS');
  }

  return parsedUrl.toString();
}

function normalizeJobText(text) {
  const normalized = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_JOB_DESCRIPTION_LENGTH);

  if (normalized.length < 100) {
    throw new Error('Zbyt mało treści pobranej ze strony oferty');
  }

  return normalized;
}

function extractTextFromHtml(html) {
  const $ = cheerio.load(html);

  $('script, style, nav, header, footer, iframe, noscript').remove();

  return normalizeJobText($('body').text());
}

function wrapFetchError(error) {
  return new Error(`Nie udało się pobrać oferty: ${error.message}`);
}

async function scrapeJobOffer(url, { httpClient = axios } = {}) {
  const publicUrl = validatePublicJobUrl(url);

  try {
    const response = await httpClient.get(publicUrl, {
      headers: DIRECT_REQUEST_HEADERS,
      timeout: 15000,
      maxRedirects: 5
    });

    return extractTextFromHtml(response.data);
  } catch (error) {
    if (error.response?.status !== 403) {
      throw wrapFetchError(error);
    }
  }

  try {
    const response = await httpClient.get(`${READER_BASE_URL}${publicUrl}`, {
      headers: { Accept: 'text/plain' },
      timeout: 30000,
      maxRedirects: 5
    });

    return normalizeJobText(response.data);
  } catch (error) {
    throw wrapFetchError(error);
  }
}

module.exports = {
  scrapeJobOffer,
  validatePublicJobUrl
};

