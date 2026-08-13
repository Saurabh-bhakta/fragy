import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * FRAGY Redesigned 1-to-1 Private Chat Page
 */
function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeRecipient, setActiveRecipient] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = () => {
    setConversationsLoading(true);
    api
      .getConversations()
      .then((data) => {
        setConversations(data.conversations || []);
      })
      .catch(console.error)
      .finally(() => {
        setConversationsLoading(false);
      });
  };

  const fetchMessages = (convId) => {
    setMessagesLoading(true);
    api
      .getPrivateMessages(convId)
      .then((data) => {
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      })
      .catch((err) => {
        alert(err.message || 'Could not load conversation messages.');
      })
      .finally(() => {
        setMessagesLoading(false);
      });
  };

  useEffect(() => {
    fetchConversations();

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl.replace(/\/api$/, ''));

    if (authUser?.id || authUser?._id) {
      const uId = authUser.id || authUser._id;
      socketRef.current.emit('join_room', `user_${uId}`);
    }

    socketRef.current.on('private_message', (incomingMsg) => {
      if (conversationId && String(incomingMsg.conversationId) === String(conversationId)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(incomingMsg.id))) return prev;
          return [...prev, incomingMsg];
        });
        setTimeout(scrollToBottom, 100);
      }
      fetchConversations();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [authUser]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      const activeConv = conversations.find((c) => String(c.id) === String(conversationId));
      if (activeConv) setActiveRecipient(activeConv.recipient);
    } else {
      setMessages([]);
      setActiveRecipient(null);
    }
  }, [conversationId, conversations]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const data = await api.sendPrivateMessage(conversationId, content);
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(scrollToBottom, 100);
        fetchConversations();
      }
    } catch (err) {
      alert(err.message || 'Could not send message.');
    }
  };

  const handleSaveEdit = async (messageId) => {
    if (!editContent.trim()) return;
    try {
      const data = await api.editChatMessage(messageId, editContent);
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(messageId)
            ? { ...m, content: data.updatedMessage.content, isEdited: true }
            : m
        )
      );
      setEditingMessageId(null);
      setEditContent('');
    } catch (err) {
      alert(err.message || 'Could not edit message.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.deleteChatMessage(messageId);
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(messageId)));
      setActiveMenuId(null);
    } catch (err) {
      alert(err.message || 'Could not delete message.');
    }
  };

  return (
    <div className="page section" style={{ paddingBottom: '2.5rem' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div className="section-badge" style={{ color: 'var(--color-brand)', background: 'var(--color-brand-soft)', margin: '0 0 0.35rem' }}>
              💬 Real-time Campus Messaging
            </div>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Direct Messages</h1>
          </div>
          <Link to="/members" className="btn btn-secondary" style={{ fontSize: '0.88rem' }}>
            👥 Find Members to Chat
          </Link>
        </div>

        <div className="chat-container">
          {/* LEFT SIDEBAR — CONVERSATION LIST */}
          <div style={{ borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ink)' }}>
              Conversations ({conversations.length})
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversationsLoading ? (
                <p className="muted" style={{ padding: '1rem', fontSize: '0.88rem' }}>Loading conversations…</p>
              ) : conversations.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.88rem' }} className="muted">
                  No active chats yet. Visit the <Link to="/members" style={{ color: 'var(--color-brand)' }}>Members directory</Link> to start messaging.
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = String(c.id) === String(conversationId);
                  const initial = (c.recipient?.name || '?').charAt(0).toUpperCase();

                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/chat/${c.id}`)}
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: isActive ? 'var(--color-brand-soft)' : 'transparent',
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background var(--transition)',
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'var(--color-brand-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--color-brand)',
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        {c.recipient?.avatarUrl ? (
                          <img src={c.recipient.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          initial
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.92rem', display: 'block', color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.recipient?.name || 'User'}
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT MAIN PANEL — ACTIVE CHAT ROOM */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-card)' }}>
            {conversationId ? (
              <>
                {/* ACTIVE CHAT HEADER */}
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'var(--color-brand-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'var(--color-brand)',
                    }}
                  >
                    {activeRecipient?.avatarUrl ? (
                      <img src={activeRecipient.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (activeRecipient?.name || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-ink)' }}>{activeRecipient?.name || 'Private Chat'}</h3>
                    {activeRecipient?.bio && (
                      <span className="muted" style={{ fontSize: '0.78rem' }}>{activeRecipient.bio}</span>
                    )}
                  </div>
                </div>

                {/* MESSAGES BODY */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {messagesLoading ? (
                    <p className="muted">Loading chat history…</p>
                  ) : messages.length === 0 ? (
                    <p className="muted" style={{ textAlign: 'center', margin: 'auto' }}>
                      Say hello to start chatting!
                    </p>
                  ) : (
                    messages.map((m) => {
                      const isSelf = m.isSelf;
                      const isEditingThis = editingMessageId === m.id;

                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isSelf ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div style={{ maxWidth: '75%', position: 'relative' }}>
                            {isEditingThis ? (
                              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                                <input
                                  type="text"
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  style={{
                                    padding: '0.4rem 0.75rem',
                                    fontSize: '0.88rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-input-bg)'
                                  }}
                                />
                                <button className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }} onClick={() => handleSaveEdit(m.id)}>
                                  Save
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }} onClick={() => setEditingMessageId(null)}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  padding: '0.75rem 1rem',
                                  borderRadius: isSelf ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                  background: isSelf ? 'linear-gradient(135deg, var(--color-brand) 0%, #7c3aed 100%)' : 'var(--color-bg)',
                                  color: isSelf ? '#ffffff' : 'var(--color-ink)',
                                  border: isSelf ? 'none' : '1px solid var(--color-border)',
                                  fontSize: '0.92rem',
                                  lineHeight: 1.5,
                                  boxShadow: 'var(--shadow-sm)',
                                }}
                              >
                                <span>{m.content}</span>
                                {m.isEdited && (
                                  <small style={{ fontSize: '0.7rem', opacity: 0.75, marginLeft: '0.5rem', fontStyle: 'italic' }}>
                                    (Edited)
                                  </small>
                                )}
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>

                              {(m.canEdit || m.canDelete) && !isEditingThis && (
                                <div style={{ position: 'relative' }}>
                                  <button
                                    type="button"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.2rem', color: 'var(--color-ink-muted)' }}
                                    onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
                                  >
                                    ⋮
                                  </button>

                                  {activeMenuId === m.id && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        right: isSelf ? 0 : 'auto',
                                        left: isSelf ? 'auto' : 0,
                                        bottom: '1.4rem',
                                        background: 'var(--color-bg-card)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        boxShadow: 'var(--shadow-lg)',
                                        zIndex: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minWidth: '110px',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      {m.canEdit && (
                                        <button
                                          type="button"
                                          style={{ padding: '0.5rem 0.75rem', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--color-ink)' }}
                                          onClick={() => {
                                            setEditingMessageId(m.id);
                                            setEditContent(m.content);
                                            setActiveMenuId(null);
                                          }}
                                        >
                                          ✏️ Edit (5m)
                                        </button>
                                      )}
                                      {m.canDelete && (
                                        <button
                                          type="button"
                                          style={{ padding: '0.5rem 0.75rem', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--color-danger)' }}
                                          onClick={() => handleDeleteMessage(m.id)}
                                        >
                                          🗑️ Delete (10m)
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* SEND INPUT FORM */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.65rem 1rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-input-bg)',
                      fontSize: '0.92rem'
                    }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
                    Send 🚀
                  </button>
                </form>
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-ink-muted)', padding: '2rem' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>💬</span>
                <h3>Select a conversation to start chatting</h3>
                <p style={{ fontSize: '0.9rem' }}>Choose from existing chats on the left or search members to message.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
