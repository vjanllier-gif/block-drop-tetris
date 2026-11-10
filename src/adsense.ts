/**
 * Google AdSense setup for Block Drop — Tetris.
 *
 * After your AdSense account and site are approved, paste your publisher ID
 * below (format: ca-pub- followed by 16 digits). Until then, AdSense stays
 * disabled and the game runs normally.
 *
 * Never put passwords or private account credentials here. The publisher ID
 * is a public identifier intended to appear in the page source.
 */
const ADSENSE_PUBLISHER_ID = '';

const PUBLISHER_ID_PATTERN = /^ca-pub-\d{16}$/;

export function initializeAdSense() {
  const publisherId = ADSENSE_PUBLISHER_ID.trim();

  // Fail closed: don't load Google ad code until a valid ID is configured.
  if (!PUBLISHER_ID_PATTERN.test(publisherId)) return;

  const existingScript = document.querySelector<HTMLScriptElement>(
    'script[data-block-drop-adsense="true"]'
  );

  if (!document.querySelector('meta[name="google-adsense-account"]')) {
    const meta = document.createElement('meta');
    meta.name = 'google-adsense-account';
    meta.content = publisherId;
    document.head.appendChild(meta);
  }

  if (existingScript) return;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset.blockDropAdsense = 'true';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  document.head.appendChild(script);
}
