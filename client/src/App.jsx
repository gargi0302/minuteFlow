import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspacePage from './pages/WorkspacePage';
import MeetingPage from './pages/MeetingPage';
import MoMView from './pages/MoMView';
import TasksPage from './pages/TasksPage';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-muted)', fontWeight:500, fontSize:'0.9rem' }}>
      Loading…
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const Layout = ({ children }) => (
  <div style={{ minHeight:'100vh', background:'var(--bg-secondary)' }}>
    <Navbar />
    <main style={{ maxWidth:1200, margin:'0 auto', padding:'36px 28px 60px' }}>
      {children}
    </main>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/"                element={<Navigate to="/dashboard" replace />} />
          <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard"       element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/workspace/:id"   element={<PrivateRoute><Layout><WorkspacePage /></Layout></PrivateRoute>} />
          <Route path="/meeting/:id"     element={<PrivateRoute><Layout><MeetingPage /></Layout></PrivateRoute>} />
          <Route path="/meeting/:id/mom" element={<PrivateRoute><Layout><MoMView /></Layout></PrivateRoute>} />
          <Route path="/tasks"           element={<PrivateRoute><Layout><TasksPage /></Layout></PrivateRoute>} />
          <Route path="/profile"         element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
