import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BadgeIndianRupee, Camera, FlaskConical, MapPinned, RefreshCw } from 'lucide-react';
import { fetchAdminStats, reviewClaim, testVerification } from '../utils/api';
import { formatDate, formatDecision, formatRupees } from '../utils/formatting';

export default function AdminDashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testDisruption, setTestDisruption] = useState('flooding');
  const [testPlatform, setTestPlatform] = useState('zomato');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [reviewingClaimId, setReviewingClaimId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      const response = await fetchAdminStats({ limit: 200 });
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

  const handleSimulate = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await testVerification({
        orderId: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        platform: testPlatform,
        disruptionType: testDisruption,
        gps: { lat: 19.11, lng: 72.86 },
        claimTimestamp: new Date().toISOString(),
        workerId: 'mock-worker',
        claimRef: 'DEMO-REF',
      });

      setTestResult(response);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setIsTesting(false);
    }
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
            <p className="card-copy">Monitor the queue, release manual decisions, and test the verification pipeline.</p>
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

      <div className="ops-grid">
        <section className="panel-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Manual queue</p>
              <h3 className="page-title" style={{ fontSize: '1.9rem' }}>
                Claims needing action
              </h3>
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

                return (
                  <div key={claim._id} className="ops-item">
                    <div className="history-item__row">
                      <div>
                        <div className={`decision-chip decision-chip--${decision.tone}`}>{decision.label}</div>
                        <h4 style={{ margin: '10px 0 6px', fontSize: '1.08rem' }}>{claim.claimRef || claim.orderId}</h4>
                        <p className="helper-copy">{formatDate(claim.submittedAt)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ display: 'block' }}>
                          {typeof claim.compositeScore === 'number' ? claim.compositeScore.toFixed(2) : 'N/A'}
                        </strong>
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
                      <div className="pill-row">
                        <span className={`platform-chip platform-chip--${claim.platform}`}>{claim.platform}</span>
                        <span className="status-chip status-chip--muted">{claim.disruptionType}</span>
                        <span className="status-chip status-chip--muted">Order {claim.orderId}</span>
                      </div>

                      <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        <div className="metric-card">
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
                        <div className="metric-card">
                          <p className="metric-card__label">Evidence summary</p>
                          <div className="metric-card__value" style={{ fontSize: '1.05rem' }}>
                            {claim.evidence?.photos?.length || claim.photos?.length || 0} photos
                          </div>
                          <p className="metric-card__caption">
                            Weather score {claim.checks?.find?.((check) => check.checkName === 'environmental')?.score?.toFixed?.(2) || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {claim.checks?.length ? (
                        <div className="mono-block" style={{ minHeight: 220 }}>
                          {JSON.stringify(claim.checks, null, 2)}
                        </div>
                      ) : null}

                      {(claim.evidence?.photos?.length || claim.photos?.length) ? (
                        <div>
                          <p className="metric-card__label">
                            <Camera size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                            Submitted photos
                          </p>
                          <div className="photo-grid" style={{ marginTop: 12 }}>
                            {(claim.evidence?.photos || claim.photos || []).map((photo, index) => (
                              <div key={`${claim._id}-photo-${index}`} className="photo-card">
                                <img src={photo.dataUrl} alt={photo.name || `Claim photo ${index + 1}`} className="photo-card__image" />
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

        <section className="panel-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Verification sandbox</p>
              <h3 className="page-title" style={{ fontSize: '1.9rem' }}>
                Simulate a claim
              </h3>
            </div>
            <FlaskConical size={20} />
          </div>

          <div className="field" style={{ marginTop: 20 }}>
            <label>Platform</label>
            <div className="selection-grid selection-grid--two">
              {['zomato', 'swiggy'].map((platform) => (
                <button
                  key={platform}
                  type="button"
                  className={`toggle-chip${testPlatform === platform ? ' toggle-chip--active' : ''}`}
                  onClick={() => setTestPlatform(platform)}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="test-disruption">Disruption type</label>
            <select id="test-disruption" value={testDisruption} onChange={(event) => setTestDisruption(event.target.value)}>
              <option value="flooding">Flooding</option>
              <option value="heat">Heatwave</option>
              <option value="aqi">Poor AQI</option>
              <option value="strike">Strike</option>
              <option value="road_closure">Road closure</option>
            </select>
          </div>

          <button type="button" className="button button--primary" style={{ marginTop: 20 }} onClick={handleSimulate} disabled={isTesting}>
            {isTesting ? 'Running simulation...' : 'Run verification test'}
          </button>

          <div className="mono-block" style={{ marginTop: 20 }}>
            {testResult ? JSON.stringify(testResult, null, 2) : 'Run a simulation to inspect the raw verification response.'}
          </div>
        </section>
      </div>
    </div>
  );
}
