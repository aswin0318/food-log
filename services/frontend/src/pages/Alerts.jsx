import { useState, useEffect } from 'react'
import { complianceApi } from '../api'

export default function Alerts() {
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  const fetchAlerts = () => {
    setLoading(true)
    complianceApi.getAlerts(100)
      .then(setAlerts)
      .catch(() => setAlerts({ alerts: [], total: 0, unread_count: 0 }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAlerts() }, [])

  const markRead = async (id) => {
    await complianceApi.markAlertRead(id)
    fetchAlerts()
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      await complianceApi.analyzePatterns(7)
      fetchAlerts()
    } catch {} finally {
      setAnalyzing(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Compliance <span className="gradient-text">Alerts</span></h1>
          <p className="text-muted">Monitor your diet compliance</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={fetchAlerts}>🔄 Refresh</button>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? '⏳ Analyzing...' : '🔍 Run Analysis'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3 mb-6">
        <div className="card" style={{ borderLeft: '3px solid var(--accent-green)' }}>
          <div className="text-xs text-muted">Resolved</div>
          <div className="text-2xl">{alerts ? alerts.total - alerts.unread_count : 0}</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
          <div className="text-xs text-muted">Unread</div>
          <div className="text-2xl">{alerts?.unread_count || 0}</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--accent-violet)' }}>
          <div className="text-xs text-muted">Total</div>
          <div className="text-2xl">{alerts?.total || 0}</div>
        </div>
      </div>

      {/* Alert List */}
      <div className="card">
        {(!alerts || alerts.alerts.length === 0) ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '3rem' }}>
            No alerts yet. Run an analysis to check your compliance! 🎉
          </p>
        ) : (
          alerts.alerts.map(a => (
            <div key={a.id} style={{
              padding: '1rem',
              borderBottom: '1px solid var(--border)',
              opacity: a.is_read ? 0.5 : 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2 mb-2" style={{ gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>
                    {a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟡' : '🟢'}
                  </span>
                  <span style={{ fontWeight: 600 }}>{a.title}</span>
                  <span className={`badge ${a.severity === 'high' ? 'badge-red' : a.severity === 'medium' ? 'badge-amber' : 'badge-green'}`}>
                    {a.severity}
                  </span>
                  <span className="badge badge-violet">{a.alert_type}</span>
                </div>
                <p className="text-sm text-muted">{a.message}</p>
                <p className="text-xs text-muted mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              {!a.is_read && (
                <button className="btn btn-outline btn-sm" onClick={() => markRead(a.id)}>✓ Read</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
