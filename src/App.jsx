import { useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'
import Auth from './components/Auth'
import Feed from './components/Feed'
import Timer from './components/Timer'
import UsageLog from './components/UsageLog'
import History from './components/History'

const TABS = [
  { id: 'feed', label: 'フィード' },
  { id: 'timer', label: 'タイマー' },
  { id: 'log', label: '申告' },
  { id: 'history', label: '履歴' },
]

export default function App() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const [tab, setTab] = useState('timer')

  if (loading) return (
    <div style={s.loading}>読み込み中...</div>
  )
  if (!user || !profile) return <Auth />

  const balanceMins = Math.floor((profile?.balance_seconds ?? 0) / 60)
  const balanceSecs = (profile?.balance_seconds ?? 0) % 60

  return (
    <div style={s.app}>
      <div style={s.header}>
        <h1 style={s.title}>Silencio</h1>
        <p style={s.sub}>スマホを置くほど、時間が増える</p>
      </div>

      <div style={s.balanceCard}>
        <div>
          <div style={s.balanceLabel}>閲覧可能時間</div>
          <div style={s.balanceValue}>
            {String(balanceMins).padStart(2, '0')}:{String(balanceSecs).padStart(2, '0')}
          </div>
        </div>
        <div style={s.userBadge}>@{profile.username}</div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id}
            style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'feed' && <Feed profile={profile} onBalanceUpdate={refreshProfile} />}
        {tab === 'timer' && <Timer profile={profile} onBalanceUpdate={refreshProfile} />}
        {tab === 'log' && <UsageLog profile={profile} onBalanceUpdate={refreshProfile} />}
        {tab === 'history' && <History profile={profile} />}
      </div>

      <button style={s.signOut} onClick={() => supabase.auth.signOut()}>
        ログアウト
      </button>
    </div>
  )
}

const s = {
  app: { maxWidth: 480, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'system-ui, sans-serif' },
  loading: { textAlign: 'center', padding: '3rem', fontFamily: 'system-ui, sans-serif', color: '#888' },
  header: { textAlign: 'center', marginBottom: '1.5rem' },
  title: { fontSize: 22, fontWeight: 500, letterSpacing: '0.08em', margin: 0 },
  sub: { fontSize: 13, color: '#888', marginTop: 4 },
  balanceCard: { background: '#f5f5f5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 },
  balanceValue: { fontSize: 28, fontWeight: 500, fontVariantNumeric: 'tabular-nums' },
  userBadge: { fontSize: 12, color: '#888' },
  tabs: { display: 'flex', gap: 4, background: '#f5f5f5', borderRadius: 8, padding: 4, marginBottom: '1.25rem' },
  tab: { flex: 1, padding: 8, fontSize: 13, textAlign: 'center', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#888', fontFamily: 'inherit' },
  tabActive: { background: '#fff', color: '#111', fontWeight: 500, border: '0.5px solid #ddd' },
  signOut: { width: '100%', marginTop: '1.5rem', padding: 10, fontSize: 13, background: 'transparent', border: '0.5px solid #ddd', borderRadius: 8, cursor: 'pointer', color: '#888', fontFamily: 'inherit' },
}
