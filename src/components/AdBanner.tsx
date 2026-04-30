'use client';

import { useEffect } from 'react';

interface AdBannerProps {
  placement: 'top_banner' | 'middle_timeline';
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
}

const normalizeAdClient = (clientId?: string) => {
  if (!clientId) return '';
  return clientId.startsWith('ca-pub-') ? clientId : `ca-pub-${clientId}`;
};

const adSlots: Record<AdBannerProps['placement'], string | undefined> = {
  top_banner: process.env.NEXT_PUBLIC_ADSENSE_TOP_SLOT,
  middle_timeline: process.env.NEXT_PUBLIC_ADSENSE_MIDDLE_SLOT,
};

const AdBanner = ({ placement, format = 'auto', responsive = 'true', style }: AdBannerProps) => {
  const adClient = normalizeAdClient(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);
  const adSlot = adSlots[placement];
  const shouldShow = Boolean(adClient && adSlot);

  useEffect(() => {
    if (shouldShow) {
      try {
        // @ts-expect-error AdSense injects this global at runtime.
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [shouldShow]);

  // 실제 ID와 슬롯이 없으면 개발/배포 환경 모두에서 레이아웃을 방해하지 않도록 숨김 처리
  if (!shouldShow) return null;

  return (
    <div className="w-full overflow-hidden my-6 flex justify-center bg-neutral-900/30 rounded-xl border border-neutral-800/50 min-h-[100px] items-center group relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-widest text-neutral-700 font-bold group-hover:text-indigo-500/50 transition-colors">
          광고
        </span>
      </div>
      
      {shouldShow && (
        <ins
          className="adsbygoogle"
          style={style || { display: 'block' }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      )}
    </div>
  );
};

export default AdBanner;
