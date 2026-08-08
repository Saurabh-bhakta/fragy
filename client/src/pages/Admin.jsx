import { useEffect, useState } from 'react';
import { api } from '../services/api';

const TABS = ['overview', 'content', 'about', 'users'];

/**
 * Admin panel — manage content, about & owner details, and view users.
 */
function Admin() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [semesters, setSemesters] = useState([]);
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

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      api.adminUsers().then((d) => setUsers(d.users || [])).catch((e) => setError(e.message));
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
      setMessage('Semester created.');
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
      setMessage('Subject created.');
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
      setMessage('Resource added.');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function softRemoveResource() {
    const id = window.prompt('Enter resource MongoDB id to remove (soft delete):');
    if (!id) return;
    try {
      await api.adminRemoveResource(id.trim());
      setMessage('Resource removed.');
      refresh();
    } catch (err) {
      setError(err.message);
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
          <p className="muted">Manage platform content, owner details, and users.</p>
        </div>

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t)}
            >
              {t === 'about' ? 'About & Owner' : t.charAt(0).toUpperCase() + t.slice(1)}
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

        {tab === 'content' && (
          <>
            <form className="stack-form form-card" style={{ margin: 0 }} onSubmit={onCreateSemester}>
              <h2>Add semester</h2>
              <div className="form-group">
                <label>Name</label>
                <input
                  required
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
                  value={semesterForm.number}
                  onChange={(e) => setSemesterForm((f) => ({ ...f, number: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  value={semesterForm.description}
                  onChange={(e) => setSemesterForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Add semester
              </button>
            </form>

            <form className="stack-form form-card" style={{ margin: 0 }} onSubmit={onCreateSubject}>
              <h2>Add subject</h2>
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
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Add subject
              </button>
            </form>

            <form className="stack-form form-card" style={{ margin: 0 }} onSubmit={onCreateResource}>
              <h2>Add resource (Drive link)</h2>
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
                  <option value="notes">Notes</option>
                  <option value="slides">Slides</option>
                  <option value="pyqs">PYQs</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  required
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Google Drive URL</label>
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
                  value={resourceForm.description}
                  onChange={(e) =>
                    setResourceForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Add resource
              </button>
              <button type="button" className="btn btn-secondary" onClick={softRemoveResource}>
                Remove resource by ID
              </button>
            </form>
          </>
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
