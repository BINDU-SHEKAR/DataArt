import React, { useState } from 'react';

function UploadQuestions() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5000/api/questions/csv', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      setMessage(data.message || 'Upload complete');
    } catch (err) {
      console.error('Upload error:', err);
      setMessage('Upload failed');
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: 'auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>📤 Upload Questions (CSV)</h2>
      <form onSubmit={handleUpload} style={{ textAlign: 'center' }}>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
        <br /><br />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Upload</button>
      </form>
      {message && <p style={{ textAlign: 'center', marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}

export default UploadQuestions;
