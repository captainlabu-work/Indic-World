import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../firebase/services';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userData, isAdmin } = useAuth();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = () => {
    if (userData?.displayName) {
      return userData.displayName.charAt(0).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-text">Indic</span>
          <div className="nav-divider"></div>
          <img src="/Indic 2.png" alt="Indic Logo" className="nav-logo-img" />
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>
              Contact
            </Link>
          </li>

          {currentUser ? (
            <>
              {isAdmin && (
                <li>
                  <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                    Admin
                  </Link>
                </li>
              )}
              <li className="profile-menu-container">
                <Link
                  to="/profile"
                  className="profile-button"
                >
                  <div className="profile-avatar">
                    {userData?.photoURL || currentUser?.photoURL ? (
                      <img
                        src={userData?.photoURL || currentUser?.photoURL}
                        alt={userData?.displayName || currentUser?.email}
                        className="profile-avatar-img"
                      />
                    ) : (
                      getInitials()
                    )}
                  </div>
                </Link>

                {showProfileMenu && (
                  <>
                    <div
                      className="profile-menu-overlay"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="profile-dropdown">
                      <div className="profile-dropdown-header">
                        <div className="profile-avatar-large">
                          {userData?.photoURL || currentUser?.photoURL ? (
                            <img
                              src={userData?.photoURL || currentUser?.photoURL}
                              alt={userData?.displayName || currentUser?.email}
                              className="profile-avatar-img"
                            />
                          ) : (
                            getInitials()
                          )}
                        </div>
                        <div className="profile-info">
                          <div className="profile-name">
                            {userData?.displayName || currentUser?.displayName || currentUser?.email}
                          </div>
                          <div className="profile-email">
                            {currentUser?.email}
                          </div>
                          {isAdmin && (
                            <span className="admin-badge">Admin</span>
                          )}
                        </div>
                      </div>

                      <div className="profile-dropdown-divider" />

                      <Link
                        to="/profile"
                        className="profile-dropdown-item"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        View Profile
                      </Link>

                      <Link
                        to="/settings"
                        className="profile-dropdown-item"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
                          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                        </svg>
                        Settings
                      </Link>

                      <button
                        className="profile-dropdown-item sign-out"
                        onClick={handleSignOut}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </li>
            </>
          ) : (
            <li>
              <Link to="/auth" className="nav-cta">
                Get Started
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
