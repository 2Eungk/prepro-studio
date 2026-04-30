'use client';

import Script from 'next/script';

const normalizeAdClient = (clientId?: string) => {
  if (!clientId) return '';
  return clientId.startsWith('ca-pub-') ? clientId : `ca-pub-${clientId}`;
};

const GoogleAdSense = () => {
  const adClient = normalizeAdClient(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

  if (!adClient) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
};

export default GoogleAdSense;
