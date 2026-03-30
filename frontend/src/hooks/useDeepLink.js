import { useEffect, useState } from 'react';
import { generateDemoOrder } from '../utils/api';

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
    generateDemoOrder('zomato')
      .then((preferredOrder) => {
        setData({
          orderId: preferredOrder?.orderId || '',
          platform: preferredOrder?.platform || 'zomato',
          isAutoFilled: Boolean(preferredOrder),
        });
      })
      .catch(() => {
        setData({
          orderId: '',
          platform: 'zomato',
          isAutoFilled: false,
        });
      });
  }, []);

  return data;
}
