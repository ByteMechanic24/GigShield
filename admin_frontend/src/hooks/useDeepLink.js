import { useEffect, useState } from 'react';

export default function useDeepLink() {
  const [data, setData] = useState({
    orderId: '',
    platform: 'zomato',
    isAutoFilled: false,
  });

  useEffect(() => {
    const savedOrderId = localStorage.getItem('last_order_id');
    const savedPlatform = (localStorage.getItem('last_platform') || 'zomato').toLowerCase();
    const platform = savedPlatform === 'swiggy' ? 'swiggy' : 'zomato';

    if (savedOrderId) {
      setData({
        orderId: savedOrderId,
        platform,
        isAutoFilled: true,
      });
      return;
    }

    const now = new Date();
    const fallbackOrder = `ZOM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${Math.random().toString().slice(2, 8)}`;

    setData({
      orderId: fallbackOrder,
      platform: 'zomato',
      isAutoFilled: false,
    });
  }, []);

  return data;
}
