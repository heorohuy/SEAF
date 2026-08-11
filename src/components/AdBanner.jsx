import { useEffect } from 'react';

const ADSENSE_CLIENT = 'ca-pub-5678333692672006';
const ADSENSE_SLOT = 'YOUR_AD_SLOT_ID';

export default function AdBanner() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className="ad-banner">
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: '90px',
        }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}