import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    setError('')
    setLoading(true)
    if (mode === 'register') {
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', username).single()
      if (existing) {
        setError('このユーザー名はすでに使われています')
        setLoading(false)
        return
      }
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { username } }
      })
      if (err) { setError(err.message); setLoading(false); return }
      await supabase.from('profiles').insert({
        id: data.user.id, username, balance_seconds: 0
      })
      setDone(true)
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError('メールアドレスまたはパスワードが違います')
    }
    setLoading(false)
  }

  if (done) return (
    <div style={s.wrap}>
      <h1 style={s.title}>Silencio</h1>
      <div style={s.card}>
        <p style={s.msg}>確認メールを送信しました。メールのリンクをクリックしてからログインしてください。</p>
        <button style={s.btn} onClick={() => { setDone(false); setMode('login') }}>ログインへ</button>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <h1 style={s.title}>Silencio</h1>
      <p style={s.sub}>スマホを置くほど、時間が増える</p>
      <div style={s.card}>
        <div style={s.tabs}>
          {['login', 'register'].map(m => (
            <button key={m} style={{ ...s.tab, ...(mode === m ? s.tabActive : {}) }}
              onClick={() => { setMode(m); setError('') }}>
              {m === 'login' ? 'ログイン' : '新規登録'}
            </button>
          ))}
        </div>
        {mode === 'register' && (
          <input style={s.input} placeholder="ユーザー名"
            value={username} onChange={e => setUsername(e.target.value)} />
        )}
        <input style={s.input} placeholder="メールアドレス" type="email"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input style={s.input} placeholder="パスワード" type="password"
          value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p style={s.error}>{error}</p>}
        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
        </button>
      </div>
    </div>
  )
}

const s = {
  wrap: { maxWidth: 400, margin: '0 auto', padding: '3rem 1rem', fontFamily: 'system-ui, sans-serif' },
  title: { textAlign: 'center', fontSize: 28, fontWeight: 500, letterSpacing: '0.08em', marginBottom: 4 },
  sub: { textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 32 },
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, padding: '1.5rem' },
  tabs: { display: 'flex', gap: 4, background: '#f5f5f5', borderRadius: 8, padding: 4, marginBottom: 16 },
  tab: { flex: 1, padding: 8, fontSize: 13, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#888', fontFamily: 'inherit' },
  tabActive: { background: '#fff', color: '#111', fontWeight: 500, border: '0.5px solid #ddd' },
  input: { display: 'block', width: '100%', padding: '10px 12px', fontSize: 14, border: '0.5px solid #ddd', borderRadius: 8, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' },
  btn: { width: '100%', padding: 10, fontSize: 14, background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  error: { fontSize: 13, color: '#c0392b', marginBottom: 10 },
  msg: { fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 },
}
