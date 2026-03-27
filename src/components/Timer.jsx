import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Timer({ profile, onBalanceUpdate }) {
  const [minutes, setMinutes] = useState(30)
  const [remaining, setRemaining] = useState(null)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const totalRef = useRef(0)
  const intervalRef = useRef(null)

  function pad(n) { return String(n).padStart(2, '0') }
  const display = remaining !== null
    ? `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`
    : `${pad(minutes)}:00`

  function start() {
    if (running) {
      clearInterval(intervalRef.current)
      setRunning(false)
      return
    }
    const total = remaining ?? minutes * 60
    totalRef.current = total
    setRemaining(total)
    setRunning(true)
    setDone(false)
  }

  function reset() {
    clearInterval(intervalRef.current)
    setRunning(false)
    setRemaining(null)
    setDone(false)
  }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          setDone(true)
          finish(totalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  async function finish(total) {
    const earned = total
    await supabase.from('profiles')
      .update({ balance_seconds: profile.balance_seconds + earned })
      .eq('id', profile.id)
    await supabase.from('balance_logs').insert({
      user_id: profile.id, type: 'timer', earned_seconds: earned
    })
    onBalanceUpdate()
  }

  const progress = remaining !== null && totalRef.current > 0
    ? (remaining / totalRef.current) * 100 : 100

  return (
    <div>
      <div style={s.card}>
        <p style={s.label}>デトックスタイマー — スマホを置いてカウントダウン</p>
        <div style={s.row}>
          <label style={s.inputLabel}>時間（分）</label>
          <input type="number" style={s.numInput} min={1} max={180} value={minutes}
            onChange={e => { setMinutes(Number(e.target.value)); reset() }} />
        </div>
        <div style={{ ...s.timerDisplay, color: running ? '#0F6E56' : done ? '#3C3489' : 'inherit' }}>
          {display}
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
        <div style={s.btnRow}>
          <button style={s.btnPrimary} onClick={start}>
            {running ? '一時停止' : 'スタート'}
          </button>
          <button style={s.btn} onClick={reset}>リセット</button>
        </div>
        {done && (
          <div style={s.reward}>
            +{Math.round(totalRef.current / 60)}分 獲得！よくできました。
          </div>
        )}
      </div>
      <div style={s.card}>
        <p style={s.label}>タイマーの報酬ルール</p>
        <p style={s.ruleText}>
          置いた時間と同じ分数を獲得（1:1）<br />
          <span style={{ fontSize: 12 }}>例：30分置く → +30分</span>
        </p>
      </div>
    </div>
  )
}

const s = {
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' },
  label: { fontSize: 12, color: '#888', marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 },
  inputLabel: { fontSize: 13, color: '#666' },
  numInput: { width: 80, padding: '6px 10px', fontSize: 14, border: '0.5px solid #ddd', borderRadius: 8, fontFamily: 'inherit' },
  timerDisplay: { fontSize: 48, fontWeight: 500, textAlign: 'center', letterSpacing: '0.04em', margin: '1rem 0', fontVariantNumeric: 'tabular-nums' },
  progressBar: { height: 4, background: '#f0f0f0', borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#1D9E75', borderRadius: 2, transition: 'width 1s linear' },
  btnRow: { display: 'flex', gap: 8 },
  btnPrimary: { flex: 1, padding: 10, fontSize: 14, background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  btn: { flex: 1, padding: 10, fontSize: 14, background: 'transparent', border: '0.5px solid #ddd', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  reward: { textAlign: 'center', fontSize: 13, color: '#0F6E56', background: '#E1F5EE', borderRadius: 8, padding: 10, marginTop: 12 },
  ruleText: { fontSize: 13, color: '#666', lineHeight: 1.9 },
}
