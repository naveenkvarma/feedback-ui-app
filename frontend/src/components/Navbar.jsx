import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('edu_dark_mode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('edu_dark_mode', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--surface-border)', position: 'sticky', top: 0, zIndex: 10 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
        <Link to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/dashboard'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1.25rem', color: 'var(--primary)' }}>
          <LayoutDashboard size={24} />
          EduFeedback
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={toggleDarkMode} className="btn" style={{ padding: '0.5rem', background: 'transparent', color: 'var(--text-main)', border: 'none' }}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <User size={18} />
            <span style={{ fontWeight: 500 }}>{user.name}</span>
            <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
              {user.role}
            </span>
          </div>
          
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
