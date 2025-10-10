import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../firebase/services';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNotification } from '../components/common/NotificationSystem';
import './Settings.css';

const Settings = () => {
  const { currentUser, userData, logout, isAdmin } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Profile editing states
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userData?.displayName) {
      setDisplayName(userData.displayName);
    } else if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }

    if (userData?.photoURL) {
      setPhotoURL(userData.photoURL);
    } else if (currentUser?.photoURL) {
      setPhotoURL(currentUser.photoURL);
    }
  }, [currentUser, userData]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      error('Image must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile-photos/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { photoURL: downloadURL });

      // Update Firestore user document
      if (userData?.id) {
        await userService.updateUserProfile(userData.id, { photoURL: downloadURL });
      } else {
        await userService.updateUser(currentUser.uid, { photoURL: downloadURL });
      }

      setPhotoURL(downloadURL);
      success('Profile photo updated successfully!');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error uploading photo:', err);
      error(`Failed to upload photo: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName });

      // Update Firestore user document
      if (userData?.id) {
        await userService.updateUserProfile(userData.id, { displayName });
      } else {
        await userService.updateUser(currentUser.uid, { displayName });
      }

      success('Profile updated successfully!');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      error(`Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      error('Failed to sign out. Please try again.');
    }
  };

  return (
    <div className="settings-page">
      {/* Exposure-style Header */}
      <header className="exposure-header">
        <nav className="exposure-nav">
          <div className="nav-left">
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              <span></span>
              <span></span>
              <span></span>
            </button>
            <Link to="/" className="logo-link">
              <img src="/Indic.png" alt="INDIC" className="site-logo" />
            </Link>
            <Link to="/" className="nav-link">
              <svg className="icon" viewBox="0 0 20 20" width="20" height="20">
                <path d="M10 2L2 8v11h6v-7h4v7h6V8z" fill="currentColor"/>
              </svg>
              HOME
            </Link>
            <Link to="/stats" className="nav-link">
              <svg className="icon" viewBox="0 0 20 20" width="20" height="20">
                <rect x="2" y="10" width="4" height="8" fill="currentColor"/>
                <rect x="8" y="6" width="4" height="12" fill="currentColor"/>
                <rect x="14" y="2" width="4" height="16" fill="currentColor"/>
              </svg>
              STATS
            </Link>
            <Link to="/subscribers" className="nav-link">
              <svg className="icon" viewBox="0 0 20 20" width="20" height="20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 11-4 0 2 2 0 014 0zM10 13c-3.3 0-6 2.7-6 6v1h12v-1c0-3.3-2.7-6-6-6zM2 19v-1c0-1.5.6-2.8 1.5-3.8C2.6 14.7 2 15.8 2 17v2zM18 19v-2c0-1.2-.6-2.3-1.5-2.8.9 1 1.5 2.3 1.5 3.8v1z" fill="currentColor"/>
              </svg>
              SUBSCRIBERS
            </Link>
            <Link to="/settings" className="nav-link active">
              <svg className="icon" viewBox="0 0 20 20" width="20" height="20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" fill="currentColor"/>
                <path d="M17.5 10c0-.5.1-1 .1-1.5l1.4-1.1c.1-.1.2-.3.1-.5l-1.3-2.2c-.1-.2-.3-.2-.5-.2l-1.7.7c-.5-.4-1.1-.7-1.7-.9l-.4-1.8c0-.2-.2-.3-.4-.3h-2.6c-.2 0-.3.1-.4.3l-.4 1.8c-.6.2-1.2.5-1.7.9l-1.7-.7c-.2 0-.4.1-.5.2L4.5 6.9c-.1.2 0 .4.1.5l1.4 1.1c0 .5.1 1 .1 1.5s-.1 1-.1 1.5l-1.4 1.1c-.1.1-.2.3-.1.5l1.3 2.2c.1.2.3.2.5.2l1.7-.7c.5.4 1.1.7 1.7.9l.4 1.8c0 .2.2.3.4.3h2.6c.2 0 .3-.1.4-.3l.4-1.8c.6-.2 1.2-.5 1.7-.9l1.7.7c.2 0 .4-.1.5-.2l1.3-2.2c.1-.2 0-.4-.1-.5l-1.4-1.1c0-.5-.1-1-.1-1.5z" fill="currentColor"/>
              </svg>
              SETTINGS
            </Link>
          </div>

          <div className="nav-right">
            <button
              onClick={() => navigate('/bookmarks')}
              className="bookmarks-button"
            >
              BOOKMARKS
            </button>
            <button
              onClick={handleSignOut}
              className="signout-button"
            >
              SIGN OUT
            </button>
            <button
              onClick={() => navigate('/create-story')}
              className="start-story-button"
            >
              START STORY
            </button>
          </div>
        </nav>

        {/* Hamburger Menu */}
        <div className={`hamburger-menu ${menuOpen ? 'open' : ''}`}>
          <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
          <div className="menu-panel">
            <button className="menu-close" onClick={() => setMenuOpen(false)}>
              ←
            </button>

            <div className="menu-header">
              <div className="menu-user">
                <div className="menu-user-avatar">
                  {photoURL ? (
                    <img src={photoURL} alt="User" />
                  ) : (
                    <img src="/Indic.png" alt="User" />
                  )}
                </div>
                <div className="menu-user-info">
                  <span className="menu-user-label">SIGNED IN AS</span>
                  <span className="menu-user-name">{userData?.displayName || currentUser?.email}</span>
                </div>
              </div>
            </div>

            <nav className="menu-nav">
              <Link to="/profile" className="menu-item" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
              <Link to="/settings" className="menu-item" onClick={() => setMenuOpen(false)}>
                Settings
              </Link>
              <Link to="/stats" className="menu-item" onClick={() => setMenuOpen(false)}>
                Statistics
              </Link>
              <Link to="/payments" className="menu-item" onClick={() => setMenuOpen(false)}>
                Payments
              </Link>
              <Link to="/" className="menu-item" onClick={() => setMenuOpen(false)}>
                Explore
              </Link>
              <button className="menu-item" onClick={handleSignOut}>
                Sign Out
              </button>
            </nav>

            <div className="menu-footer">
              <Link to="/help" className="menu-footer-link" onClick={() => setMenuOpen(false)}>
                HELP & SUPPORT
              </Link>
              <Link to="/terms" className="menu-footer-link" onClick={() => setMenuOpen(false)}>
                TERMS OF USE
              </Link>
              <Link to="/privacy" className="menu-footer-link" onClick={() => setMenuOpen(false)}>
                PRIVACY POLICY
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Content */}
      <div className="settings-container">
        <div className="settings-header">
          <h1>Account Settings</h1>
          <p className="settings-subtitle">Manage your profile and account preferences</p>
        </div>

        <div className="settings-content">
          {/* Profile Settings Card */}
          <div className="settings-card">
            <h2>Profile Information</h2>

            <div className="profile-photo-section">
              <div className="profile-avatar-large">
                {photoURL ? (
                  <img src={photoURL} alt={displayName || currentUser?.email} />
                ) : (
                  <span className="avatar-placeholder">
                    {displayName ? displayName.charAt(0).toUpperCase() : currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="photo-upload-wrapper">
                <input
                  type="file"
                  id="photoUpload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="photo-input"
                  disabled={uploading}
                />
                <label htmlFor="photoUpload" className="upload-label">
                  {uploading ? 'Uploading...' : 'Change Photo'}
                </label>
                <small className="upload-hint">Max 2MB, JPG/PNG</small>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="disabled-input"
                />
                <small className="input-help">Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Account Role</label>
                <input
                  type="text"
                  value={isAdmin ? 'Administrator' : 'Author'}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="button-group">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="cancel-btn"
                >
                  Back to Profile
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Statistics Card */}
          <div className="settings-card">
            <h2>Account Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{userData?.articlesCount || 0}</div>
                <div className="stat-label">Total Articles</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {userData?.createdAt?.toDate().toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                  }) || 'N/A'}
                </div>
                <div className="stat-label">Member Since</div>
              </div>
            </div>
          </div>

          {/* Privacy & Security Card */}
          <div className="settings-card">
            <h2>Privacy & Security</h2>
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Two-Factor Authentication</h3>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <button className="setting-action" disabled>
                  Coming Soon
                </button>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Password</h3>
                  <p>Change your account password</p>
                </div>
                <button className="setting-action" onClick={() => navigate('/reset-password')}>
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-card danger-zone">
            <h2>Danger Zone</h2>
            <div className="setting-item">
              <div className="setting-info">
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all associated data</p>
              </div>
              <button className="danger-btn">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;