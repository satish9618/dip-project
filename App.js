import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function App() {
  const [activeSection, setActiveSection] = useState('surveillance');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [movementDetected, setMovementDetected] = useState(false); // Track movement detection status

  // Handle user form submission to add a new user
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    try {
      await addDoc(collection(db, 'contacts'), {
        name,
        phone_number: phone,
      });
      alert('User added!');
      setName('');
      setPhone('');
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
    }
  };

  // Fetch users from the database
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'contacts'));
    const fetchedUsers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(fetchedUsers);
  };

  // Handle video upload and processing for movement detection
  const handleVideoUpload = async () => {
    if (!selectedVideo) return;

    const formData = new FormData();
    formData.append('file', selectedVideo); // Ensure the field name is 'file'

    try {
      setUploadStatus('⏳ Uploading and processing...');
      const response = await fetch('http://localhost:8000/upload-video/', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.status === 'success') {
        setUploadStatus('✅ Video processed. Alert sent if suspicious activity was detected.');
        if (result.movement_detected) {
          setMovementDetected(true); // Trigger the alert if movement is detected
        } else {
          setMovementDetected(false); // Reset if no movement detected
        }
      } else {
        setUploadStatus('⚠️ Processing failed: ' + result.message);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('❌ Error uploading video.');
    }
  };

  // Fetch users on initial render
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container">
      <h1 className="title">Drishti Raksha – Admin Portal</h1>

      <div className="nav-buttons">
        <button
          className={activeSection === 'surveillance' ? 'active' : ''}
          onClick={() => setActiveSection('surveillance')}
        >
          📹 Surveillance
        </button>
        <button
          className={activeSection === 'users' ? 'active' : ''}
          onClick={() => setActiveSection('users')}
        >
          🧑‍💼 Registered Users
        </button>
      </div>

      {activeSection === 'surveillance' && (
        <section className="card">
          <h2>📹 Surveillance</h2>
          <p>Upload a video to scan for suspicious activity:</p>
          
          {/* File input for selecting a video */}
          <input 
            type="file" 
            accept="video/*" 
            onChange={(e) => setSelectedVideo(e.target.files[0])} 
          />
          
          {/* Video playback if a file is selected */}
          {selectedVideo && (
            <div className="video-container">
              <h3>Preview Video:</h3>
              <video width="100%" controls>
                <source src={URL.createObjectURL(selectedVideo)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          <button 
            disabled={!selectedVideo} 
            onClick={handleVideoUpload} 
            className="upload-button"
          >
            🔍 Analyze Video
          </button>

          {uploadStatus && <p>{uploadStatus}</p>}

          {/* Display "MOVEMENT DETECTED" if movement is detected */}
          {movementDetected && (
            <div className="alert">
              <h3 style={{ color: 'red', fontSize: '24px', fontWeight: 'bold' }}>
                🚨 MOVEMENT DETECTED 🚨
              </h3>
            </div>
          )}
        </section>
      )}

      {activeSection === 'users' && (
        <section className="card">
          <h2>🧑‍💼 Register New User</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Name:
              <input
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Phone Number:
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <button type="submit">Add User</button>
          </form>

          <h3>📋 Registered Users</h3>
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                {user.name} – {user.phone_number}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="alert-button-wrapper">
        <button
          className="alert-button"
          onClick={() => alert('🚨 Alert Triggered!')}
        >
          🚨 Send Alert
        </button>
      </div>
    </div>
  );
}

export default App;
