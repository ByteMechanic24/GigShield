import { getClaims, getCurrentPolicy } from './api';

const STALE_AFTER_MS = 45_000;
const CLAIMS_SNAPSHOT_KEY = 'gigshield_claims_snapshot';
const CLAIMS_FETCHED_AT_KEY = 'gigshield_claims_snapshot_fetched_at';
const POLICY_SNAPSHOT_KEY = 'gigshield_policy_snapshot';
const POLICY_FETCHED_AT_KEY = 'gigshield_policy_snapshot_fetched_at';

let claimsSnapshot = null;
let policySnapshot = null;
let claimsFetchedAt = 0;
let policyFetchedAt = 0;
let claimsPromise = null;
let policyPromise = null;

function sanitizeClaimForSnapshot(claim) {
  if (!claim || typeof claim !== 'object') {
    return claim;
  }

  const photos = Array.isArray(claim.photos) ? claim.photos : [];
  const checkResults = Array.isArray(claim.checkResults) ? claim.checkResults : [];

  return {
    ...claim,
    photos: photos.map((photo) => ({
      name: photo?.name || 'incident-photo',
      mimeType: photo?.mimeType || 'image/jpeg',
      sizeBytes: photo?.sizeBytes || 0,
      capturedAt: photo?.capturedAt || null,
    })),
    photoCount: typeof claim.photoCount === 'number' ? claim.photoCount : photos.length,
    checkResults: checkResults.map((result) => ({
      checkName: result?.checkName,
      weight: result?.weight,
      score: result?.score,
      confidence: result?.confidence || 'NONE',
      hardReject: Boolean(result?.hardReject),
      flags: Array.isArray(result?.flags) ? result.flags : [],
      completedAt: result?.completedAt || null,
    })),
  };
}

function sanitizeClaimsForSnapshot(claims) {
  if (!Array.isArray(claims)) {
    return [];
  }

  return claims.map((claim) => sanitizeClaimForSnapshot(claim));
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function hydrateFromStorage() {
  if (!canUseStorage()) {
    return;
  }

  if (claimsSnapshot === null) {
    try {
      const storedClaims = window.localStorage.getItem(CLAIMS_SNAPSHOT_KEY);
      const storedClaimsFetchedAt = Number(window.localStorage.getItem(CLAIMS_FETCHED_AT_KEY) || 0);
      if (storedClaims) {
        claimsSnapshot = JSON.parse(storedClaims);
        claimsFetchedAt = storedClaimsFetchedAt;
      }
    } catch {
      claimsSnapshot = null;
      claimsFetchedAt = 0;
    }
  }

  if (policySnapshot === null) {
    try {
      const storedPolicy = window.localStorage.getItem(POLICY_SNAPSHOT_KEY);
      const storedPolicyFetchedAt = Number(window.localStorage.getItem(POLICY_FETCHED_AT_KEY) || 0);
      if (storedPolicy) {
        policySnapshot = JSON.parse(storedPolicy);
        policyFetchedAt = storedPolicyFetchedAt;
      }
    } catch {
      policySnapshot = null;
      policyFetchedAt = 0;
    }
  }
}

function persistClaimsSnapshot() {
  if (!canUseStorage()) {
    return;
  }

  try {
    if (claimsSnapshot === null) {
      window.localStorage.removeItem(CLAIMS_SNAPSHOT_KEY);
      window.localStorage.removeItem(CLAIMS_FETCHED_AT_KEY);
      return;
    }

    window.localStorage.setItem(CLAIMS_SNAPSHOT_KEY, JSON.stringify(claimsSnapshot));
    window.localStorage.setItem(CLAIMS_FETCHED_AT_KEY, String(claimsFetchedAt));
  } catch {
    // Ignore quota/storage issues and keep runtime cache only.
  }
}

function persistPolicySnapshot() {
  if (!canUseStorage()) {
    return;
  }

  try {
    if (policySnapshot === null) {
      window.localStorage.removeItem(POLICY_SNAPSHOT_KEY);
      window.localStorage.removeItem(POLICY_FETCHED_AT_KEY);
      return;
    }

    window.localStorage.setItem(POLICY_SNAPSHOT_KEY, JSON.stringify(policySnapshot));
    window.localStorage.setItem(POLICY_FETCHED_AT_KEY, String(policyFetchedAt));
  } catch {
    // Ignore quota/storage issues and keep runtime cache only.
  }
}

function isFresh(timestamp) {
  return timestamp && Date.now() - timestamp < STALE_AFTER_MS;
}

export function getCachedClaimsSnapshot() {
  hydrateFromStorage();
  return claimsSnapshot;
}

export function getCachedPolicySnapshot() {
  hydrateFromStorage();
  return policySnapshot;
}

export function primeWorkerReads() {
  hydrateFromStorage();

  if (!claimsPromise && !isFresh(claimsFetchedAt)) {
    claimsPromise = getClaims({ limit: 20 })
      .then((claims) => {
        claimsSnapshot = sanitizeClaimsForSnapshot(claims);
        claimsFetchedAt = Date.now();
        persistClaimsSnapshot();
        return claimsSnapshot;
      })
      .catch(() => [])
      .finally(() => {
        claimsPromise = null;
      });
  }

  if (!policyPromise && !isFresh(policyFetchedAt)) {
    policyPromise = getCurrentPolicy()
      .then((policy) => {
        policySnapshot = policy;
        policyFetchedAt = Date.now();
        persistPolicySnapshot();
        return policy;
      })
      .catch(() => null)
      .finally(() => {
        policyPromise = null;
      });
  }

  return Promise.allSettled([claimsPromise, policyPromise]);
}

export function updateClaimsSnapshot(claims) {
  claimsSnapshot = sanitizeClaimsForSnapshot(claims);
  claimsFetchedAt = Date.now();
  persistClaimsSnapshot();
}

export function updatePolicySnapshot(policy) {
  policySnapshot = policy;
  policyFetchedAt = Date.now();
  persistPolicySnapshot();
}

export function clearWorkerSnapshots() {
  claimsSnapshot = null;
  policySnapshot = null;
  claimsFetchedAt = 0;
  policyFetchedAt = 0;
  claimsPromise = null;
  policyPromise = null;
  persistClaimsSnapshot();
  persistPolicySnapshot();
}
