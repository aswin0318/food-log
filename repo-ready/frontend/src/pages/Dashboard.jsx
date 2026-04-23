import { useState, useEffect } from 'react'
import { macroApi, complianceApi } from '../api'

const today = () => new Date().toISOString().split('T')[0]
const weekAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().split('T')[0]
}

export default function Dashboard() {
  const [comparison, setComparison] = useState(null)
  const [weekly, setWeekly] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      macroApi.getComparison(today()).catch(() => null),
      macroApi.getWeeklySummary(weekAgo()).catch(() => null),
      complianceApi.getAlerts(5).catch(() => null),
    ]).then(([comp, week, al]) => {
      setComparison(comp)
      setWeekly(week)
      setAlerts(al)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  const macros = comparison ? [
    { label: 'Calories', actual: comparison.actual.total_calories, target: comparison.target.daily_calorie_target, pct: comparison.calorie_percentage, status: comparison.calorie_status, color: '#8b5cf6' },
    { label: 'Protein', actual: comparison.actual.total_protein, target: comparison.target.daily_protein_target, pct: comparison.protein_percentage, status: comparison.protein_status, color: '#06b6d4' },
    { label: 'Carbs', actual: comparison.actual.total_carbs, target: comparison.target.daily_carbs_target, pct: comparison.carbs_percentage, status: comparison.carbs_status, color: '#10b981' },
    { label: 'Fat', actual: comparison.actual.total_fat, target: comparison.target.daily_fat_target, pct: comparison.fat_percentage, status: comparison.fat_status, color: '#f59e0b' },
  ] : []

  const statusBadge = (status) => {
    if (status === 'ok') return <span className="badge badge-green">On Track</span>
    if (status === 'surplus' || status === 'excess') return <span className="badge badge-red">{status}</span>
    return <span className="badge badge-amber">{status}</span>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Today's nutrition overview — {today()}</p>
        </div>
      </div>

      {/* Macro Cards */}
      <div className="grid-4 mb-6">
        {macros.map(m => (
          <div className="card" key={m.label}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted">{m.label}</span>
              {statusBadge(m.status)}
            </div>
            <div className="text-2xl" style={{ marginBottom: '0.25rem' }}>{m.actual}
              <span className="text-sm text-muted" style={{ fontWeight: 400 }}> / {m.target}{m.label === 'Calories' ? ' kcal' : 'g'}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${Math.min(m.pct, 100)}%`,
                background: m.pct > 120 ? 'var(--accent-red)' : m.pct < 70 ? 'var(--accent-amber)' : m.color
              }} />
            </div>
            <div className="text-xs text-muted mt-1">{m.pct}%</div>
          </div>
        ))}
      </div>

      {/* Weekly Trend */}
      {weekly && (
        <div className="card mb-6">
          <h3 style={{ marginBottom: '1rem' }}>Weekly Trend <span className="text-muted text-sm">({weekly.start_date} → {weekly.end_date})</span></h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '120px' }}>
            {weekly.daily_breakdowns.map((d, i) => {
              const maxCal = Math.max(...weekly.daily_breakdowns.map(x => x.total_calories), 1)
              const h = (d.total_calories / maxCal) * 100
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="text-xs text-muted">{d.total_calories}</span>
                  <div style={{
                    width: '100%',
                    height: `${h}%`,
                    minHeight: '4px',
                    background: 'var(--gradient)',
                    borderRadius: '6px 6px 2px 2px',
                    opacity: d.meal_count === 0 ? 0.2 : 1,
                  }} />
                  <span className="text-xs text-muted">{new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-muted">Avg: {weekly.weekly_averages.total_calories} kcal/day</span>
            <span className="text-sm text-muted">{weekly.total_meals} meals</span>
          </div>
        </div>
      )}

      {/* Reports & Analysis */}
      <div className="grid-2 mb-6">
        <div className="card">
          <h3 className="mb-4">Daily Analysis</h3>
          <p className="text-sm text-muted mb-4">Run a deep check of today's goals and meal frequency.</p>
          <button className="btn btn-primary btn-sm" onClick={async () => {
             setLoading(true)
             try {
               await complianceApi.checkCompliance(today())
               const al = await complianceApi.getAlerts(5)
               setAlerts(al)
               alert("Daily analysis complete! Check your alerts.")
             } catch (e) {
               alert("Daily analysis failed: " + (e.response?.data?.detail || e.message))
             } finally {
               setLoading(false)
             }
          }}>Run Daily Check</button>
        </div>

        <div className="card">
          <h3 className="mb-4">Weekly Report</h3>
          <p className="text-sm text-muted mb-4">Analyze trends and identify missing logs.</p>
          <button className="btn btn-outline btn-sm" onClick={async () => {
             setLoading(true)
             try {
               const res = await complianceApi.analyzePatterns(7)
               const avgText = res.weekly_averages ? 
                 `Logged Day Analysis:\n- Average: ${res.weekly_averages.avg_calories} kcal (${res.weekly_averages.status})\n- Protein: ${res.weekly_averages.avg_protein}g\n` : ''
               
               const missingText = res.missing_logs?.length > 0 ? 
                 `Missing Logs (${res.weekly_averages.missed_days} days):\n${res.missing_logs.map(m => `- ${m.date}: ${m.status}`).join('\n')}\n` : 'No missing logs found!\n'
               
               const yetToLogText = res.yet_to_log?.length > 0 ?
                 `Yet to log today: ${res.yet_to_log.join(', ')}\n` : ''

               const patternText = res.patterns_found?.length > 0 ?
                 `Trends Detected:\n${res.patterns_found.map(p => `- ${p.message}`).join('\n')}` : ''

               alert(`📊 WEEKLY ANALYSIS REPORT\n\n${avgText}\n${missingText}\n${yetToLogText}\n${patternText}`)
             } catch (e) {
               alert(e.response?.data?.detail || "Weekly analysis failed.")
             } finally {
               setLoading(false)
             }
          }}>Generate Weekly Report</button>
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts && alerts.alerts.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Recent Alerts {alerts.unread_count > 0 && <span className="badge badge-red">{alerts.unread_count} new</span>}</h3>
          {alerts.alerts.slice(0, 3).map(a => (
            <div key={a.id} style={{
              padding: '0.75rem',
              borderBottom: '1px solid var(--border)',
              opacity: a.is_read ? 0.6 : 1,
            }}>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ fontWeight: 500 }}>{a.title}</span>
                <span className={`badge ${a.severity === 'high' ? 'badge-red' : a.severity === 'medium' ? 'badge-amber' : 'badge-green'}`}>{a.severity}</span>
              </div>
              <p className="text-xs text-muted mt-1">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {!comparison && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">No data for today. Start by logging a meal! 🍽️</p>
        </div>
      )}
    </div>
  )
}
