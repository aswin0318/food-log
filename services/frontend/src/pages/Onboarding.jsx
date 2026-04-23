import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { macroApi } from '../api'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { motion } from 'framer-motion'

export function Onboarding() {
  const navigate = useNavigate()
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <Card className="glass-panel border border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gradient">Set Up Your Profile</CardTitle>
            <p className="text-sm text-center text-gray-400 mt-2">
              Let's calculate your personalized macro targets.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender</label>
                  <select 
                    className="w-full bg-black/20 border border-[var(--border)] rounded px-3 py-2 text-white"
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age (years)</label>
                  <input 
                    type="number" 
                    min="10" max="120" required
                    className="w-full bg-black/20 border border-[var(--border)] rounded px-3 py-2 text-white"
                    value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Height (cm)</label>
                  <input 
                    type="number" 
                    min="50" max="300" required step="0.1"
                    className="w-full bg-black/20 border border-[var(--border)] rounded px-3 py-2 text-white"
                    value={form.height}
                    onChange={e => setForm({ ...form, height: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <input 
                    type="number" 
                    min="20" max="500" required step="0.1"
                    className="w-full bg-black/20 border border-[var(--border)] rounded px-3 py-2 text-white"
                    value={form.weight}
                    onChange={e => setForm({ ...form, weight: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Activity Level</label>
                <select 
                  className="w-full bg-black/20 border border-[var(--border)] rounded px-3 py-2 text-white"
                  value={form.activity_level}
                  onChange={e => setForm({ ...form, activity_level: e.target.value })}
                >
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                  <option value="very_active">Very Active (6-7 days/week)</option>
                  <option value="extra_active">Extra Active (very hard exercise/job)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Goal</label>
                <select 
                  className="w-full bg-black/20 border border-[var(--border)] rounded px-3 py-2 text-white"
                  value={form.goal}
                  onChange={e => setForm({ ...form, goal: e.target.value })}
                >
                  <option value="cutting">Cutting (Fat Loss)</option>
                  <option value="maintaining">Maintaining</option>
                  <option value="bulking">Bulking (Muscle Gain)</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Calculating Targets...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
