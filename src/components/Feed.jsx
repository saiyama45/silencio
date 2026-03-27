import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Feed({ profile, onBalanceUpdate }) {
  const [posts, setPosts] = useState([])
  const [body, setBody] = useState('')
  const [openComments, setOpenComments] = useState({})
  const [commentInputs, setCommentInputs] = useState({})
  const intervalRef = useRef(null)

  useEffect(() => {
    fetchPosts()

    intervalRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('profiles').select('balance_seconds').eq('id', profile.id).single()
      if (!data || data.balance_seconds <= 0) {
        clearInterval(intervalRef.current)
        onBalanceUpdate()
        return
      }
      await supabase.from('profiles')
        .update({ balance_seconds: data.balance_seconds - 1 })
        .eq('id', profile.id)
      onBalanceUpdate()
    }, 1000)

    const channel = supabase.channel('posts-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, fetchPosts)
      .subscribe()

    return () => {
      clearInterval(intervalRef.current)
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles(username), likes(id, user_id), comments(id, body, profiles(username))`)
      .order('created_at', { ascending: false })
      .limit(30)
    setPosts(data ?? [])
  }

  async function submitPost() {
    if (!body.trim()) return
    await supabase.from('posts').insert({ user_id: profile.id, body: body.trim() })
    setBody('')
    fetchPosts()
  }

  async function toggleLike(post) {
    const liked = post.likes.some(l => l.user_id === profile.id)
    if (liked) {
      await supabase.from('likes').delete()
        .eq('user_id', profile.id).eq('post_id', post.id)
    } else {
      await supabase.from('likes').insert({ user_id: profile.id, post_id: post.id })
    }
    fetchPosts()
  }

  async function submitComment(postId) {
    const text = commentInputs[postId]?.trim()
    if (!text) return
    await supabase.from('comments').insert({ user_id: profile.id, post_id: postId, body: text })
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
    fetchPosts()
  }

  if (profile.balance_seconds <= 0) return (
    <div style={s.blocked}>
      <div style={s.blockedIcon}>◌</div>
      <p style={s.blockedText}>
        閲覧可能時間が不足しています。<br />
        タイマーを使うか、使用時間を申告して<br />
        時間を獲得してください。
      </p>
    </div>
  )

  return (
    <div>
      <div style={s.card}>
        <textarea style={s.textarea} rows={3} maxLength={280}
          placeholder="いまどんなことを考えていますか？"
          value={body} onChange={e => setBody(e.target.value)} />
        <div style={s.composeFooter}>
          <span style={s.charCount}>{body.length} / 280</span>
          <button style={s.btnPost} onClick={submitPost}>投稿</button>
        </div>
      </div>

      <div style={s.card}>
        {posts.length === 0
          ? <p style={s.empty}>まだ投稿がありません</p>
          : posts.map(post => {
            const liked = post.likes.some(l => l.user_id === profile.id)
            const initials = (post.profiles?.username ?? '?').slice(0, 2).toUpperCase()
            return (
              <div key={post.id} style={s.postItem}>
                <div style={s.postHeader}>
                  <div style={s.avatar}>{initials}</div>
                  <div>
                    <div style={s.username}>@{post.profiles?.username}</div>
                    <div style={s.time}>
                      {new Date(post.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <p style={s.postBody}>{post.body}</p>
                <div style={s.actions}>
                  <button
                    style={{ ...s.actionBtn, color: liked ? '#D85A30' : '#888' }}
                    onClick={() => toggleLike(post)}>
                    ♥ {post.likes.length}
                  </button>
                  <button style={s.actionBtn}
                    onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}>
                    ✦ {post.comments.length}
                  </button>
                </div>
                {openComments[post.id] && (
                  <div style={s.commentSection}>
                    {post.comments.map(c => (
                      <div key={c.id} style={s.commentItem}>
                        <span style={s.commentUser}>@{c.profiles?.username}</span>
                        <span style={{ fontSize: 13 }}>{c.body}</span>
                      </div>
                    ))}
                    <div style={s.commentInputRow}>
                      <input style={s.commentInput} placeholder="コメントを入力..." maxLength={140}
                        value={commentInputs[post.id] ?? ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))} />
                      <button style={s.commentBtn} onClick={() => submitComment(post.id)}>送信</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

const s = {
  blocked: { textAlign: 'center', padding: '3rem 1rem' },
  blockedIcon: { fontSize: 32, color: '#aaa', marginBottom: 12 },
  blockedText: { fontSize: 14, color: '#888', lineHeight: 1.7 },
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' },
  textarea: { width: '100%', fontSize: 14, fontFamily: 'inherit', resize: 'none', padding: 12, borderRadius: 8, border: '0.5px solid #ddd', lineHeight: 1.6, boxSizing: 'border-box' },
  composeFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  charCount: { fontSize: 12, color: '#aaa' },
  btnPost: { padding: '8px 20px', fontSize: 14, background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  postItem: { borderBottom: '0.5px solid #eee', padding: '1rem 0' },
  postHeader: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', flexShrink: 0 },
  username: { fontSize: 13, fontWeight: 500 },
  time: { fontSize: 11, color: '#aaa' },
  postBody: { fontSize: 14, lineHeight: 1.7, marginBottom: 10 },
  actions: { display: 'flex', gap: 16 },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888', fontFamily: 'inherit', padding: '4px 0' },
  commentSection: { marginTop: 10, paddingTop: 10, borderTop: '0.5px solid #eee' },
  commentItem: { display: 'flex', gap: 6, fontSize: 13, padding: '3px 0' },
  commentUser: { fontWeight: 500, color: '#888', whiteSpace: 'nowrap' },
  commentInputRow: { display: 'flex', gap: 6, marginTop: 8 },
  commentInput: { flex: 1, padding: '6px 10px', fontSize: 13, border: '0.5px solid #ddd', borderRadius: 8, fontFamily: 'inherit' },
  commentBtn: { padding: '6px 12px', fontSize: 13, border: '0.5px solid #ddd', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 14, padding: '1.5rem 0' },
}
