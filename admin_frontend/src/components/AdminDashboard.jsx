import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BadgeIndianRupee, Camera, MapPinned, RefreshCw, ShieldCheck, Waves } from 'lucide-react';
import { fetchAdminStats, reviewClaim } from '../utils/api';
import { formatDate, formatDecision, formatDisruption, formatPlatform, formatRupees } from '../utils/formatting';

export default function AdminDashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingClaimId, setReviewingClaimId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const formatScore = (value) => (typeof value === 'number' ? value.toFixed(2) : 'N/A');

  const getReviewPhotos = (claim) => {
    if (Array.isArray(claim?.evidence?.photos) && claim.evidence.photos.length) {
      return claim.evidence.photos;
    }

    if (Array.isArray(claim?.photos) && claim.photos.length) {
      return claim.photos;
    }

    return [];
  };

  const getEnvironmentSnapshot = (claim) =>
    claim?.evidence?.environmentSnapshot ||
    claim?.checks?.find?.((check) => check.checkName === 'environmental')?.data ||
    null;

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      const response = await fetchAdminStats({ limit: 80 });
      const normalizedClaims = Array.isArray(response)
        ? response
        : Array.isArray(response?.value)
          ? response.value
          : [];
      setClaims(normalizedClaims);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the admin queue right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const intervalId = window.setInterval(() => {
      loadData({ silent: true });
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [loadData]);

  const uniqueWorkers = useMemo(() => new Set(claims.map((claim) => claim.workerId)).size, [claims]);
  const claimsThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return claims.filter((claim) => new Date(claim.submittedAt).getTime() >= weekAgo);
  }, [claims]);
  const approvedThisWeek = claimsThisWeek.filter((claim) => claim.decision === 'APPROVE');
  const totalPayoutsThisWeek = approvedThisWeek.reduce((sum, claim) => sum + (claim.payout?.total || 0), 0);
  const attentionQueue = claims.filter((claim) => ['SOFT_HOLD', 'MANUAL_REVIEW'].includes(claim.decision));

  const handleReviewAction = async (claimId, resolution) => {
    setReviewingClaimId(claimId);
    try {
      await reviewClaim(claimId, {
        resolution,
        notes: `Resolved from admin console as ${resolution.toLowerCase()}.`,
      });
      await loadData();
    } finally {
      setReviewingClaimId(null);
    }
  };

  const renderCheckCard = (check) => {
    const scorePercent = typeof check?.score === 'number' ? Math.max(0, Math.min(100, check.score * 100)) : 0;

    return (
      <div key={check._id || check.checkName} className="metric-card review-check">
        <div className="history-item__row">
          <div>
            <p className="metric-card__label">{String(check.checkName || 'check').replaceAll('_', ' ')}</p>
            <div className="metric-card__value" style={{ fontSize: '1.2rem' }}>
              {formatScore(check.score)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong style={{ display: 'block' }}>{check.weight ?? 'N/A'}</strong>
            <span className="helper-copy">Weight</span>
          </div>
        </div>

        <div className="scorebar" style={{ marginTop: 10 }}>
          <div className="scorebar__fill" style={{ width: `${scorePercent}%` }} />
        </div>

        <div className="pill-row" style={{ marginTop: 12 }}>
          <span className="status-chip status-chip--muted">{check.confidence || 'NONE'} confidence</span>
          {check.hardReject ? <span className="status-chip status-chip--muted">Hard reject signal</span> : null}
          {(check.flags || []).slice(0, 3).map((flag) => (
            <span key={`${check.checkName}-${flag}`} className="status-chip status-chip--muted">
              {flag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="panel-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Operations</p>
            <h2 className="page-title" style={{ fontSize: '2.2rem' }}>
              Claims command center
            </h2>
            <p className="card-copy">Review manual cases, inspect proof signals, and release decisions from one workspace.</p>
          </div>
          <button type="button" className="button button--ghost" onClick={() => loadData()}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error ? (
          <div className="alert alert--error" style={{ marginTop: 18 }}>
            {error}
          </div>
        ) : null}

        <div className="stats-grid" style={{ marginTop: 24 }}>
          <div className="metric-card">
            <p className="metric-card__label">
              <Activity size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
              Active workers
            </p>
            <div className="metric-card__value">{uniqueWorkers}</div>
            <p className="metric-card__caption">Unique workers represented in the current claim set.</p>
          </div>
          <div className="metric-card">
            <p className="metric-card__label">
              <BadgeIndianRupee size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
              Weekly payouts
            </p>
            <div className="metric-card__value">{formatRupees(totalPayoutsThisWeek)}</div>
            <p className="metric-card__caption">{approvedThisWeek.length} approved claims this week.</p>
          </div>
          <div className="metric-card">
            <p className="metric-card__label">
              <AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
              Needs attention
            </p>
            <div className="metric-card__value">{attentionQueue.length}</div>
            <p className="metric-card__caption">Claims currently in soft hold or manual review.</p>
          </div>
        </div>
      </section>

      <div className="page-stack">
        <section className="panel-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Manual queue</p>
              <h3 className="page-title" style={{ fontSize: '1.9rem' }}>
                Claims needing action
              </h3>
              <p className="card-copy">Open each case as a guided review instead of raw payload output.</p>
            </div>
          </div>

          {attentionQueue.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 20 }}>
              No claims need manual attention right now.
            </div>
          ) : (
            <div className="ops-list" style={{ marginTop: 20 }}>
              {attentionQueue.map((claim) => {
                const decision = formatDecision(claim.decision);
                const photos = getReviewPhotos(claim);
                const environmentSnapshot = getEnvironmentSnapshot(claim);

                return (
                  <div key={claim._id} className="ops-item">
                    <div className="history-item__row">
                      <div>
                        <div className="pill-row">
                          <div className={`decision-chip decision-chip--${decision.tone}`}>{decision.label}</div>
                          <span className={`platform-chip platform-chip--${claim.platform}`}>{formatPlatform(claim.platform)}</span>
                          <span className="status-chip status-chip--muted">{formatDisruption(claim.disruptionType)}</span>
                        </div>
                        <h4 style={{ margin: '12px 0 6px', fontSize: '1.14rem' }}>{claim.claimRef || claim.orderId}</h4>
                        <p className="helper-copy">
                          Order {claim.orderId} · worker {String(claim.workerId || '').slice(-6) || 'unknown'} · {formatDate(claim.submittedAt)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ display: 'block', fontSize: '1.05rem' }}>{formatScore(claim.compositeScore)}</strong>
                        <span className="helper-copy">Composite score</span>
                      </div>
                    </div>

                    <div className="ops-actions">
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => handleReviewAction(claim._id, 'APPROVED')}
                        disabled={reviewingClaimId === claim._id}
                      >
                        {reviewingClaimId === claim._id ? 'Saving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => handleReviewAction(claim._id, 'REJECTED')}
                        disabled={reviewingClaimId === claim._id}
                      >
                        Reject
                      </button>
                    </div>

                    <div className="history-item__detail">

                      <div className="detail-grid review-summary-grid">
                        <div className="metric-card review-summary-card">
                          <p className="metric-card__label">
                            <MapPinned size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                            Claim location
                          </p>
                          <div className="metric-card__value" style={{ fontSize: '1.05rem' }}>
                            {claim.gps?.lat?.toFixed?.(4) || 'N/A'}, {claim.gps?.lng?.toFixed?.(4) || 'N/A'}
                          </div>
                          <p className="metric-card__caption">
                            Accuracy {claim.gps?.accuracy_metres || 'N/A'}m · network {claim.gps?.network_accuracy_metres || 'N/A'}m
                          </p>
                        </div>
                        <div className="metric-card review-summary-card">
                          <p className="metric-card__label">
                            <Camera size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                            Evidence summary
                          </p>
                          <div className="metric-card__value" style={{ fontSize: '1.05rem' }}>
                            {photos.length} photos
                          </div>
                          <p className="metric-card__caption">
                            Review status {claim.reviewStatus || 'pending'} · payout {formatRupees(claim.payout?.total || 0)}
                          </p>
                        </div>
                        <div className="metric-card review-summary-card">
                          <p className="metric-card__label">
                            <ShieldCheck size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                            Payout review
                          </p>
                          <div className="metric-card__value" style={{ fontSize: '1.05rem' }}>
                            {formatRupees(claim.payout?.total || 0)}
                          </div>
                          <p className="metric-card__caption">
                            {claim.payout?.strandedHours || 0} stranded hours · {claim.payoutStatus || 'pending'} payout state
                          </p>
                        </div>
                        <div className="metric-card review-summary-card">
                          <p className="metric-card__label">
                            <Waves size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                            Environment snapshot
                          </p>
                          <div className="metric-card__value" style={{ fontSize: '1.05rem' }}>
                            {environmentSnapshot?.provider || environmentSnapshot?.condition || 'Unavailable'}
                          </div>
                          <p className="metric-card__caption">
                            Temp {environmentSnapshot?.temperatureC ?? 'N/A'}°C · alerts {environmentSnapshot?.alertsCount ?? 0}
                          </p>
                        </div>
                      </div>

                      {claim.checks?.length ? (
                        <div className="review-section">
                          <p className="metric-card__label">Verification checks</p>
                          <div className="detail-grid review-checks-grid">{claim.checks.map((check) => renderCheckCard(check))}</div>
                        </div>
                      ) : null}

                      {photos.length ? (
                        <div className="review-section">
                          <p className="metric-card__label">Submitted photos</p>
                          <div className="photo-grid" style={{ marginTop: 12 }}>
                            {photos.map((photo, index) => (
                              <div key={`${claim._id}-photo-${index}`} className="photo-card">
                                {photo.dataUrl ? (
                                  <img src={photo.dataUrl} alt={photo.name || `Claim photo ${index + 1}`} className="photo-card__image" />
                                ) : (
                                  <div className="photo-card__image review-photo-placeholder">Preview unavailable</div>
                                )}
                                <div className="photo-card__meta">
                                  <strong>{photo.name || `Photo ${index + 1}`}</strong>
                                  <span>{Math.max(1, Math.round((photo.sizeBytes || 0) / 1024))} KB</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="helper-copy">No photo evidence was attached to this claim.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
