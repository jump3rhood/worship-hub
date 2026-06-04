import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import SongView from './pages/SongView';
import Login from './pages/Login';
import Admin from './pages/Admin';
import { api } from './api';

function ProtectedRoute({ children }) {
  if (!api.isLoggedIn()) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/song/:id" element={<SongView />} />
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
