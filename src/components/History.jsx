import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function History({ profile }) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (!profile) return
    supabase.from('balance_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setLogs(data ?? []))
  }, [profile])

  return (
    <div style={s.card}>
      <p style={s.label}>獲得履歴</p>
      {logs.length === 0
        ? <p style={s.empty}>まだ記録がありません</p>
        : logs.map(log => (
          <div key={log.id} style={s.item}>
            <div>
              <div style={s.itemLabel}>
                {log.type === 'timer'
                  ? `${log.earned_seconds / 60}分のデトックス完了`
                  : '使用時間を申告'}
              </div>
              <div style={s.itemDate}>
                {new Date(log.created_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
            <span style={{ ...s.badge, ...(log.type === 'timer' ? s.badgeTimer : s.badgeUsage) }}>
              {log.earned_seconds > 0 ? `+${log.earned_seconds / 60}分` : '±0'}
            </span>
          </div>
        ))
      }
    </div>
  )
}

const s = {
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, padding: '1.25rem' },
  label: { fontSize: 12, color: '#888', marginBottom: 12 },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 14, padding: '2rem 0' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #eee' },
  itemLabel: { fontSize: 14, color: '#111' },
  itemDate: { fontSize: 12, color: '#aaa', marginTop: 2 },
  badge: { fontSize: 11, padding: '2px 8px', borderRadius: 20 },
  badgeTimer: { background: '#E1F5EE', color: '#0F6E56' },
  badgeUsage: { background: '#FAEEDA', color: '#854F0B' },
}
