import { useEffect, useState } from 'react';
import { api } from '../services/api';

const TABS = ['overview', 'content', 'users'];

/**
 * Admin panel — manage semesters, subjects, resources; view users.
 * Route is protected with requireAdmin on the frontend AND authorize('admin') on the API.
 */
function Admin() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="page section">
      <div className="container admin-layout">
        <div>
          <h1>Admin panel</h1>
          <p className="muted">Manage content and users.</p>
        </div>

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t)}
            >
              {t}
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
                <select
                  onChange={(e) => loadSubjects(e.target.value)}
                  defaultValue=""
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
