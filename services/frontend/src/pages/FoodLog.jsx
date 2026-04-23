import { useState, useEffect } from 'react'
import { foodApi } from '../api'

const today = () => new Date().toISOString().split('T')[0]
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function FoodLog() {
  const [meals, setMeals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(today())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', meal_type: 'lunch', calories: '', protein: '', carbs: '', fat: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchMeals = () => {
    setLoading(true)
    foodApi.getDailyMeals(date)
      .then(setMeals)
      .catch(() => setMeals({ meals: [], total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0, meal_count: 0 }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMeals() }, [date])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await foodApi.createMeal({
        name: form.name,
        meal_type: form.meal_type,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
        logged_at: `${date}T12:00:00`,
      })
      setForm({ name: '', meal_type: 'lunch', calories: '', protein: '', carbs: '', fat: '' })
      setShowForm(false)
      fetchMeals()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add meal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this meal?')) return
    await foodApi.deleteMeal(id)
    fetchMeals()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Food <span className="gradient-text">Log</span></h1>
          <p className="text-muted">Track your daily meals and macros</p>
        </div>
        <div className="flex gap-2">
          <input type="date" className="input" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Meal'}
          </button>
        </div>
      </div>

      {/* Add Meal Form */}
      {showForm && (
        <div className="card mb-4">
          <h3 style={{ marginBottom: '1rem' }}>Add Meal</h3>
          {error && <div className="error-msg mb-2">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid-2 mb-2">
              <div className="form-group">
                <label>Meal Name</label>
                <input className="input" placeholder="e.g. Chicken Rice" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="input select" value={form.meal_type}
                  onChange={e => setForm({ ...form, meal_type: e.target.value })}>
                  {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-4 mb-2">
              {['calories', 'protein', 'carbs', 'fat'].map(f => (
                <div className="form-group" key={f}>
                  <label>{f.charAt(0).toUpperCase() + f.slice(1)} {f === 'calories' ? '(kcal)' : '(g)'}</label>
                  <input className="input" type="number" min="0" step="0.1" placeholder="0"
                    value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} required />
                </div>
              ))}
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Meal'}
            </button>
          </form>
        </div>
      )}

      {/* Daily Totals */}
      {meals && (
        <div className="grid-4 mb-4">
          {[
            { label: 'Calories', val: meals.total_calories, unit: 'kcal', color: '#8b5cf6' },
            { label: 'Protein', val: meals.total_protein, unit: 'g', color: '#06b6d4' },
            { label: 'Carbs', val: meals.total_carbs, unit: 'g', color: '#10b981' },
            { label: 'Fat', val: meals.total_fat, unit: 'g', color: '#f59e0b' },
          ].map(s => (
            <div className="card" key={s.label} style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="text-xs text-muted">{s.label}</div>
              <div className="text-2xl">{s.val} <span className="text-sm text-muted">{s.unit}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Meal List */}
      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Meals ({meals?.meal_count || 0})</h3>
          {(!meals || meals.meals.length === 0) ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No meals logged for this date</p>
          ) : (
            meals.meals.map(meal => (
              <div key={meal.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 0', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{meal.name}</div>
                  <div className="text-xs text-muted" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <span className="badge badge-violet">{meal.meal_type}</span>
                    <span>{meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fat}g</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(meal.id)}>🗑️</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
