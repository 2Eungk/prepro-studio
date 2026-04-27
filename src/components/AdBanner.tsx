'use client';

import { useEffect, useState } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
}

const AdBanner = ({ slot, format = 'auto', responsive = 'true', style }: AdBannerProps) => {
  const AD_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX"; // 실제 퍼블리셔 ID로 교체 전까지는 숨김 처리
  const isDevelopment = process.env.NODE_ENV === 'development';
  const shouldShow = AD_CLIENT !== "ca-pub-XXXXXXXXXXXXXXXX";

  useEffect(() => {
    if (shouldShow) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [shouldShow]);

  // 실제 ID가 없으면 아무것도 렌더링하지 않음 (애드센스 심사 통과용)
  if (!shouldShow && !isDevelopment) return null;

  return (
    <div className="w-full overflow-hidden my-6 flex justify-center bg-neutral-900/30 rounded-xl border border-neutral-800/50 min-h-[100px] items-center group relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-widest text-neutral-700 font-bold group-hover:text-indigo-500/50 transition-colors">
          {shouldShow ? 'Advertisement' : 'Ad Slot (Hidden in Production)'}
        </span>
      </div>
      
      {shouldShow && (
        <ins
          className="adsbygoogle"
          style={style || { display: 'block' }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      )}
    </div>
  );
};

export default AdBanner;
