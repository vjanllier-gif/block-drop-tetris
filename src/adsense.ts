/**
 * Google AdSense setup for Block Drop — Tetris.
 *
 * The AdSense loader is enabled with the public publisher ID so Google can
 * verify the site. Ad serving still depends on site approval and AdSense
 * settings. No private account credentials are stored here.
 */
const ADSENSE_PUBLISHER_ID = 'ca-pub-6465659411947721';

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
