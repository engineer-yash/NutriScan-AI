import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Leaf, LogIn, LogOut, LayoutDashboard, History as HistoryIcon, ScanLine, Menu, X } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Analyze from './pages/Analyze.jsx';
import Result from './pages/Result.jsx';
import History from './pages/History.jsx';
import Dashboard from './pages/Dashboard.jsx';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthed, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  // Always collapse the mobile menu after a route change.
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const onLogout = () => {
    setOpen(false);
    signOut();
    navigate('/');
  };

  // Close mobile menu whenever route changes
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-leaf-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link to="/" onClick={close} className="flex items-center gap-2 font-extrabold text-lg" data-testid="nav-logo">
          <span className="w-9 h-9 rounded-2xl bg-leaf-600 text-white grid place-items-center shadow-lg shadow-leaf-600/30">
            <Leaf size={18} />
          </span>
          <span className="font-display">Nutri<span className="text-leaf-600">Scan</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3 text-sm">
          {isAuthed && (
            <>
              <Link to="/analyze"   className="btn-ghost" data-testid="nav-analyze"><ScanLine size={16}/> Analyze</Link>
              <Link to="/history"   className="btn-ghost" data-testid="nav-history"><HistoryIcon size={16}/> History</Link>
              <Link to="/dashboard" className="btn-ghost" data-testid="nav-dashboard"><LayoutDashboard size={16}/> Dashboard</Link>
              <span className="hidden lg:inline text-neutral-600 text-xs" data-testid="nav-email">{user?.email}</span>
              <button onClick={onLogout} className="btn-ghost" data-testid="nav-logout"><LogOut size={16}/> Logout</button>
            </>
          )}
          {!isAuthed && (
            <Link to="/login" className="btn-primary" data-testid="nav-login"><LogIn size={16}/> Login</Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-leaf-200 bg-white text-ink-900"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          data-testid="nav-mobile-toggle"
        >
          {open ? <X size={18}/> : <Menu size={18}/>}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden border-t border-leaf-100 bg-white" data-testid="nav-mobile-panel">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
            {isAuthed ? (
              <>
                {user?.email && (
                  <div className="text-xs text-neutral-500 px-1 pb-1" data-testid="nav-mobile-email">{user.email}</div>
                )}
                <Link to="/analyze"   onClick={close} className="btn-ghost justify-start" data-testid="nav-mobile-analyze"><ScanLine size={16}/> Analyze</Link>
                <Link to="/history"   onClick={close} className="btn-ghost justify-start" data-testid="nav-mobile-history"><HistoryIcon size={16}/> History</Link>
                <Link to="/dashboard" onClick={close} className="btn-ghost justify-start" data-testid="nav-mobile-dashboard"><LayoutDashboard size={16}/> Dashboard</Link>
                <button onClick={onLogout} className="btn-ghost justify-start" data-testid="nav-mobile-logout"><LogOut size={16}/> Logout</button>
              </>
            ) : (
              <Link to="/login" onClick={close} className="btn-primary justify-center" data-testid="nav-mobile-login"><LogIn size={16}/> Login</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen grain relative">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/analyze"     element={<RequireAuth><Analyze /></RequireAuth>} />
          <Route path="/result/:id"  element={<RequireAuth><Result /></RequireAuth>} />
          <Route path="/result"      element={<RequireAuth><Result /></RequireAuth>} />
          <Route path="/history"     element={<RequireAuth><History /></RequireAuth>} />
          <Route path="/dashboard"   element={<RequireAuth><Dashboard /></RequireAuth>} />
        </Routes>
      </main>
      <footer className="py-8 sm:py-10 text-center text-xs sm:text-sm text-neutral-500 px-4">
        NutriScan AI  •  Powered by Azure OpenAI, Vision &amp; Blob
      </footer>
    </div>
  );
}