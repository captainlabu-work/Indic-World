import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../firebase/services';
import SearchOverlay from './SearchOverlay';
import './Navbar.css';

const CATEGORIES = [
  { path: '/word', label: 'Word' },
  { path: '/lens', label: 'Lens' },
  { path: '/motion', label: 'Motion' },
];

const Navbar = () => {
  const { currentUser, userData, isAdmin } = useAuth();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = () => {
    if (userData?.displayName) return userData.displayName.charAt(0).toUpperCase();
    if (currentUser?.email) return currentUser.email.charAt(0).toUpperCase();
    return 'U';
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-text">Indic</span>
            <div className="nav-divider"></div>
            <img src="/Indic 2.png" alt="Indic Logo" className="nav-logo-img" />
          </Link>
          <ul className="nav-categories">
            {CATEGORIES.map(({ path, label }) => (
              <li key={path}>
                <Link to={path} className={location.pathname === path ? 'active' : ''}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className={`nav-hamburger ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        {/* ===== Desktop nav links (hidden on mobile) ===== */}
        <ul className="nav-links">
          <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
          <li><Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link></li>
          <li><Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link></li>
          <li>
            <button className="nav-search-btn" onClick={() => setShowSearch(true)} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </li>
          {currentUser ? (
            <>
              {isAdmin && (
                <li><Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Admin</Link></li>
              )}
              <li>
                <Link to="/profile" className="profile-button">
                  <div className="profile-avatar">
                    {userData?.photoURL || currentUser?.photoURL ? (
                      <img src={userData?.photoURL || currentUser?.photoURL} alt="" className="profile-avatar-img" />
                    ) : getInitials()}
                  </div>
                </Link>
              </li>
            </>
          ) : (
            <li><Link to="/auth" className="nav-cta">Get Started</Link></li>
          )}
        </ul>

        {/* ===== Mobile full-screen menu ===== */}
        {mobileMenuOpen && <div className="mobile-overlay" onClick={closeMenu} />}
        <div className={`mobile-menu ${mobileMenuOpen ? 'mobile-menu--open' : ''}`}>
          {/* Close */}
          <button className="mobile-menu-close" onClick={closeMenu} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Account header */}
          {currentUser && (
            <Link to="/profile" className="mobile-account" onClick={closeMenu}>
              <div className="mobile-account-avatar">
                {userData?.photoURL || currentUser?.photoURL ? (
                  <img src={userData?.photoURL || currentUser?.photoURL} alt="" className="profile-avatar-img" />
                ) : getInitials()}
              </div>
              <span className="mobile-account-label">SIGNED IN AS</span>
              <span className="mobile-account-name">{userData?.displayName || currentUser?.displayName || currentUser?.email}</span>
            </Link>
          )}

          {/* Links */}
          <nav className="mobile-nav">
            {CATEGORIES.map(({ path, label }) => (
              <Link key={path} to={path} className={location.pathname === path ? 'active' : ''} onClick={closeMenu}>{label}</Link>
            ))}
            <div className="mobile-divider" />
            <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={closeMenu}>Home</Link>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''} onClick={closeMenu}>About</Link>
            <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''} onClick={closeMenu}>Contact</Link>
            {currentUser && (
              <>
                <div className="mobile-divider" />
                <Link to="/settings" onClick={closeMenu}>Settings</Link>
                {isAdmin && <Link to="/admin" onClick={closeMenu}>Admin</Link>}
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="mobile-footer">
            {currentUser ? (
              <>
                <Link to="/create-story" className="mobile-cta" onClick={closeMenu}>Create Story</Link>
                <button className="mobile-signout" onClick={handleSignOut}>Sign Out</button>
              </>
            ) : (
              <Link to="/auth" className="mobile-cta" onClick={closeMenu}>Get Started</Link>
            )}
          </div>
        </div>
      </div>

      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </nav>
  );
};

export default Navbar;
