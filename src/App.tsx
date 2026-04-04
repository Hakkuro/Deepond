import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import KanbanHome from "./pages/KanbanHome";
import BoardView from "./pages/BoardView";
import Profile from "./pages/Profile";
import AppLayout from "./components/AppLayout";

export default function App() {
  const { token, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes wrapped in AppLayout */}
      <Route 
        path="/" 
        element={token ? <AppLayout><Home /></AppLayout> : <Navigate to="/login" />} 
      />
      <Route 
        path="/kanban" 
        element={token ? <AppLayout><KanbanHome /></AppLayout> : <Navigate to="/login" />} 
      />
      <Route 
        path="/board/:id" 
        element={token ? <AppLayout><BoardView /></AppLayout> : <Navigate to="/login" />} 
      />
      <Route 
        path="/profile" 
        element={token ? <AppLayout><Profile /></AppLayout> : <Navigate to="/login" />} 
      />
    </Routes>
  );
}
