import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import DoubtWidget from './components/DoubtWidget';
import Home from './pages/Home';
import Semester from './pages/Semester';
import Subject from './pages/Subject';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import About from './pages/About';
import Comments from './pages/Comments';
import Admin from './pages/Admin';

/**
 * App root: auth provider + router + shared chrome.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/semester/:semesterId"
              element={
                <ProtectedRoute>
                  <Semester />
                </ProtectedRoute>
              }
            />
            <Route
              path="/semester/:semesterId/subject/:subjectId"
              element={
                <ProtectedRoute>
                  <Subject />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/comments" element={<Comments />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>

          {/* Floating Have a doubt? AI assistance widget */}
          <DoubtWidget />

          <footer className="footer">
            <div className="container footer-inner">
              <span>© {new Date().getFullYear()} Fragy</span>
              <span>Study materials for learning — not for redistribution.</span>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
