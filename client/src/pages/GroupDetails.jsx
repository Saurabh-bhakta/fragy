import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../services/api';

/**
 * Group view — Includes Group Chat, Member List, Group Admin Member Management, and Pending Requests UI.
 */
function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'members' | 'manage' | 'requests'

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Participants & Pending Requests state
  const [participants, setParticipants] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Add members search state (Group Admin only)
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableSearching, setAvailableSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);

  // Remove confirmation modal state
  const [userToRemove, setUserToRemove] = useState(null); // { id, name }
  const [removing, setRemoving] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load group info
  const fetchGroupInfo = () => {
    api
      .getGroup(groupId)
      .then((data) => {
        setGroup(data.group);
      })
      .catch((err) => {
        setError(err.message || 'Could not load group.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Load messages
  const fetchMessages = () => {
    setChatLoading(true);
    api
      .getGroupMessages(groupId)
      .then((data) => {
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      })
      .catch((err) => {
        setError(err.message || 'Could not load group messages.');
      })
      .finally(() => {
        setChatLoading(false);
      });
  };

  // Load participants
  const fetchParticipants = () => {
    api
      .getGroupParticipants(groupId)
      .then((data) => {
        setParticipants(data.participants || []);
      })
      .catch(console.error);
  };

  // Load pending requests (Admin only)
  const fetchPendingRequests = () => {
    api
      .getPendingGroupRequests(groupId)
      .then((data) => {
        setPendingRequests(data.requests || []);
      })
      .catch(console.error);
  };

  // Load available users to add (Admin only)
  const fetchAvailableUsers = () => {
    if (!group?.isGroupAdmin) return;
    setAvailableSearching(true);
    api
      .getAvailableGroupUsers(groupId, addSearchQuery, 1)
      .then((data) => {
        setAvailableUsers(data.users || []);
      })
      .catch(console.error)
      .finally(() => {
        setAvailableSearching(false);
      });
  };

  useEffect(() => {
    fetchGroupInfo();

    // Socket.io connection for real-time group chat
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl.replace(/\/api$/, ''));

    socketRef.current.emit('join_room', `group_${groupId}`);

    socketRef.current.on('group_message', (incomingMsg) => {
      if (String(incomingMsg.groupId) === String(groupId)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(incomingMsg.id))) return prev;
          return [...prev, incomingMsg];
        });
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_room', `group_${groupId}`);
        socketRef.current.disconnect();
      }
    };
  }, [groupId]);

  useEffect(() => {
    if (group?.membershipStatus === 'accepted' || group?.isGroupAdmin) {
      if (activeTab === 'chat') fetchMessages();
      if (activeTab === 'members' || activeTab === 'manage') fetchParticipants();
      if (activeTab === 'manage' && group.isGroupAdmin) {
        fetchAvailableUsers();
        fetchPendingRequests();
      }
      if (activeTab === 'requests' && group.isGroupAdmin) fetchPendingRequests();
    }
  }, [groupId, activeTab, group?.membershipStatus, group?.isGroupAdmin]);

  // Debounced search for available users
  useEffect(() => {
    if (activeTab === 'manage' && group?.isGroupAdmin) {
      const timer = setTimeout(fetchAvailableUsers, 300);
      return () => clearTimeout(timer);
    }
  }, [addSearchQuery]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const data = await api.sendGroupMessage(groupId, content);
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      alert(err.message || 'Could not send message.');
    }
  };

  // Save edit message (5 min rule)
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

  // Delete message (10 min rule for user, unlimited for Group Admin)
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.deleteChatMessage(messageId);
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(messageId)));
      setActiveMenuId(null);
    } catch (err) {
      alert(err.message || 'Could not delete message.');
    }
  };

  // Handle Admin request approval
  const handleRequestAction = async (membershipId, action) => {
    try {
      await api.handleGroupJoinRequest(groupId, membershipId, action);
      fetchPendingRequests();
      fetchParticipants();
      fetchGroupInfo();
    } catch (err) {
      alert(err.message || 'Could not process request.');
    }
  };

  // Handle Admin direct add member
  const handleAddMember = async (targetUserId) => {
    setAddingUserId(targetUserId);
    try {
      await api.addGroupMember(groupId, targetUserId);
      fetchAvailableUsers();
      fetchParticipants();
      fetchGroupInfo();
    } catch (err) {
      alert(err.message || 'Could not add member.');
    } finally {
      setAddingUserId(null);
    }
  };

  // Handle Admin confirm remove member
  const confirmRemoveMember = async () => {
    if (!userToRemove) return;
    setRemoving(true);
    try {
      await api.removeGroupParticipant(groupId, userToRemove.id);
      setUserToRemove(null);
      fetchParticipants();
      fetchAvailableUsers();
      fetchGroupInfo();
    } catch (err) {
      alert(err.message || 'Could not remove member.');
    } finally {
      setRemoving(false);
    }
  };

  const handleStartPrivateChat = async (userId) => {
    try {
      const data = await api.getOrCreateConversation(userId);
      if (data.conversation?.id || data.conversation?._id) {
        const convId = data.conversation.id || data.conversation._id;
        navigate(`/chat/${convId}`);
      }
    } catch (err) {
      alert(err.message || 'Could not open private chat.');
    }
  };

  if (loading) {
    return (
      <div className="page section">
        <div className="container">
          <p className="muted">Loading group details…</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="page section">
        <div className="container">
          <h1>Group Not Found</h1>
          <p className="muted">{error || 'The group does not exist.'}</p>
          <Link to="/groups" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  const isAccepted = group.membershipStatus === 'accepted' || group.isGroupAdmin;
  const isPending = group.membershipStatus === 'pending';

  return (
    <div className="page section" style={{ paddingBottom: '3rem' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        
        {/* Group Header Card */}
        <div className="form-card" style={{ width: '100%', margin: '0 0 1.5rem 0' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'var(--color-brand-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: 'var(--color-brand)',
                flexShrink: 0,
              }}
            >
              {group.avatarUrl ? (
                <img src={group.avatarUrl} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (group.name || '?').charAt(0).toUpperCase()
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{group.name}</h1>
                {group.isGroupAdmin && (
                  <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', fontWeight: 700 }}>
                    👑 Group Admin
                  </span>
                )}
              </div>
              <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                {group.description || 'No description provided.'}
              </p>
              <span className="muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.35rem' }}>
                👥 {group.memberCount} Accepted {group.memberCount === 1 ? 'Member' : 'Members'}
              </span>
            </div>

            <Link to="/groups" className="btn btn-secondary">
              ← All Groups
            </Link>
          </div>
        </div>

        {/* Non-Member / Pending State Banner */}
        {!isAccepted && (
          <div className="alert alert-error" style={{ textAlign: 'center', padding: '2rem' }}>
            {isPending ? (
              <div>
                <h3>⏳ Join Request Pending Approval</h3>
                <p className="muted" style={{ margin: '0.5rem 0 0' }}>
                  Your request to join this group has been submitted to the Group Admin. You will gain chat and member access once accepted.
                </p>
              </div>
            ) : (
              <div>
                <h3>🔒 Restricted Access</h3>
                <p className="muted" style={{ margin: '0.5rem 0 1rem' }}>
                  You must request to join and be accepted by the Group Admin before viewing group chat messages and participants.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await api.requestToJoinGroup(group.id);
                    fetchGroupInfo();
                  }}
                >
                  ➕ Request to Join Group
                </button>
              </div>
            )}
          </div>
        )}

        {/* Accepted Member Interface */}
        {isAccepted && (
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}
                onClick={() => setActiveTab('chat')}
              >
                💬 Group Chat
              </button>

              <button
                type="button"
                className={`btn ${activeTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}
                onClick={() => setActiveTab('members')}
              >
                👥 Group Members ({group.memberCount})
              </button>

              {group.isGroupAdmin && (
                <button
                  type="button"
                  className={`btn ${activeTab === 'manage' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}
                  onClick={() => setActiveTab('manage')}
                >
                  ⚙️ Manage Members
                </button>
              )}

              {group.isGroupAdmin && (
                <button
                  type="button"
                  className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}
                  onClick={() => setActiveTab('requests')}
                >
                  ⏳ Pending Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                </button>
              )}
            </div>

            {/* TAB 1: GROUP CHAT */}
            {activeTab === 'chat' && (
              <div className="chat-window-card" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                
                {/* Chat Messages Area */}
                <div style={{ height: '420px', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {chatLoading ? (
                    <p className="muted">Loading chat history…</p>
                  ) : messages.length === 0 ? (
                    <p className="muted" style={{ textAlign: 'center', margin: 'auto' }}>
                      No messages sent yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((m) => {
                      const isSelf = m.isSelf;
                      const initial = (m.sender?.name || '?').charAt(0).toUpperCase();
                      const isEditingThis = editingMessageId === m.id;

                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            gap: '0.75rem',
                            flexDirection: isSelf ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                          }}
                        >
                          {!isSelf && (
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: 'var(--color-brand-soft)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: 'var(--color-brand)',
                                flexShrink: 0,
                              }}
                            >
                              {m.sender?.avatarUrl ? (
                                <img src={m.sender.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                initial
                              )}
                            </div>
                          )}

                          <div style={{ maxWidth: '75%', position: 'relative' }}>
                            {!isSelf && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginLeft: '0.25rem', marginBottom: '0.2rem', display: 'block' }}>
                                {m.sender?.name}
                              </span>
                            )}

                            {isEditingThis ? (
                              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                                <input
                                  type="text"
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="doubt-input"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.88rem' }}
                                />
                                <button className="btn btn-primary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleSaveEdit(m.id)}>
                                  Save
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setEditingMessageId(null)}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  padding: '0.75rem 1rem',
                                  borderRadius: isSelf ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                  background: isSelf ? 'var(--color-brand)' : 'var(--color-bg)',
                                  color: isSelf ? '#ffffff' : 'var(--color-ink)',
                                  border: isSelf ? 'none' : '1px solid var(--color-border)',
                                  fontSize: '0.92rem',
                                  lineHeight: 1.5,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
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
                                          style={{ padding: '0.5rem 0.75rem', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.82rem', color: '#ef4444' }}
                                          onClick={() => handleDeleteMessage(m.id)}
                                        >
                                          🗑️ Delete
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

                {/* Send Input Form */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <input
                    type="text"
                    placeholder="Type a group message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="doubt-input"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                    Send 🚀
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: GROUP MEMBERS (READ-ONLY FOR MEMBERS, READ/MANAGE FOR ADMIN) */}
            {activeTab === 'members' && (
              <div className="card-grid">
                {participants.map((p) => {
                  const initial = (p.name || '?').charAt(0).toUpperCase();
                  return (
                    <div key={p.userId} className="semester-card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'var(--color-brand-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--color-brand)',
                          fontSize: '1.1rem',
                          flexShrink: 0,
                        }}
                      >
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          initial
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                          {p.isGroupAdmin ? (
                            <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', fontSize: '0.72rem', fontWeight: 700 }}>
                              👑 Admin
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand)', fontSize: '0.72rem', fontWeight: 600 }}>
                              Member
                            </span>
                          )}
                        </div>
                        {p.bio && <p className="muted" style={{ fontSize: '0.82rem', margin: '0.1rem 0 0' }}>{p.bio}</p>}
                        <small className="muted" style={{ fontSize: '0.75rem' }}>
                          Joined: {new Date(p.joinedAt).toLocaleDateString()}
                        </small>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          onClick={() => handleStartPrivateChat(p.userId)}
                        >
                          💬 Chat
                        </button>
                        {group.isGroupAdmin && !p.isGroupAdmin && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            onClick={() => setUserToRemove({ id: p.userId, name: p.name })}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: MANAGE MEMBERS (GROUP ADMIN ONLY) */}
            {activeTab === 'manage' && group.isGroupAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Section A: Current Members Table */}
                <div className="form-card" style={{ width: '100%', margin: 0 }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Current Members ({participants.length})</h3>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                          <th style={{ padding: '0.6rem 0.5rem' }}>Profile</th>
                          <th style={{ padding: '0.6rem 0.5rem' }}>Name</th>
                          <th style={{ padding: '0.6rem 0.5rem' }}>Role</th>
                          <th style={{ padding: '0.6rem 0.5rem' }}>Joined Date</th>
                          <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p) => (
                          <tr key={p.userId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.6rem 0.5rem' }}>
                              <img
                                src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0f766e&color=fff`}
                                alt={p.name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{p.name}</td>
                            <td style={{ padding: '0.6rem 0.5rem' }}>
                              {p.isGroupAdmin ? (
                                <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', fontWeight: 700 }}>
                                  Admin
                                </span>
                              ) : (
                                <span className="badge" style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand)' }}>
                                  Member
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', color: 'var(--color-ink-muted)' }}>
                              {new Date(p.joinedAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                              {!p.isGroupAdmin ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                                  onClick={() => setUserToRemove({ id: p.userId, name: p.name })}
                                >
                                  Remove
                                </button>
                              ) : (
                                <span className="muted" style={{ fontSize: '0.8rem' }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section B: Add Members (Searchable registered users) */}
                <div className="form-card" style={{ width: '100%', margin: 0 }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>Add Members</h3>
                  <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Search registered students and add them directly to your group.
                  </p>

                  <input
                    type="text"
                    placeholder="Search users by name..."
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    style={{ marginBottom: '1rem' }}
                  />

                  {availableSearching ? (
                    <p className="muted">Searching users…</p>
                  ) : availableUsers.length === 0 ? (
                    <p className="muted">No matching users available to add.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {availableUsers.map((u) => (
                        <div
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0f766e&color=fff`}
                              alt={u.name}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.92rem', display: 'block', color: 'var(--color-ink)' }}>{u.name}</strong>
                              {u.bio && <span className="muted" style={{ fontSize: '0.78rem' }}>{u.bio.slice(0, 60)}</span>}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
                            disabled={addingUserId === u.id}
                            onClick={() => handleAddMember(u.id)}
                          >
                            {addingUserId === u.id ? 'Adding...' : '+ Add Member'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section C: Pending Requests */}
                <div className="form-card" style={{ width: '100%', margin: 0 }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Pending Requests ({pendingRequests.length})</h3>
                  {pendingRequests.length === 0 ? (
                    <p className="muted">No pending join requests.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {pendingRequests.map((reqItem) => (
                        <div
                          key={reqItem.membershipId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={reqItem.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(reqItem.user.name)}&background=0f766e&color=fff`}
                              alt={reqItem.user.name}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.92rem', display: 'block', color: 'var(--color-ink)' }}>{reqItem.user.name}</strong>
                              {reqItem.user.bio && <span className="muted" style={{ fontSize: '0.78rem' }}>{reqItem.user.bio.slice(0, 60)}</span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => handleRequestAction(reqItem.membershipId, 'accept')}
                            >
                              ✓ Accept
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => handleRequestAction(reqItem.membershipId, 'reject')}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 4: PENDING JOIN REQUESTS TAB */}
            {activeTab === 'requests' && group.isGroupAdmin && (
              <div>
                <h3>Pending Membership Requests ({pendingRequests.length})</h3>
                {pendingRequests.length === 0 ? (
                  <p className="muted">No pending join requests.</p>
                ) : (
                  <div className="card-grid" style={{ marginTop: '1rem' }}>
                    {pendingRequests.map((reqItem) => (
                      <div key={reqItem.membershipId} className="semester-card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: 'var(--color-brand-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--color-brand)',
                            fontSize: '1.1rem',
                            flexShrink: 0,
                          }}
                        >
                          {reqItem.user.avatarUrl ? (
                            <img src={reqItem.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            (reqItem.user.name || '?').charAt(0).toUpperCase()
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '1rem' }}>{reqItem.user.name}</strong>
                          <span className="muted" style={{ display: 'block', fontSize: '0.78rem' }}>
                            Requested {new Date(reqItem.requestedAt).toLocaleTimeString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => handleRequestAction(reqItem.membershipId, 'accept')}
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => handleRequestAction(reqItem.membershipId, 'reject')}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Remove Member Confirmation Modal */}
        {userToRemove && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <div
              className="form-card"
              style={{
                maxWidth: '420px',
                width: '100%',
                background: 'var(--color-bg-card)',
                boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
                margin: 0,
                borderRadius: 'var(--radius)',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-ink)' }}>
                Remove Member
              </h3>
              <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Remove <strong>{userToRemove.name}</strong> from the group? They will lose access to group chat immediately.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={removing}
                  onClick={() => setUserToRemove(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                  disabled={removing}
                  onClick={confirmRemoveMember}
                >
                  {removing ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default GroupDetails;
