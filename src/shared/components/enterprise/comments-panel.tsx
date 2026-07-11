'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/shared/components/status-badge'
import { MessageSquare, Reply, AtSign, Pin, Check, X, Send } from 'lucide-react'
import { fmtRelative, cn } from '@/shared/lib/format'
import { useApp } from '@/shared/lib/store'

export interface Comment {
  id: string
  body: string
  authorId: string
  authorName: string
  authorRole?: string
  createdAt: string
  parentId?: string | null
  isPinned?: boolean
  isResolved?: boolean
  isInternal?: boolean
  mentions?: string[]
  reactions?: { emoji: string; userId: string }[]
}

interface CommentsPanelProps {
  comments: Comment[]
  onAdd: (body: string, parentId?: string | null, isInternal?: boolean) => void
  onResolve: (id: string) => void
  onPin: (id: string) => void
  onReact: (id: string, emoji: string) => void
  users: { id: string; name: string }[]
}

export function CommentsPanel({ comments, onAdd, onResolve, onPin, onReact, users }: CommentsPanelProps) {
  const { user } = useApp()
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [isInternal, setIsInternal] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const rootComments = comments.filter((c) => !c.parentId).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const handleSubmit = () => {
    if (!body.trim()) return
    onAdd(body.trim(), replyTo, isInternal)
    setBody('')
    setReplyTo(null)
    setIsInternal(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleMention = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value)
    const lastAt = e.target.value.lastIndexOf('@')
    if (lastAt !== -1 && e.target.value.slice(lastAt + 1).indexOf(' ') === -1) {
      setShowMentions(true)
      setMentionQuery(e.target.value.slice(lastAt + 1))
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (name: string) => {
    const lastAt = body.lastIndexOf('@')
    setBody(body.slice(0, lastAt) + `@${name} `)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const filteredUsers = mentionQuery ? users.filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase())) : users

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1">
        {rootComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Start the conversation</p>
          </div>
        ) : (
          rootComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              currentUserId={user?.id ?? ''}
              onReply={(id) => { setReplyTo(id); inputRef.current?.focus() }}
              onResolve={onResolve}
              onPin={onPin}
              onReact={onReact}
            />
          ))
        )}
      </div>

      {/* Composer */}
      <div className="border-t pt-3 mt-2">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Reply className="h-3 w-3" />
            Replying to {comments.find((c) => c.id === replyTo)?.authorName}
            <button onClick={() => setReplyTo(null)} className="hover:text-foreground"><X className="h-3 w-3" /></button>
          </div>
        )}
        {showMentions && filteredUsers.length > 0 && (
          <div className="mb-2 rounded-lg border bg-popover shadow-soft max-h-32 overflow-y-auto">
            {filteredUsers.slice(0, 5).map((u) => (
              <button key={u.id} onClick={() => insertMention(u.name)} className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs hover:bg-accent">
                <AtSign className="h-3 w-3 text-muted-foreground" /> {u.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-start gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-[10px]">
              {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={body}
              onChange={handleMention}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment... @ to mention, ⌘+Enter to send"
              className="w-full min-h-[60px] max-h-24 p-2 text-sm rounded-lg border bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={2}
            />
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInternal(!isInternal)}
                  className={cn('flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border', isInternal ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'text-muted-foreground')}
                >
                  {isInternal && <Check className="h-2.5 w-2.5" />} Internal
                </button>
              </div>
              <Button size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={!body.trim()}>
                <Send className="h-3 w-3" /> Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentThread({ comment, replies, currentUserId, onReply, onResolve, onPin, onReact }: {
  comment: Comment
  replies: Comment[]
  currentUserId: string
  onReply: (id: string) => void
  onResolve: (id: string) => void
  onPin: (id: string) => void
  onReact: (id: string, emoji: string) => void
}) {
  const [showReplies, setShowReplies] = useState(true)
  const reactions = ['👍', '❤️', '✅', '🚫']
  const groupedReactions = (comment.reactions ?? []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={cn('space-y-2', comment.isResolved && 'opacity-60')}>
      <div className={cn('flex gap-2', comment.isPinned && 'bg-amber-500/5 -mx-2 px-2 py-1.5 rounded-lg')}>
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white text-[10px]">
            {comment.authorName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium">{comment.authorName}</span>
            {comment.authorRole && <Badge variant="outline" className="text-[9px] h-4">{comment.authorRole}</Badge>}
            {comment.isInternal && <Badge variant="warning" className="text-[9px] h-4">Internal</Badge>}
            {comment.isPinned && <Badge variant="violet" className="text-[9px] h-4"><Pin className="h-2 w-2" /> Pinned</Badge>}
            <span className="text-[10px] text-muted-foreground">{fmtRelative(comment.createdAt)}</span>
          </div>
          <p className="text-sm mt-0.5 whitespace-pre-wrap">{comment.body}</p>
          {/* Reactions */}
          <div className="flex items-center gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <button key={emoji} onClick={() => onReact(comment.id, emoji)} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted hover:bg-muted/70 text-xs">
                {emoji} <span className="text-[10px] tabular-nums">{count}</span>
              </button>
            ))}
            <div className="flex items-center gap-0.5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
              {reactions.map((emoji) => (
                <button key={emoji} onClick={() => onReact(comment.id, emoji)} className="h-5 w-5 rounded hover:bg-muted text-xs">{emoji}</button>
              ))}
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
            <button onClick={() => onReply(comment.id)} className="hover:text-foreground flex items-center gap-0.5"><Reply className="h-2.5 w-2.5" /> Reply</button>
            <button onClick={() => onResolve(comment.id)} className="hover:text-foreground flex items-center gap-0.5"><Check className="h-2.5 w-2.5" /> {comment.isResolved ? 'Unresolve' : 'Resolve'}</button>
            <button onClick={() => onPin(comment.id)} className="hover:text-foreground flex items-center gap-0.5"><Pin className="h-2.5 w-2.5" /> {comment.isPinned ? 'Unpin' : 'Pin'}</button>
            {replies.length > 0 && (
              <button onClick={() => setShowReplies(!showReplies)} className="hover:text-foreground">
                {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="ml-9 space-y-2">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="bg-muted text-[10px]">{reply.authorName.split(' ').map((n) => n[0]).slice(0, 2).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{reply.authorName}</span>
                  <span className="text-[10px] text-muted-foreground">{fmtRelative(reply.createdAt)}</span>
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{reply.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
