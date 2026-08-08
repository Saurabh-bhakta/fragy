/**
 * Thin fetch wrapper for the NotesHub API.
 * In development, Vite proxies /api → http://localhost:5000
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
};
