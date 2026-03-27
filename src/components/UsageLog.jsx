import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function UsageLog({ profile, onBalanceUpdate }) {
  const [hours, setHours] = useState(2)
  const [mins, setMins] = useState(0)
  const [result, setResult] = useState(null)

  function calcEarned(totalMins) {
    if (totalMins < 120) return 30 * 60
    if (totalMins < 240) return 15 * 60
    if (totalMins < 360) return 5 * 60
    return 0
  }

  async function handleLog() {
    const totalMins = hours * 60 + mins
    const earned = calcEarned(totalMins)
    await supabase.from('profiles')
      .update({ balance_seconds: profile.balance_seconds + earned })
      .eq('id', profile.id)
    await supabase.from('balance_logs').insert({
      user_id: profile.id, type: 'usage', earned_seconds: earned
    })
    onBalanceUpdate()
    setResult(earned)
  }

  return (
    <div>
      <div style={s.card}>
        <p style={s.label}>今日のスマホ使用時間を申告する</p>
        <div style={s.row}>
          <label style={s.inputLabel}>時間</label>
          <input type="number" style={s.numInput} min={0} max={16} value={hours}
            onChange={e => setHours(Number(e.target.value))} />
          <label style={s.inputLabel}>分</label>
          <input type="number" style={s.numInput} min={0} max={59} value={mins}
            onChange={e => setMins(Number(e.target.value))} />
        </div>
        <button style={s.btnPrimary} onClick={handleLog}>申告する</button>
        {result !== null && (
          <p style={{ ...s.resultMsg, color: result > 0 ? '#0F6E56' : '#888' }}>
            {result > 0
              ? `申告完了！ +${result / 60}分 獲得しました。`
              : '申告完了。使用時間が6時間以上のため今回は獲得なしです。'}
          </p>
        )}
      </div>
      <div style={s.card}>
        <p style={s.label}>申告報酬ルール</p>
        <table style={s.table}>
          <tbody>
            {[['2時間未満', '+30分'], ['2〜4時間', '+15分'], ['4〜6時間', '+5分'], ['6時間以上', '+0分']].map(([k, v]) => (
              <tr key={k} style={s.tr}>
                <td style={s.td}>{k}</td>
                <td style={{ ...s.td, textAlign: 'right', fontWeight: 500, color: '#111' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={s.divider} />
        <p style={{ fontSize: 12, color: '#888' }}>タイマーを使う方がより多く獲得できます</p>
      </div>
    </div>
  )
}

const s = {
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' },
  label: { fontSize: 12, color: '#888', marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
  inputLabel: { fontSize: 13, color: '#666' },
  numInput: { width: 70, padding: '6px 10px', fontSize: 14, border: '0.5px solid #ddd', borderRadius: 8, fontFamily: 'inherit' },
  btnPrimary: { width: '100%', padding: 10, fontSize: 14, background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  resultMsg: { fontSize: 13, textAlign: 'center', marginTop: 10 },
  table: { width: '100%', fontSize: 13, borderCollapse: 'collapse' },
  tr: { borderBottom: '0.5px solid #eee' },
  td: { padding: '6px 0', color: '#666' },
  divider: { height: '0.5px', background: '#eee', margin: '12px 0' },
}
