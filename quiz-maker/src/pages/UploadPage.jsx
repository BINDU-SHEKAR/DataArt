import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import './UploadPage.css';

const UploadPage = () => {
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setErrors([]);
    setQuestions([]);

   Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    const normalized = results.data.map((row, index) => {
      console.log(`Row ${index + 1} raw options:`, row.options);

      let parsedOptions = [];
      try {
        parsedOptions = Array.isArray(row.options)
          ? row.options
          : typeof row.options === 'string'
            ? JSON.parse(row.options)
            : [];
      } catch (err) {
        console.error(`Row ${index + 1} failed to parse options:`, err.message);
        parsedOptions = [];
      }

      console.log(`Row ${index + 1} parsed options:`, parsedOptions);

      return {
        questionText: row.questionText || row.questionT,
        correctAnswer: row.correctAnswer || row.correctAns,
        subject: row.subject,
        topic: row.topic,
        options: parsedOptions
      };
    });

    setQuestions(normalized);
  }
});


  };

  const handleUpload = async () => {
    const fileInput = document.getElementById('csvFile');
    if (!fileInput.files.length) {
      alert('Please select a CSV file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
      const response = await axios.post('http://localhost:5000/api/questions/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': localStorage.getItem('token')
        }
      });

      setErrors(Array.isArray(response.data.errors) ? response.data.errors : []);
      alert(`✅ Uploaded ${response.data.inserted} questions\n`);
    } catch (err) {
      console.error('❌ Upload error:', err.response?.data || err.message);
      alert('Upload failed: ' + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Questions (CSV)</h2>
      <input type="file" id="csvFile" accept=".csv" onChange={handleFileChange} />
      {fileName && <p>Selected: {fileName}</p>}
      {questions.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Options</th>
                <th>Correct</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
  {questions.map((q, i) => {
    let parsedOptions = [];
    try {
      if (Array.isArray(q.options)) {
        parsedOptions = q.options;
      } else if (typeof q.options === 'string') {
        const parsed = JSON.parse(q.options);
        parsedOptions = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      parsedOptions = [];
    }

    return (
      <tr key={i}>
        <td>{q.questionText}</td>
        <td>{parsedOptions.length > 0 ? parsedOptions.join(', ') : 'No options'}</td>
        <td>{q.correctAnswer}</td>
        <td>{q.subject}</td>
      </tr>
    );
  })}
</tbody>


          </table>
          <button onClick={handleUpload}>Upload to Server</button>
        </>
      )}
      {errors.length > 0 && (
        <div className="error-log">
          <h4>Errors:</h4>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e.error} in row: {JSON.stringify(e.row)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
