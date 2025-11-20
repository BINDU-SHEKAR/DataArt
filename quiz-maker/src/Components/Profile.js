import React, { useEffect, useState } from 'react';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

const Profile = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/me`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch user data');

        setUsername(data.username);
        setEmail(data.email);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, []);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUsernameError('');

    if (!newUsername.trim() || newUsername.length < 6 || newUsername.includes(' ')) {
      setUsernameError('Username must be at least 6 characters and contain no spaces.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/update-username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ username: newUsername }),
      });

      const data = await response.json();
      if (!response.ok) {
        setUsernameError(data.msg || 'Failed to update username.');
      } else {
        alert('Username updated successfully');
        setUsername(newUsername);
        setNewUsername('');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setUsernameError('Error updating username. Please try again.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmPasswordError('');
    setOldPasswordError('');

    if (!passwordRegex.test(password)) {
      setPasswordError('Password must include uppercase, lowercase, and a number.');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ oldPassword, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.msg === 'Invalid old password') {
          setOldPasswordError(data.msg);
        } else {
          setPasswordError(data.msg || 'Failed to update password.');
        }
      } else {
        alert('Password updated successfully');
        setOldPassword('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError('Error updating password. Please try again.');
    }
  };

  return (
    <div className="profile">
      <h2>Profile</h2>
      <div className="profile-info">
        <div className="profile-detail">
          <span className="profile-label">Username:</span>
          <span className="profile-value">{username}</span>
        </div>
        <div className="profile-detail">
          <span className="profile-label">Email:</span>
          <span className="profile-value">{email}</span>
        </div>
      </div>

      <div className="profile-forms">
        <div className="profile-card">
          <form className="profile-form" onSubmit={handleUsernameSubmit}>
            <h3>Update Username</h3>
            <div className="form-group">
              <label htmlFor="newUsername">New Username:</label>
              <input
                type="text"
                id="newUsername"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
              {usernameError && <p className="error">{usernameError}</p>}
            </div>
            <button type="submit">Update Username</button>
          </form>
        </div>

        <div className="profile-card">
          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            <h3>Update Password</h3>
            <div className="form-group">
              <label htmlFor="oldPassword">Old Password:</label>
              <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              {oldPasswordError && <p className="error">{oldPasswordError}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="password">New Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {passwordError && <p className="error">{passwordError}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPasswordError && <p className="error">{confirmPasswordError}</p>}
            </div>
            <button type="submit">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
