/*      import React, { useEffect, useState } from 'react';

function QuestionBank() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/question-bank')
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error('Error fetching questions:', err));
  }, []);

  return (
    <div>
      <h2>Question Bank</h2>
      {questions.map(q => (
        <div key={q.id} style={{ marginBottom: '1rem' }}>
          <p><strong>Subject:</strong> {q.subject}</p>
          <p><strong>Topic:</strong> {q.topic}</p>
          <p><strong>Question:</strong> {q.questionText}</p>
          <ul>
            {Object.entries(q.options).map(([key, value]) => (
              <li key={key}>{key}: {value}</li>
            ))}
          </ul>
          <p><strong>Answer:</strong> {q.correctAnswer}</p>
        </div>
      ))}
    </div>
  );
}

export default QuestionBank;  */

import React, { useEffect, useState } from 'react';

function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/question-bank')
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        const uniqueSubjects = [...new Set(data.map(q => q.subject))];
        setSubjects(uniqueSubjects);
setFilteredQuestions([]); // default: show nothing
      })
      .catch(err => console.error('Error fetching questions:', err));
  }, []);

  const handleSubjectChange = (e) => {
    const subject = e.target.value;
    setSelectedSubject(subject);
    if (subject === '') {
      setFilteredQuestions(questions);
    } else {
      setFilteredQuestions(questions.filter(q => q.subject === subject));
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: 'auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>📚 Question Bank</h2>

      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <label htmlFor="subject-select" style={{ marginRight: '1rem', fontWeight: 'bold' }}>Filter by Subject:</label>
        <select
          id="subject-select"
          value={selectedSubject}
          onChange={handleSubjectChange}
          style={{ padding: '0.5rem', borderRadius: '6px', fontSize: '1rem' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      {filteredQuestions.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No questions found.</p>
      ) : (
        filteredQuestions.map(q => (
          <div key={q.id} style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p><strong>Subject:</strong> {q.subject}</p>
            <p><strong>Topic:</strong> {q.topic}</p>
            <p><strong>Question:</strong> {q.questionText}</p>
            <ul>
              {q.options.map((opt, idx) => (
                <li key={idx}>{opt}</li>
              ))}
            </ul>
            <p><strong>Answer:</strong> {q.correctAnswer}</p>
            {q.explanation && <p><em>Explanation:</em> {q.explanation}</p>}
          </div>
        ))
      )}
    </div>
  );
}

export default QuestionBank;
