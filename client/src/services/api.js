/**
 * Thin fetch wrapper for the NotesHub API.
 * In development, Vite proxies /api → http://localhost:5000
 */

let rawBase = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
if (rawBase !== '/api' && !rawBase.endsWith('/api')) {
  rawBase = `${rawBase}/api`;
}
const API_BASE = rawBase;

function getToken() {
  return localStorage.getItem('noteshub_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('noteshub_token', token);
  else localStorage.removeItem('noteshub_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  health: () => request('/health'),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  googleAuth: (payload) => request('/auth/google', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),
  changePassword: (payload) =>
    request('/auth/change-password', { method: 'POST', body: payload, auth: true }),
  getSemesters: () => request('/semesters'),
  getSemester: (idOrNumber) => request(`/semesters/${idOrNumber}`, { auth: true }),
  getSubject: (subjectId) => request(`/subjects/${subjectId}`, { auth: true }),
  accessResource: (resourceId) => request(`/resources/${resourceId}/access`, { auth: true }),
  getComments: () => request('/comments'),
  postComment: (message) =>
    request('/comments', { method: 'POST', body: { message }, auth: true }),
  updateComment: (id, message) =>
    request(`/comments/${id}`, { method: 'PUT', body: { message }, auth: true }),
  getAbout: () => request('/about'),
  adminGetAbout: () => request('/admin/about', { auth: true }),
  adminUpdateAbout: (body) =>
    request('/admin/about', { method: 'PUT', body, auth: true }),
  adminOverview: () => request('/admin/overview', { auth: true }),
  adminUsers: () => request('/admin/users', { auth: true }),
  adminCreateSemester: (body) =>
    request('/admin/semesters', { method: 'POST', body, auth: true }),
  adminUpdateSemester: (id, body) =>
    request(`/admin/semesters/${id}`, { method: 'PATCH', body, auth: true }),
  adminCreateSubject: (body) =>
    request('/admin/subjects', { method: 'POST', body, auth: true }),
  adminUpdateSubject: (id, body) =>
    request(`/admin/subjects/${id}`, { method: 'PATCH', body, auth: true }),
  adminListResources: () => request('/admin/resources', { auth: true }),
  adminCreateResource: (body) =>
    request('/admin/resources', { method: 'POST', body, auth: true }),
  adminUpdateResource: (id, body) =>
    request(`/admin/resources/${id}`, { method: 'PATCH', body, auth: true }),
  adminRemoveResource: (id) =>
    request(`/admin/resources/${id}`, { method: 'DELETE', auth: true }),
  adminListComments: () => request('/admin/comments', { auth: true }),
  adminDeleteComment: (id) => request(`/admin/comments/${id}`, { method: 'DELETE', auth: true }),
  getAnnouncements: () => request('/announcements'),
  adminGetAnnouncements: () => request('/announcements/admin', { auth: true }),
  adminCreateAnnouncement: (body) => request('/announcements', { method: 'POST', body, auth: true }),
  adminUpdateAnnouncement: (id, body) =>
    request(`/announcements/${id}`, { method: 'PUT', body, auth: true }),
  adminToggleAnnouncement: (id) =>
    request(`/announcements/${id}/toggle`, { method: 'PATCH', auth: true }),
  adminDeleteAnnouncement: (id) =>
    request(`/announcements/${id}`, { method: 'DELETE', auth: true }),
  // Profile
  getProfile: () => request('/profile/me', { auth: true }),
  updateProfile: (body) => request('/profile/me', { method: 'PUT', body, auth: true }),
  getPublicProfile: (userId) => request(`/profile/${userId}`, { auth: true }),
  // Members
  getMembers: (q = '', page = 1) =>
    request(`/members?q=${encodeURIComponent(q)}&page=${page}`, { auth: true }),
  // Groups
  createGroup: (body) => request('/groups', { method: 'POST', body, auth: true }),
  getGroups: () => request('/groups', { auth: true }),
  getGroup: (id) => request(`/groups/${id}`, { auth: true }),
  requestToJoinGroup: (id) => request(`/groups/${id}/join`, { method: 'POST', auth: true }),
  getPendingGroupRequests: (id) => request(`/groups/${id}/pending-requests`, { auth: true }),
  handleGroupJoinRequest: (id, membershipId, action) =>
    request(`/groups/${id}/handle-request`, { method: 'POST', body: { membershipId, action }, auth: true }),
  getGroupParticipants: (id) => request(`/groups/${id}/participants`, { auth: true }),
  getAvailableGroupUsers: (id, q = '', page = 1) =>
    request(`/groups/${id}/available-users?q=${encodeURIComponent(q)}&page=${page}`, { auth: true }),
  addGroupMember: (groupId, userId) =>
    request(`/groups/${groupId}/members`, { method: 'POST', body: { userId }, auth: true }),
  removeGroupParticipant: (groupId, userId) =>
    request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE', auth: true }),
  // Chat
  getOrCreateConversation: (recipientId) =>
    request('/chat/conversations', { method: 'POST', body: { recipientId }, auth: true }),
  getConversations: () => request('/chat/conversations', { auth: true }),
  getPrivateMessages: (conversationId) =>
    request(`/chat/conversations/${conversationId}/messages`, { auth: true }),
  sendPrivateMessage: (conversationId, content) =>
    request(`/chat/conversations/${conversationId}/messages`, { method: 'POST', body: { content }, auth: true }),
  getGroupMessages: (groupId) => request(`/chat/groups/${groupId}/messages`, { auth: true }),
  sendGroupMessage: (groupId, content) =>
    request(`/chat/groups/${groupId}/messages`, { method: 'POST', body: { content }, auth: true }),
  editChatMessage: (messageId, content) =>
    request(`/chat/messages/${messageId}`, { method: 'PUT', body: { content }, auth: true }),
  deleteChatMessage: (messageId) =>
    request(`/chat/messages/${messageId}`, { method: 'DELETE', auth: true }),
};
