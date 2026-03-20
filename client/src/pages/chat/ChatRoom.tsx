import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { formatRelative } from '../../utils/formatDate'
import { getAvatarUrl } from '../../utils/helpers'
import {
  Send,
  Plus,
  X,
  Loader2,
  MessageSquare,
  Hash
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ChatRoom {
  id: string
  name: string
  type: string
  messages: {
    id: string
    content: string
    sender: { id: string; name: string; avatar: string | null }
    createdAt: string
  }[]
}

interface Message {
  id: string
  content: string
  senderId: string
  roomId: string
  isDeleted: boolean
  createdAt: string
  sender: { id: string; name: string; avatar: string | null }
}

export default function ChatRoom() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [creating, setCreating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (!socket || !activeRoom) return

    socket.emit('join_room', activeRoom.id)

    socket.on('new_message', (message: Message) => {
      if (message.roomId === activeRoom.id) {
        setMessages(prev => [...prev, message])
      }
    })

    socket.on('user_typing', ({ userId }: { userId: string }) => {
      if (userId !== user?.id) {
        setTypingUsers(prev => [...new Set([...prev, userId])])
      }
    })

    socket.on('user_stopped_typing', ({ userId }: { userId: string }) => {
      setTypingUsers(prev => prev.filter(id => id !== userId))
    })

    socket.on('message_deleted', ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
      ))
    })

    return () => {
      socket.emit('leave_room', activeRoom.id)
      socket.off('new_message')
      socket.off('user_typing')
      socket.off('user_stopped_typing')
      socket.off('message_deleted')
    }
  }, [socket, activeRoom])

  const fetchRooms = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/chat/rooms')
      setRooms(res.data.data.rooms)
    } catch {
      toast.error('Failed to fetch chat rooms')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (roomId: string) => {
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages?limit=50`)
      setMessages(res.data.data.messages)
    } catch {
      toast.error('Failed to fetch messages')
    }
  }

  const handleRoomSelect = (room: ChatRoom) => {
    setActiveRoom(room)
    fetchMessages(room.id)
    setMessages([])
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeRoom) return

    setSending(true)
    try {
      if (socket) {
        socket.emit('send_message', {
          roomId: activeRoom.id,
          content: newMessage.trim()
        })
      } else {
        await api.post(`/chat/rooms/${activeRoom.id}/messages`, {
          content: newMessage.trim()
        })
        fetchMessages(activeRoom.id)
      }
      setNewMessage('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    if (!socket || !activeRoom) return
    socket.emit('typing_start', { roomId: activeRoom.id })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId: activeRoom.id })
    }, 2000)
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeRoom) return
    try {
      if (socket) {
        socket.emit('delete_message', { messageId, roomId: activeRoom.id })
      } else {
        await api.delete(`/chat/rooms/${activeRoom.id}/messages/${messageId}`)
      }
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, isDeleted: true, content: 'This message was deleted' }
          : m
      ))
    } catch {
      toast.error('Failed to delete message')
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/chat/rooms', { name: roomName, type: 'GROUP' })
      toast.success('Chat room created')
      setShowCreateRoom(false)
      setRoomName('')
      fetchRooms()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create room')
    } finally {
      setCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 animate-fade-in rounded-xl overflow-hidden border border-surface-border">
      {/* Sidebar — rooms list */}
      <div className="w-64 flex-shrink-0 bg-surface border-r border-surface-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h3 className="text-gray-200 font-semibold text-sm">Chat Rooms</h3>
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <button
              onClick={() => setShowCreateRoom(true)}
              className="p-1.5 text-gray-600 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {rooms.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={24} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-600 text-xs">No chat rooms yet</p>
            </div>
          ) : (
            rooms.map(room => (
              <button
                key={room.id}
                onClick={() => handleRoomSelect(room)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                  transition-all duration-150
                  ${activeRoom?.id === room.id
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-surface-hover'
                  }
                `}
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${activeRoom?.id === room.id ? 'bg-brand-500/20' : 'bg-surface-muted'}
                `}>
                  <Hash size={14} className={activeRoom?.id === room.id ? 'text-brand-400' : 'text-gray-600'} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{room.name}</p>
                  {room.messages?.[0] && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {room.messages[0].content}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col bg-[#0a0a0c]">
          {/* Room header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-border bg-surface">
            <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
              <Hash size={16} className="text-brand-400" />
            </div>
            <div>
              <h3 className="text-gray-100 font-semibold text-sm">{activeRoom.name}</h3>
              <p className="text-gray-600 text-xs">{messages.length} messages</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare size={40} className="text-gray-700 mb-4" />
                <h3 className="text-gray-500 font-medium">No messages yet</h3>
                <p className="text-gray-600 text-sm mt-1">Be the first to say something</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender.id === user?.id
                const showAvatar = index === 0 ||
                  messages[index - 1].sender.id !== message.sender.id

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    {showAvatar && !isOwn ? (
                      <img
                        src={getAvatarUrl(message.sender.avatar, message.sender.name)}
                        alt={message.sender.name}
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      />
                    ) : !isOwn ? (
                      <div className="w-7 flex-shrink-0" />
                    ) : null}

                    <div className={`max-w-xs lg:max-w-md space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAvatar && !isOwn && (
                        <span className="text-gray-600 text-xs px-1">
                          {message.sender.name}
                        </span>
                      )}
                      <div className={`
                        relative px-4 py-2.5 rounded-2xl text-sm
                        ${isOwn
                          ? 'bg-brand-500 text-white rounded-br-sm'
                          : 'bg-surface-hover text-gray-200 rounded-bl-sm border border-surface-border'
                        }
                        ${message.isDeleted ? 'opacity-50 italic' : ''}
                      `}>
                        {message.content}
                        {!message.isDeleted && isOwn && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 p-1 bg-surface-muted rounded-full transition-opacity"
                          >
                            <X size={10} className="text-gray-500" />
                          </button>
                        )}
                      </div>
                      <span className="text-gray-700 text-xs px-1">
                        {formatRelative(message.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 px-4 py-2.5 bg-surface-hover rounded-2xl rounded-bl-sm border border-surface-border">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-gray-600 text-xs">typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="px-6 py-4 border-t border-surface-border bg-surface">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={e => { setNewMessage(e.target.value); handleTyping() }}
                placeholder={`Message #${activeRoom.name}`}
                className="input-field flex-1"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="btn-primary px-4 py-2.5 flex-shrink-0"
              >
                {sending
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Send size={16} />
                }
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0c] text-center">
          <MessageSquare size={48} className="text-gray-700 mb-4" />
          <h3 className="text-gray-400 font-medium">Select a chat room</h3>
          <p className="text-gray-600 text-sm mt-2">Choose a room from the left to start chatting</p>
        </div>
      )}

      {/* Create room modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-sm shadow-card animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h3 className="text-gray-100 font-semibold">Create Chat Room</h3>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="p-1.5 text-gray-600 hover:text-gray-400 hover:bg-surface-hover rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="label">Room name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. general, design, backend"
                  required
                  className="input-field"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 justify-center"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}