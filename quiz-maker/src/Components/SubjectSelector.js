import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SubjectSelector.css';

const SubjectSelector = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    if (selectedSubject) {
      navigate(`/quiz/${selectedSubject}`);
    }
  };

  const subjects = ['Math', 'Science', 'History', 'English', 'Geography'];

  return (
    <div className="subject-selector-container">
      <h2>Select a Subject to Start Quiz</h2>
      <div className="subject-list">
        {subjects.map((subject) => (
          <button
            key={subject}
            className={`subject-button ${selectedSubject === subject ? 'selected' : ''}`}
            onClick={() => setSelectedSubject(subject)}
          >
            {subject}
          </button>
        ))}
      </div>

      {selectedSubject && (
        <button className="start-quiz-button" onClick={handleStartQuiz}>
          Start Quiz
        </button>
      )}
    </div>
  );
};

export default SubjectSelector;
