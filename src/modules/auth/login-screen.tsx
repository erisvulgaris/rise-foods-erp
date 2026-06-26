'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, ShieldCheck, Zap, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useApp } from '@/shared/lib/store'
import { ROLE_LABELS, type Role } from '@/shared/lib/rbac'
import { toast } from 'sonner'

const DEMO_USERS: { email: string; password: string; role: Role; name: string; desc: string }[] = [
  { email: 'owner@risefoods.in', password: 'owner123', role: 'owner', name: 'Ankit Yadav', desc: 'Complete control' },
  { email: 'admin@risefoods.in', password: 'admin123', role: 'admin', name: 'Operations Admin', desc: 'Operations' },
  { email: 'sales@risefoods.in', password: 'sales123', role: 'sales_manager', name: 'Deepak Mishra', desc: 'Sales analytics' },
  { email: 'salesman@risefoods.in', password: 'ravi123', role: 'salesman', name: 'Ravi Patel', desc: 'Field sales' },
  { email: 'purchase@risefoods.in', password: 'purchase123', role: 'purchase_manager', name: 'Vikas Singh', desc: 'Procurement' },
  { email: 'warehouse@risefoods.in', password: 'warehouse123', role: 'warehouse_manager', name: 'Suresh Kumar', desc: 'Stock & warehouse' },
  { email: 'finance@risefoods.in', password: 'finance123', role: 'accountant', name: 'Pooja Agarwal', desc: 'Finance & reports' },
]

export function LoginScreen() {
  const { setUser } = useApp()
  const [email, setEmail] = useState('owner@risefoods.in')
  const [password, setPassword] = useState('owner123')
  const [loading, setLoading] = useState(false)

  const login = async (e?: React.FormEvent, em?: string, pw?: string) => {
    e?.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em ?? email, password: pw ?? password }),
      })
      if (!r.ok) {
        const err = await r.json()
        toast.error(err.error ?? 'Login failed')
        return
      }
      const user = await r.json()
      setUser(user)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
    } catch (err) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (u: typeof DEMO_USERS[number]) => {
    setEmail(u.email)
    setPassword(u.password)
    login(undefined, u.email, u.password)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Hero side */}
      <div className="lg:flex-1 relative overflow-hidden bg-grid p-8 lg:p-12 flex flex-col justify-between">
        <div className="absolute inset-0 gradient-mesh opacity-80" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Rise Foods</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">ERP · Operating System</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md mt-12 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-soft" />
              Live · Gorakhpur, Uttar Pradesh
            </div>
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
              The operating system for <span className="gradient-text">FMCG manufacturing</span> & distribution.
            </h1>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Inventory, procurement, sales, finance, CRM, and analytics — unified in one real-time platform.
              Built for spice & food repacking brands. Powered by actionable AI insights.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { icon: Zap, label: 'Real-time', sub: 'Live KPIs' },
                { icon: ShieldCheck, label: 'RBAC', sub: '11 roles' },
                { icon: TrendingUp, label: 'AI Insights', sub: 'Auto-generated' },
              ].map((f) => (
                <Card key={f.label} className="p-3 glass shadow-soft">
                  <f.icon className="h-4 w-4 text-primary mb-1.5" />
                  <p className="text-xs font-medium">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.sub}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground mt-12 lg:mt-0">
          © 2026 Rise Foods · Gorakhpur, UP · Spices, Besan, Poha, Rice, Atta, Millets
        </p>
      </div>

      {/* Login side */}
      <div className="lg:w-[480px] p-8 lg:p-12 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to access your dashboard</p>

          <form onSubmit={login} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" placeholder="you@risefoods.in" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" placeholder="••••••••" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 shadow-soft">
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <p className="text-xs text-muted-foreground">Quick demo login</p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u)}
                  disabled={loading}
                  className="text-left rounded-lg border bg-card p-2.5 hover:border-primary/40 hover:shadow-soft transition-all disabled:opacity-50"
                >
                  <p className="text-xs font-medium truncate">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{ROLE_LABELS[u.role]}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
