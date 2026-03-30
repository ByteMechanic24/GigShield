export function formatRupees(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '₹0';
  }

  return `₹${Math.round(Number(amount)).toLocaleString('en-IN')}`;
}

export function formatDate(isoString, options = {}) {
  if (!isoString) {
    return 'Unavailable';
  }

  try {
    const date = new Date(isoString);

    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...options,
    });
  } catch {
    return 'Unavailable';
  }
}

export function formatDecision(decision) {
  const normalized = (decision || '').toUpperCase();

  if (normalized === 'APPROVE') {
    return { label: 'Approved', tone: 'approved' };
  }

  if (normalized === 'REJECT') {
    return { label: 'Rejected', tone: 'rejected' };
  }

  if (normalized === 'SOFT_HOLD') {
    return { label: 'Auto recheck', tone: 'review' };
  }

  if (normalized === 'MANUAL_REVIEW') {
    return { label: 'Manual review', tone: 'review' };
  }

  return { label: 'Processing', tone: 'review' };
}

export function formatTier(tier) {
  const normalized = (tier || 'basic').toLowerCase();
  const tiers = {
    basic: { label: 'Basic Shield', price: '₹25-35/week' },
    standard: { label: 'Standard Shield', price: '₹40-55/week' },
    premium: { label: 'Premium Shield', price: '₹70-90/week' },
  };

  return tiers[normalized] || tiers.basic;
}

export function formatDisruption(disruptionType) {
  const mapping = {
    flooding: 'Flooding',
    heat: 'Heatwave',
    aqi: 'Poor AQI',
    strike: 'Strike',
    road_closure: 'Road closure',
  };

  return mapping[disruptionType] || disruptionType || 'Unknown';
}

export function formatPlatform(platform) {
  return platform === 'swiggy' ? 'Swiggy' : 'Zomato';
}
