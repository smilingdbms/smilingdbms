import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ══════════════════════════════════════════════════════════
// PROFILE COMMENTS v1.0 — @Mention + Comments
// Works for candidate profiles AND BD pipeline entries
// Features: @mention dropdown, replies, edit, delete,
// notifications, role-based access
// ══════════════════════════════════════════════════════════

interface Comment {
  id: string
  content: string
  author_id: string
  mentions: string[]
  parent_id: string | null
  is_edited: boolean
  created_at: string
  updated_at: string
  app_users?: { full_name: string; role: string }
}

interface TeamMember {
  id: string
  full_name: string
  role: string
}

interface ProfileCommentsProps {
  entityId: string        // profile_id or bd_entry_id
  entityType: 'profile' | 'bd'  // which table to use
  companyId: string
  currentUserId: string
  currentUserRole: string
  teamMembers: TeamMember[]
  entityName?: string     // candidate/client name for notifications
}

export default function ProfileComments({
  entityId, entityType, companyId, currentUserId, currentUserRole, teamMembers, entityName = ''
}: ProfileCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPos, setCursorPos] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)

  const table = entityType === 'bd' ? 'bd_comments' : 'profile_comments'
  const fkCol = entityType === 'bd' ? 'bd_entry_id' : 'profile_id'

  const isBD = ['bd_manager', 'bd_executive'].includes(currentUserRole)
  const canComment = entityType === 'bd' ? true : !isBD
  const isAdmin = ['super_admin', 'admin', 'account_owner'].includes(currentUserRole)

  useEffect(() => { loadComments() }, [entityId])

  async function loadComments() {
    setLoading(true)
    const { data } = await supabase
      .from(table)
      .select('*, app_users(full_name, role)')
      .eq(fkCol, entityId)
      .order('created_at', { ascending: true })
    setComments((data || []) as Comment[])
    setLoading(false)
  }

  function extractMentions(text: string): string[] {
    const matches = text.match(/@\[([^\]]+)\]\(([^)]+)\)/g) || []
    return matches.map(m => {
      const idMatch = m.match(/\(([^)]+)\)/)
      return idMatch ? idMatch[1] : ''
    }).filter(Boolean)
  }

  function getDisplayText(text: string): string {
    return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1')
  }

  function insertMention(member: TeamMember) {
    const before = newComment.substring(0, cursorPos).replace(/@\w*$/, '')
    const after = newComment.substring(cursorPos)
    const mention = `@[${member.full_name}](${member.id})`
    const updated = before + mention + ' ' + after
    setNewComment(updated)
    setShowMentions(false)
    setMentionSearch('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    const pos = e.target.selectionStart || 0
    setNewComment(val)
    setCursorPos(pos)

    // Check if typing @mention
    const beforeCursor = val.substring(0, pos)
    const atMatch = beforeCursor.match(/@(\w*)$/)
    if (atMatch) {
      setMentionSearch(atMatch[1].toLowerCase())
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  async function postComment() {
    if (!newComment.trim() || posting) return
    setPosting(true)

    const mentions = extractMentions(newComment)
    const { data, error } = await supabase.from(table).insert({
      [fkCol]: entityId,
      company_id: companyId,
      author_id: currentUserId,
      content: newComment.trim(),
      mentions,
      parent_id: replyTo,
    }).select('*, app_users(full_name, role)').single()

    if (!error && data) {
      setComments(prev => [...prev, data as Comment])
      setNewComment('')
      setReplyTo(null)

      // Send notifications to mentioned users
      for (const uid of mentions) {
        if (uid !== currentUserId) {
          const authorName = teamMembers.find(m => m.id === currentUserId)?.full_name || 'Someone'
          await supabase.from('notifications').insert({
            user_id: uid,
            from_user_id: currentUserId,
            type: 'mention',
            message: `${authorName} mentioned you on ${entityName || 'a profile'}: "${newComment.slice(0, 60)}..."`,
            is_read: false,
          }).catch(() => {})
        }
      }
    }
    setPosting(false)
  }

  async function updateComment() {
    if (!editId || !editText.trim()) return
    const { error } = await supabase.from(table)
      .update({ content: editText.trim(), mentions: extractMentions(editText) })
      .eq('id', editId)
    if (!error) {
      setComments(prev => prev.map(c => c.id === editId ? { ...c, content: editText.trim(), is_edited: true } : c))
      setEditId(null)
      setEditText('')
    }
  }

  async function deleteComment(id: string) {
    if (!confirm('Delete this comment?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id))
    }
  }

  function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString('en-IN')
  }

  const topLevel = comments.filter(c => !c.parent_id)
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

  const filteredMembers = teamMembers.filter(m =>
    m.id !== currentUserId &&
    m.full_name.toLowerCase().includes(mentionSearch)
  ).slice(0, 5)

  const roleColor = (role: string) => {
    const colors: Record<string, string> = {
      account_owner: '#ffd60a', team_manager: '#6c8cff', team_leader: '#48cae4',
      sr_recruiter: '#3dd68c', recruiter: '#3dd68c', bd_manager: '#ff9f43',
      bd_executive: '#ff9f43', super_admin: '#ff6b6b',
    }
    return colors[role] || '#7a7f90'
  }

  if (!canComment) return (
    <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--bd)', textAlign: 'center', color: 'var(--mu)', fontSize: 12, marginTop: 12 }}>
      BD team members cannot comment on candidate profiles. Use BD Pipeline comments instead.
    </div>
  )

  return (
    <div style={{ marginTop: 16 }}>
      <style>{`
.pc-comment{padding:10px 12px;border-radius:10px;background:var(--bg3);border:1px solid var(--bd);margin-bottom:6px;transition:all 0.15s}
.pc-comment:hover{border-color:var(--bd2)}
.pc-reply{margin-left:28px;border-left:2px solid var(--acbg)}
.pc-actions button{background:none;border:none;color:var(--mu);cursor:pointer;font-size:11px;padding:2px 6px;border-radius:4px;font-family:inherit}
.pc-actions button:hover{background:var(--acbg);color:var(--ac)}
.pc-mention{color:var(--ac);font-weight:600;cursor:default}
.pc-input{width:100%;background:var(--bg3);border:1px solid var(--bd);border-radius:10px;padding:10px 12px;color:var(--tx);font-size:13px;font-family:inherit;outline:none;resize:none;box-sizing:border-box}
.pc-input:focus{border-color:var(--ac)}
.pc-mention-list{position:absolute;bottom:100%;left:0;background:var(--bg2);border:1px solid var(--bd2);border-radius:10px;padding:4px;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:10;max-height:180px;overflow-y:auto}
.pc-mention-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;font-size:12px}
.pc-mention-item:hover{background:var(--acbg)}
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>💬 Comments ({comments.length})</div>
        {loading && <div style={{ fontSize: 11, color: 'var(--mu)' }}>Loading...</div>}
      </div>

      {/* Comment List */}
      {!loading && topLevel.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mu)', fontSize: 12, background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--bd)', marginBottom: 10 }}>
          No comments yet. Be the first to comment!
        </div>
      )}

      {topLevel.map(comment => {
        const isAuthor = comment.author_id === currentUserId
        const canDelete = isAuthor || isAdmin
        const canEdit = isAuthor
        const replies = getReplies(comment.id)
        const rc = roleColor(comment.app_users?.role || '')

        return (
          <div key={comment.id}>
            <div className="pc-comment">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${rc}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: rc, flexShrink: 0 }}>
                    {(comment.app_users?.full_name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{comment.app_users?.full_name || 'Unknown'}</span>
                      <span style={{ fontSize: 9, color: rc, background: `${rc}18`, padding: '1px 6px', borderRadius: 4 }}>{(comment.app_users?.role || '').replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: 10, color: 'var(--mu)' }}>{timeAgo(comment.created_at)}</span>
                      {comment.is_edited && <span style={{ fontSize: 9, color: 'var(--mu)', fontStyle: 'italic' }}>(edited)</span>}
                    </div>

                    {editId === comment.id ? (
                      <div style={{ marginTop: 6 }}>
                        <textarea ref={editRef} className="pc-input" rows={2} value={editText} onChange={e => setEditText(e.target.value)} />
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <button onClick={updateComment} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'var(--ac)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                          <button onClick={() => { setEditId(null); setEditText('') }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--bg4)', color: 'var(--mu)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.5, marginTop: 3 }}
                        dangerouslySetInnerHTML={{
                          __html: getDisplayText(comment.content).replace(
                            /@(\w[\w\s]*)/g,
                            '<span class="pc-mention">@$1</span>'
                          )
                        }}
                      />
                    )}

                    {/* Actions */}
                    {editId !== comment.id && (
                      <div className="pc-actions" style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                        <button onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setTimeout(() => inputRef.current?.focus(), 50) }}>
                          {replyTo === comment.id ? 'Cancel' : 'Reply'}
                        </button>
                        {canEdit && <button onClick={() => { setEditId(comment.id); setEditText(comment.content) }}>Edit</button>}
                        {canDelete && <button onClick={() => deleteComment(comment.id)} style={{ color: 'var(--rd)' }}>Delete</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Replies */}
            {replies.map(reply => {
              const rrc = roleColor(reply.app_users?.role || '')
              const rIsAuthor = reply.author_id === currentUserId
              return (
                <div key={reply.id} className="pc-comment pc-reply">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${rrc}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: rrc, flexShrink: 0 }}>
                      {(reply.app_users?.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{reply.app_users?.full_name}</span>
                        <span style={{ fontSize: 10, color: 'var(--mu)' }}>{timeAgo(reply.created_at)}</span>
                        {reply.is_edited && <span style={{ fontSize: 9, color: 'var(--mu)', fontStyle: 'italic' }}>(edited)</span>}
                      </div>

                      {editId === reply.id ? (
                        <div style={{ marginTop: 4 }}>
                          <textarea ref={editRef} className="pc-input" rows={2} value={editText} onChange={e => setEditText(e.target.value)} />
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <button onClick={updateComment} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'var(--ac)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                            <button onClick={() => { setEditId(null); setEditText('') }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--bg4)', color: 'var(--mu)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5, marginTop: 2 }}
                          dangerouslySetInnerHTML={{
                            __html: getDisplayText(reply.content).replace(/@(\w[\w\s]*)/g, '<span class="pc-mention">@$1</span>')
                          }}
                        />
                      )}

                      {editId !== reply.id && (
                        <div className="pc-actions" style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                          {rIsAuthor && <button onClick={() => { setEditId(reply.id); setEditText(reply.content) }}>Edit</button>}
                          {(rIsAuthor || isAdmin) && <button onClick={() => deleteComment(reply.id)} style={{ color: 'var(--rd)' }}>Delete</button>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Comment Input */}
      <div style={{ position: 'relative', marginTop: 10 }}>
        {replyTo && (
          <div style={{ fontSize: 11, color: 'var(--ac)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            ↩ Replying to {comments.find(c => c.id === replyTo)?.app_users?.full_name || 'comment'}
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
        )}

        {/* @Mention dropdown */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="pc-mention-list">
            {filteredMembers.map(m => (
              <div key={m.id} className="pc-mention-item" onClick={() => insertMention(m)}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${roleColor(m.role)}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: roleColor(m.role) }}>
                  {m.full_name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.full_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--mu)' }}>{m.role.replace(/_/g, ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            ref={inputRef}
            className="pc-input"
            rows={2}
            value={newComment}
            onChange={handleInput}
            placeholder={`Add a comment... Type @ to mention team members`}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }}
          />
          <button onClick={postComment} disabled={posting || !newComment.trim()}
            style={{
              padding: '10px 16px', borderRadius: 10, background: 'var(--ac)', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              opacity: posting || !newComment.trim() ? 0.5 : 1, flexShrink: 0, alignSelf: 'flex-end',
            }}>
            {posting ? '...' : 'Post'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 4 }}>
          Type @ to mention · Shift+Enter for new line · Enter to post
        </div>
      </div>
    </div>
  )
}
