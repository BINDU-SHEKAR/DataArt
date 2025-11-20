import React, { useState } from 'react';

function UploadForm() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/http://localhost:5000/api/questions/upload', { method: 'POST', headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },body: formData });
      const contentType = res.headers.get('content-type');

      if (contentType.includes('application/json')) {
        const data = await res.json();
        setStatus(data.msg);
      } else {
        const text = await res.text();
        throw new Error(`Unexpected response: ${text}`);
      }
    } catch (err) {
      setStatus(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div>
      <h2>Upload Questions CSV</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      <p>{status}</p>
    </div>
  );
}

export default UploadForm;


