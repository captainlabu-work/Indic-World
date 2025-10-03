import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../firebase/services';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Profile.css';

const Profile = () => {
  const { currentUser, userData, isAdmin } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [photoURL, setPhotoURL] = useState('');
  const [uploading, setUploading] = useState(false);

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
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

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
      setMessage({ type: 'success', text: 'Profile photo updated successfully! Refreshing...' });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage({ type: 'error', text: `Failed to upload photo: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('Updating profile for user:', currentUser.uid);
      console.log('User data:', userData);

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName });

      // Update Firestore user document
      if (userData?.id) {
        console.log('Using updateUserProfile with ID:', userData.id);
        await userService.updateUserProfile(userData.id, { displayName });
      } else {
        console.log('Using updateUser with UID:', currentUser.uid);
        await userService.updateUser(currentUser.uid, { displayName });
      }

      setMessage({ type: 'success', text: 'Profile updated successfully! Refreshing...' });

      // Reload page to refresh userData
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: `Failed to update profile: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p className="profile-subtitle">Manage your account information</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {photoURL ? (
                <img src={photoURL} alt={displayName || currentUser?.email} className="profile-avatar-img" />
              ) : (
                displayName ? displayName.charAt(0).toUpperCase() : currentUser?.email?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="profile-user-info">
              <h2>{displayName || 'No name set'}</h2>
              <p className="user-email">{currentUser?.email}</p>
              {isAdmin && <span className="admin-badge">Admin</span>}
              <div className="photo-upload-section">
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
              </div>
            </div>
          </div>

          <div className="profile-divider" />

          <form onSubmit={handleUpdateProfile} className="profile-form">
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

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <h3>Account Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{userData?.articlesCount || 0}</div>
              <div className="stat-label">Articles</div>
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
      </div>
    </div>
  );
};

export default Profile;
