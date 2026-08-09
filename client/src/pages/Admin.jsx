import { useEffect, useState } from 'react';
import { api } from '../services/api';

const TABS = ['overview', 'announcements', 'content', 'materials', 'comments', 'about', 'users'];

/**
 * Admin panel — manage content, announcements, uploaded materials, student comments, owner details, and users.
 */
function Admin() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [resourcesList, setResourcesList] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Content forms
  const [semesterForm, setSemesterForm] = useState({ name: '', number: '', description: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', semesterId: '' });
  const [resourceForm, setResourceForm] = useState({
    title: '',
    type: 'notes',
    subjectId: '',
    driveUrl: '',
    description: '',
  });
  const [subjectsForSelect, setSubjectsForSelect] = useState([]);

  // About & Owner Form State
  const [aboutForm, setAboutForm] = useState({
    aboutIntro: '',
    owner: { name: '', role: '', email: '', phone: '', bio: '', links: '' },
    contentProvider: { name: '', role: '', email: '', phone: '', bio: '', links: '' },
  });
  const [aboutLoading, setAboutLoading] = useState(false);
  const [aboutSaving, setAboutSaving] = useState(false);

  async function refresh() {
    setError('');
    try {
      const [ov, sem] = await Promise.all([api.adminOverview(), api.getSemesters()]);
      setOverview(ov);
      setSemesters(sem.semesters || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadResources() {
    setResourcesLoading(true);
    try {
      const data = await api.adminListResources();
      setResourcesList(data.resources || []);
    } catch (err) {
      setError(err.message || 'Failed to load uploaded materials.');
    } finally {
      setResourcesLoading(false);
    }
  }

  async function loadAdminComments() {
    setCommentsLoading(true);
    try {
      const data = await api.adminListComments();
      setCommentsList(data.comments || []);
    } catch (err) {
      setError(err.message || 'Failed to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  }

  async function loadAdminAnnouncements() {
    setAnnouncementsLoading(true);
    try {
      const data = await api.adminGetAnnouncements();
      setAnnouncementsList(data.announcements || []);
    } catch (err) {
      setError(err.message || 'Failed to load announcements.');
    } finally {
      setAnnouncementsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      api.adminUsers().then((d) => setUsers(d.users || [])).catch((e) => setError(e.message));
    } else if (tab === 'announcements') {
      loadAdminAnnouncements();
    } else if (tab === 'materials') {
      loadResources();
    } else if (tab === 'comments') {
      loadAdminComments();
    } else if (tab === 'about') {
      setAboutLoading(true);
      api
        .adminGetAbout()
        .then((data) => {
          if (data.about) {
            setAboutForm({
              aboutIntro: data.about.aboutIntro || '',
              owner: {
                name: data.about.owner?.name || '',
                role: data.about.owner?.role || '',
                email: data.about.owner?.email || '',
                phone: data.about.owner?.phone || '',
                bio: data.about.owner?.bio || '',
                links: data.about.owner?.links || '',
              },
              contentProvider: {
                name: data.about.contentProvider?.name || '',
                role: data.about.contentProvider?.role || '',
                email: data.about.contentProvider?.email || '',
                phone: data.about.contentProvider?.phone || '',
                bio: data.about.contentProvider?.bio || '',
                links: data.about.contentProvider?.links || '',
              },
            });
          }
        })
        .catch((e) => setError(e.message))
        .finally(() => setAboutLoading(false));
    }
  }, [tab]);

  async function onCreateAnnouncement(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    setAnnouncementSubmitting(true);
    try {
      const res = await api.adminCreateAnnouncement(announcementForm);
      setMessage(res.message || 'Announcement published successfully.');
      setAnnouncementForm({ title: '', message: '' });
      loadAdminAnnouncements();
    } catch (err) {
      setError(err.message || 'Failed to publish announcement.');
    } finally {
      setAnnouncementSubmitting(false);
    }
  }

  async function onSaveEditedAnnouncement(e) {
    e.preventDefault();
    if (!editingAnnouncement) return;
    setMessage('');
    setError('');
    try {
      await api.adminUpdateAnnouncement(editingAnnouncement.id, {
        title: editingAnnouncement.title,
        message: editingAnnouncement.message,
      });
      setMessage('Announcement updated successfully.');
      setEditingAnnouncement(null);
      loadAdminAnnouncements();
    } catch (err) {
      setError(err.message || 'Failed to update announcement.');
    }
  }

  async function onToggleAnnouncement(id) {
    setMessage('');
    setError('');
    try {
      const res = await api.adminToggleAnnouncement(id);
      setMessage(res.message || 'Status updated.');
      loadAdminAnnouncements();
    } catch (err) {
      setError(err.message || 'Failed to toggle status.');
    }
  }

  async function onDeleteAnnouncement(id, title) {
    if (!window.confirm(`Are you sure you want to delete announcement "${title}"?`)) {
      return;
    }
    setMessage('');
    setError('');
    try {
      await api.adminDeleteAnnouncement(id);
      setMessage(`Announcement "${title}" deleted successfully.`);
      loadAdminAnnouncements();
    } catch (err) {
      setError(err.message || 'Failed to delete announcement.');
    }
  }

  async function loadSubjects(semesterId) {
    if (!semesterId) {
      setSubjectsForSelect([]);
      return;
    }
    const data = await api.getSemester(semesterId);
    setSubjectsForSelect(data.subjects || []);
  }

  async function onCreateSemester(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.adminCreateSemester({
        ...semesterForm,
        number: Number(semesterForm.number),
      });
      setSemesterForm({ name: '', number: '', description: '' });
      setMessage('Semester created successfully.');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onCreateSubject(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.adminCreateSubject(subjectForm);
      setSubjectForm({ name: '', code: '', semesterId: subjectForm.semesterId });
      setMessage('Subject created successfully.');
      await loadSubjects(subjectForm.semesterId);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onCreateResource(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.adminCreateResource(resourceForm);
      setResourceForm((f) => ({
        ...f,
        title: '',
        driveUrl: '',
        description: '',
      }));
      setMessage('Resource added successfully!');
      refresh();
      loadResources();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteResource(resourceId, resourceTitle) {
    if (!window.confirm(`Are you sure you want to delete "${resourceTitle}"?`)) {
      return;
    }

    setMessage('');
    setError('');
    try {
      await api.adminRemoveResource(resourceId);
      setMessage(`"${resourceTitle}" deleted successfully.`);
      loadResources();
      refresh();
    } catch (err) {
      setError(err.message || 'Failed to delete resource.');
    }
  }

  async function handleDeleteComment(commentId, authorName) {
    if (!window.confirm(`Are you sure you want to delete this comment by ${authorName}?`)) {
      return;
    }

    setMessage('');
    setError('');
    try {
      await api.adminDeleteComment(commentId);
      setMessage(`Comment by ${authorName} deleted successfully.`);
      loadAdminComments();
    } catch (err) {
      setError(err.message || 'Failed to delete comment.');
    }
  }

  async function onSaveAbout(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    setAboutSaving(true);
    try {
      await api.adminUpdateAbout(aboutForm);
      setMessage('Owner & Content Provider details updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save About & Owner details.');
    } finally {
      setAboutSaving(false);
    }
  }

  return (
    <div className="page section">
      <div className="container admin-layout">
        <div>
          <h1>Admin Panel</h1>
          <p className="muted">Manage content, delete uploaded materials, moderate comments, update owner details & users.</p>
        </div>

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t)}
            >
              {t === 'about'
                ? 'About & Owner'
                : t === 'materials'
                ? 'Uploaded Materials'
                : t === 'comments'
                ? 'Comments Manager'
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {tab === 'overview' && overview && (
          <div className="stat-row">
            <div className="stat-pill">
              <strong>{overview.users}</strong>
              Users
            </div>
            <div className="stat-pill">
              <strong>{overview.semesters}</strong>
              Semesters
            </div>
            <div className="stat-pill">
              <strong>{overview.subjects}</strong>
              Subjects
            </div>
            <div className="stat-pill">
              <strong>{overview.resources}</strong>
              Resources
            </div>
          </div>
        )}

        {tab === 'announcements' && (
          <div className="admin-announcements-wrap" style={{ display: 'grid', gap: '2rem' }}>
            <form className="stack-form form-card" style={{ margin: 0, maxWidth: '100%' }} onSubmit={onCreateAnnouncement}>
              <h2>Publish New Announcement 📢</h2>
              <p className="muted">
                Publishing a new announcement will automatically notify all registered users via email.
              </p>
              <div className="form-group">
                <label>Title</label>
                <input
                  required
                  placeholder="e.g. New Unit 2 Notes Added for Basic Electronics"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Message / Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed announcement message..."
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm((f) => ({ ...f, message: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem' }}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={announcementSubmitting}>
                {announcementSubmitting ? 'Publishing & Notifying...' : 'Publish Announcement 🚀'}
              </button>
            </form>

            {editingAnnouncement && (
              <form className="stack-form form-card" style={{ margin: 0, maxWidth: '100%', borderColor: 'var(--color-brand)' }} onSubmit={onSaveEditedAnnouncement}>
                <h2>Edit Announcement ✏️</h2>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    required
                    value={editingAnnouncement.title}
                    onChange={(e) => setEditingAnnouncement((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    required
                    rows={4}
                    value={editingAnnouncement.message}
                    onChange={(e) => setEditingAnnouncement((f) => ({ ...f, message: e.target.value }))}
                    style={{ width: '100%', padding: '0.75rem' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" type="submit">
                    Save Changes
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setEditingAnnouncement(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="form-card" style={{ maxWidth: '100%' }}>
              <h2>Announcements Manager ({announcementsList.length})</h2>
              <p className="muted">Activate/Deactivate, edit, or delete existing site announcements.</p>

              {announcementsLoading ? (
                <p className="muted">Loading announcements...</p>
              ) : announcementsList.length === 0 ? (
                <p className="muted">No announcements posted yet.</p>
              ) : (
                <div className="table-wrap" style={{ marginTop: '1rem' }}>
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Title & Content</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcementsList.map((a) => (
                        <tr key={a.id || a._id}>
                          <td>
                            <strong style={{ fontSize: '1rem', display: 'block', color: 'var(--color-ink)' }}>{a.title}</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--color-ink-muted)', whiteSpace: 'pre-wrap' }}>
                              {a.message}
                            </p>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                background: a.isActive ? 'rgba(15, 118, 110, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: a.isActive ? 'var(--color-brand)' : '#ef4444',
                              }}
                            >
                              {a.isActive ? '🟢 Active' : '🔴 Inactive'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
                            {new Date(a.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                                onClick={() => onToggleAnnouncement(a.id || a._id)}
                              >
                                {a.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                                onClick={() => setEditingAnnouncement({ id: a.id || a._id, title: a.title, message: a.message })}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  borderColor: '#fca5a5',
                                  padding: '0.35rem 0.65rem',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                }}
                                onClick={() => onDeleteAnnouncement(a.id || a._id, a.title)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'content' && (
          <>
            <form className="stack-form form-card" style={{ margin: 0 }} onSubmit={onCreateSemester}>
              <h2>Add Semester</h2>
              <div className="form-group">
                <label>Name</label>
                <input
                  required
                  placeholder="e.g. Semester 1"
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Number</label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="1"
                  value={semesterForm.number}
                  onChange={(e) => setSemesterForm((f) => ({ ...f, number: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  placeholder="Optional description"
                  value={semesterForm.description}
                  onChange={(e) => setSemesterForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Add Semester
              </button>
            </form>

            <form className="stack-form form-card" style={{ margin: 0 }} onSubmit={onCreateSubject}>
              <h2>Add Subject</h2>
              <div className="form-group">
                <label>Semester</label>
                <select
                  required
                  value={subjectForm.semesterId}
                  onChange={(e) => {
                    const semesterId = e.target.value;
                    setSubjectForm((f) => ({ ...f, semesterId }));
                    loadSubjects(semesterId);
                  }}
                >
                  <option value="">Select semester</option>
                  {semesters.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input
                  placeholder="e.g. CS201"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Add Subject
              </button>
            </form>

            <form className="stack-form form-card" style={{ margin: 0 }} onSubmit={onCreateResource}>
              <h2>Add Material (Drive link)</h2>
              <div className="form-group">
                <label>Semester (to load subjects)</label>
                <select onChange={(e) => loadSubjects(e.target.value)} defaultValue="">
                  <option value="">Select semester</option>
                  {semesters.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select
                  required
                  value={resourceForm.subjectId}
                  onChange={(e) =>
                    setResourceForm((f) => ({ ...f, subjectId: e.target.value }))
                  }
                >
                  <option value="">Select subject</option>
                  {subjectsForSelect.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={resourceForm.type}
                  onChange={(e) => setResourceForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="notes">Notes 📄</option>
                  <option value="slides">Slides 📊</option>
                  <option value="pyqs">PYQs ❓</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  required
                  placeholder="e.g. Unit 1 Complete Notes"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Google Drive Link</label>
                <input
                  required
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={resourceForm.driveUrl}
                  onChange={(e) => setResourceForm((f) => ({ ...f, driveUrl: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  placeholder="Optional notes description"
                  value={resourceForm.description}
                  onChange={(e) =>
                    setResourceForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Upload Material
              </button>
            </form>
          </>
        )}

        {tab === 'materials' && (
          <div className="form-card" style={{ maxWidth: '100%' }}>
            <h2>Uploaded Study Materials ({resourcesList.length})</h2>
            <p className="muted">Click Delete next to any material to permanently remove it from the platform.</p>

            {resourcesLoading ? (
              <p className="muted">Loading materials…</p>
            ) : resourcesList.length === 0 ? (
              <p className="muted">No study materials uploaded yet.</p>
            ) : (
              <div className="table-wrap" style={{ marginTop: '1rem' }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>Drive Link</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resourcesList.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <strong>{r.title}</strong>
                          {r.description && <div className="muted" style={{ fontSize: '0.85rem' }}>{r.description}</div>}
                        </td>
                        <td>
                          <span className="badge" style={{ textTransform: 'capitalize' }}>
                            {r.type === 'notes' ? '📄 Notes' : r.type === 'slides' ? '📊 Slides' : '❓ PYQs'}
                          </span>
                        </td>
                        <td>
                          {r.subjectId?.name ? `${r.subjectId.name} (${r.subjectId.code || ''})` : 'Unknown Subject'}
                        </td>
                        <td>
                          <a
                            href={r.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.88rem', wordBreak: 'break-all' }}
                          >
                            Open Link ↗
                          </a>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              borderColor: '#fca5a5',
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                            }}
                            onClick={() => handleDeleteResource(r._id, r.title)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'comments' && (
          <div className="form-card" style={{ maxWidth: '100%' }}>
            <h2>Student Comments Manager ({commentsList.length})</h2>
            <p className="muted">Review student feedback and delete spam or inappropriate comments.</p>

            {commentsLoading ? (
              <p className="muted">Loading comments…</p>
            ) : commentsList.length === 0 ? (
              <p className="muted">No comments posted yet.</p>
            ) : (
              <div className="table-wrap" style={{ marginTop: '1rem' }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Author</th>
                      <th>Message</th>
                      <th>Posted On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commentsList.map((c) => (
                      <tr key={c.id || c._id}>
                        <td>
                          <strong>{c.authorName}</strong>
                          {c.isEdited && <span className="muted" style={{ fontSize: '0.78rem', display: 'block' }}>(edited)</span>}
                        </td>
                        <td style={{ maxWidth: '360px', wordBreak: 'break-word' }}>
                          {c.message}
                        </td>
                        <td>
                          {c.createdAt ? new Date(c.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              borderColor: '#fca5a5',
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                            }}
                            onClick={() => handleDeleteComment(c.id || c._id, c.authorName)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'about' && (
          <form className="stack-form form-card" style={{ margin: 0, maxWidth: '100%' }} onSubmit={onSaveAbout}>
            <h2>Manage About & Owner Details</h2>
            {aboutLoading ? (
              <p className="muted">Loading details…</p>
            ) : (
              <>
                <div className="form-group">
                  <label>Platform Intro / About Description</label>
                  <textarea
                    rows={3}
                    value={aboutForm.aboutIntro}
                    onChange={(e) => setAboutForm((f) => ({ ...f, aboutIntro: e.target.value }))}
                    placeholder="Brief description of Fragy..."
                    style={{ width: '100%', padding: '0.75rem' }}
                  />
                </div>

                <hr style={{ margin: '1.5rem 0', borderColor: 'var(--color-border)' }} />

                <h3>Platform Owner Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Owner Name</label>
                    <input
                      value={aboutForm.owner.name}
                      onChange={(e) =>
                        setAboutForm((f) => ({ ...f, owner: { ...f.owner, name: e.target.value } }))
                      }
                      placeholder="e.g. Saurabh Bhakta"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input
                      value={aboutForm.owner.role}
                      onChange={(e) =>
                        setAboutForm((f) => ({ ...f, owner: { ...f.owner, role: e.target.value } }))
                      }
                      placeholder="e.g. Founder & Lead Developer"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={aboutForm.owner.email}
                      onChange={(e) =>
                        setAboutForm((f) => ({ ...f, owner: { ...f.owner, email: e.target.value } }))
                      }
                      placeholder="owner@college.edu"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      value={aboutForm.owner.phone}
                      onChange={(e) =>
                        setAboutForm((f) => ({ ...f, owner: { ...f.owner, phone: e.target.value } }))
                      }
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    rows={2}
                    value={aboutForm.owner.bio}
                    onChange={(e) =>
                      setAboutForm((f) => ({ ...f, owner: { ...f.owner, bio: e.target.value } }))
                    }
                    placeholder="Short owner bio..."
                    style={{ width: '100%', padding: '0.75rem' }}
                  />
                </div>
                <div className="form-group">
                  <label>Social / Portfolio Link</label>
                  <input
                    value={aboutForm.owner.links}
                    onChange={(e) =>
                      setAboutForm((f) => ({ ...f, owner: { ...f.owner, links: e.target.value } }))
                    }
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <hr style={{ margin: '1.5rem 0', borderColor: 'var(--color-border)' }} />

                <h3>Content Provider Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Provider Name</label>
                    <input
                      value={aboutForm.contentProvider.name}
                      onChange={(e) =>
                        setAboutForm((f) => ({
                          ...f,
                          contentProvider: { ...f.contentProvider, name: e.target.value },
                        }))
                      }
                      placeholder="e.g. Academic Team"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input
                      value={aboutForm.contentProvider.role}
                      onChange={(e) =>
                        setAboutForm((f) => ({
                          ...f,
                          contentProvider: { ...f.contentProvider, role: e.target.value },
                        }))
                      }
                      placeholder="e.g. Materials Contributor"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={aboutForm.contentProvider.email}
                      onChange={(e) =>
                        setAboutForm((f) => ({
                          ...f,
                          contentProvider: { ...f.contentProvider, email: e.target.value },
                        }))
                      }
                      placeholder="content@college.edu"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      value={aboutForm.contentProvider.phone}
                      onChange={(e) =>
                        setAboutForm((f) => ({
                          ...f,
                          contentProvider: { ...f.contentProvider, phone: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    rows={2}
                    value={aboutForm.contentProvider.bio}
                    onChange={(e) =>
                      setAboutForm((f) => ({
                        ...f,
                        contentProvider: { ...f.contentProvider, bio: e.target.value },
                      }))
                    }
                    style={{ width: '100%', padding: '0.75rem' }}
                  />
                </div>
                <div className="form-group">
                  <label>Link / Website</label>
                  <input
                    value={aboutForm.contentProvider.links}
                    onChange={(e) =>
                      setAboutForm((f) => ({
                        ...f,
                        contentProvider: { ...f.contentProvider, links: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={aboutSaving}>
                    {aboutSaving ? 'Saving Details…' : 'Save Owner & Content Provider Details'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {tab === 'users' && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
