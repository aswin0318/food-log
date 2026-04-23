import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { macroApi } from '../api'
import { useAuth } from '../context/AuthContext'

export function Onboarding() {
  const navigate = useNavigate()
  const { refreshTargets } = useAuth()
  const [form, setForm] = useState({
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    activity_level: 'sedentary',
    goal: 'maintaining',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    // Parse to numbers
    const payload = {
      ...form,
      age: parseInt(form.age, 10),
      height: parseFloat(form.height),
      weight: parseFloat(form.weight),
    }

    try {
      await macroApi.onboard(payload)
      await refreshTargets()
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail[0].msg)
      } else {
        setError(detail || err.message || 'Onboarding failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card" style={{ maxWidth: '500px' }}>
        <h1 className="text-2xl text-center">Set Up Your Profile</h1>
        <p className="text-center">Let's calculate your personalized macro targets.</p>

        {error && <div className="error-msg">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Gender</label>
              <select className="select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Age (years)</label>
              <input className="input" type="number" min="10" max="120" required
                value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Height (cm)</label>
              <input className="input" type="number" min="50" max="300" required step="0.1"
                value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Weight (kg)</label>
              <input className="input" type="number" min="20" max="500" required step="0.1"
                value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Activity Level</label>
            <select className="select" value={form.activity_level} onChange={e => setForm({ ...form, activity_level: e.target.value })}>
              <option value="sedentary">Sedentary (little to no exercise)</option>
              <option value="lightly_active">Lightly Active (1-3 days/week)</option>
              <option value="moderately_active">Moderately Active (3-5 days/week)</option>
              <option value="very_active">Very Active (6-7 days/week)</option>
              <option value="extra_active">Extra Active (very hard exercise/job)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Primary Goal</label>
            <select className="select" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>
              <option value="cutting">Cutting (Fat Loss)</option>
              <option value="maintaining">Maintaining</option>
              <option value="bulking">Bulking (Muscle Gain)</option>
            </select>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Calculating Targets...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
