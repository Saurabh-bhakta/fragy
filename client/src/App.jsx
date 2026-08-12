import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import DoubtWidget from './components/DoubtWidget';
import MoreOptionsWidget from './components/MoreOptionsWidget';
import Home from './pages/Home';
import Semester from './pages/Semester';
import Subject from './pages/Subject';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Members from './pages/Members';
import Groups from './pages/Groups';
import CreateGroup from './pages/CreateGroup';
import GroupDetails from './pages/GroupDetails';
import Chat from './pages/Chat';
import About from './pages/About';
import Comments from './pages/Comments';
import Announcements from './pages/Announcements';
import CompleteProfile from './pages/CompleteProfile';
import Admin from './pages/Admin';

/**
 * App root: theme provider + auth provider + router + shared chrome.
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Navbar />

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/announcements" element={<Announcements />} />
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
              <Route path="/complete-profile" element={<CompleteProfile />} />
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
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <PublicProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/members"
                element={
                  <ProtectedRoute>
                    <Members />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups"
                element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups/create"
                element={
                  <ProtectedRoute>
                    <CreateGroup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups/:groupId"
                element={
                  <ProtectedRoute>
                    <GroupDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:conversationId"
                element={
                  <ProtectedRoute>
                    <Chat />
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

            {/* Floating More Options Widget positioned immediately above DoubtWidget */}
            <MoreOptionsWidget />

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
    </ThemeProvider>
  );
}

export default App;
