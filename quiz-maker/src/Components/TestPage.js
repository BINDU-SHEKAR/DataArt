/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './TestPage.css';
import { FaArrowLeft } from 'react-icons/fa';

const TakeTestPage = () => {
  const { quiz_id } = useParams();
  const [status, setStatus] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [progress, setProgress] = useState({ answers: [] });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timer, setTimer] = useState(null);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const navigate = useNavigate();

  const progressRef = useRef(progress);
  const elapsedTimeRef = useRef(elapsedTime);

  useEffect(() => {
    const pathURL = window.location.pathname.split("/").join('/').substring(1);
    if (!localStorage.getItem("token")) {
      localStorage.setItem("attemptedRoute", JSON.stringify({ pathURL }));
      window.location.href = "/login";
    }

    const fetchStatus = async () => {
  try {
    const url = `${process.env.REACT_APP_BACKEND_URL}/quizzes/status/${quiz_id}`;
    const response = await fetch(url, {
      headers: { 'x-auth-token': localStorage.getItem('token') },
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType.includes('application/json')) {
      const errorText = await response.text();
      throw new Error(`Server error: ${errorText}`);
    }

    const data = await response.json();
    setStatus(data.status);
  } catch (err) {
    console.error(err);
    setError('Error fetching quiz status');
  }
};


    fetchStatus();
  }, [quiz_id]);

  const fetchQuiz = async () => {
    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/quizzes/take/${quiz_id}`;
      const response = await fetch(url, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });
      const text = await response.text();
      const data = JSON.parse(text);
      setQuiz(data);
    } catch (err) {
      console.error(err);
      setError('Error fetching quiz');
    }
  };

  const fetchProgress = async () => {
    try {
      await fetchQuiz();
      const url = `${process.env.REACT_APP_BACKEND_URL}/quizzes/progress/${quiz_id}`;
      const response = await fetch(url, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });
      const text = await response.text();
      const data = JSON.parse(text);
      setProgress(data);
      setElapsedTime(data.elapsedTime);
    } catch (err) {
      console.error(err);
      setError('Error fetching progress');
    }
  };

  const handleConfirm = () => {
    setConfirmation(true);
    if (status === 'In progress') {
      fetchProgress();
    } else {
      fetchQuiz();
    }
  };

  const handleSubmit = async () => {
    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/quizzes/take/${quiz_id}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ answers: progress?.answers || [] }),
      });
      if (!response.ok) throw new Error('Submission failed');
      navigate(`/result/${quiz_id}`);
    } catch (err) {
      console.error(err);
      setError('Error submitting quiz');
    }
  };

  const autoSaveProgress = async () => {
    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/quizzes/progress/${quiz_id}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({
          answers: progressRef.current?.answers || [],
          elapsedTime: elapsedTimeRef.current,
        }),
      });
      if (!response.ok) throw new Error('Error saving progress');
    } catch (err) {
      console.error(err);
      setError('Error saving progress');
    }
  };

  useEffect(() => {
    progressRef.current = progress;
    elapsedTimeRef.current = elapsedTime;
  }, [progress, elapsedTime]);

  useEffect(() => {
    if (confirmation && quiz) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      setTimer(interval);
      return () => clearInterval(interval);
    }
  }, [confirmation, quiz]);

  useEffect(() => {
    if (confirmation && quiz) {
      const interval = setInterval(() => {
        autoSaveProgress();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [confirmation, quiz]);

  useEffect(() => {
    if (elapsedTime >= quiz?.timeLimit * 60) {
      clearInterval(timer);
      handleSubmit();
    }
  }, [elapsedTime, quiz]);

  const handleOptionChange = (questionId, selectedOption) => {
    const newAnswers = [...progress.answers];
    const index = newAnswers.findIndex(a => a.question_id === questionId);
    if (index === -1) {
      newAnswers.push({ question_id: questionId, selectedOption });
    } else {
      newAnswers[index].selectedOption = selectedOption;
    }
    setProgress({ answers: newAnswers });
  };

  const BackToDashBoard = () => navigate(`/dashboard`);

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (error) return <div className="error">{error}</div>;

  if (status === "Taken") {
    return (
      <div className='taken-info'>
        <p>You have already attempted this Quiz</p>
        <button className='taken-info-btn' onClick={BackToDashBoard}>
          <FaArrowLeft style={{ marginRight: '10px' }} />
          Go To DashBoard
        </button>
      </div>
    );
  }


 return (
  <div className="take-test">
    <h2>{quiz?.title}</h2>
    <div className="test-info">
      <p>Status: {status}</p>
      {confirmation && quiz && (
        <div className="countdown-timer">
          <h3>Time Left:</h3>
          <div className="time-unit">{formatTime(quiz.timeLimit * 60 - elapsedTime)}</div>
        </div>
      )}
    </div>

    {(status === "Not taken" || status === "In progress") && !confirmation && (
      <div className="instructions">
        <h3>Quiz Instructions</h3>
        <ul>
          <li>Ensure you have a stable internet connection.</li>
          <li>You cannot pause the quiz once started.</li>
          <li>Answer all questions to the best of your knowledge.</li>
          <li>The timer will start as soon as you confirm the instructions.</li>
        </ul>
        <button className="button" onClick={handleConfirm}>I Understand, Start Quiz</button>
      </div>
    )}

    {confirmation && quiz && Array.isArray(quiz.questions) && (
      <div className="take-quiz">
        {quiz.questions.map((question, index) => (
          <div key={question._id} className="question-card">
            <h4>Question {index + 1}</h4>
            <p className="question">{question.question}</p>
            {question.options.map((option) => {
              const checkboxId = `cbx-${question._id}-${option}`;
              return (
                <div key={option} className="option-group">
                  <div className="checkbox-wrapper-12">
                    <div className="cbx">
                      <input
                        id={checkboxId}
                        type="checkbox"
                        name={`question-${question._id}`}
                        value={option}
                        checked={
                          progress?.answers?.find(a => a.question_id === question._id)?.selectedOption === option
                        }
                        onChange={() => handleOptionChange(question._id, option)}
                      />
                      <label htmlFor={checkboxId}></label>
                      <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
                        <path d="M2 8.36364L6.23077 12L13 2"></path>
                      </svg>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
                      <defs>
                        <filter id="goo-12">
                          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7" result="goo-12" />
                          <feBlend in="SourceGraphic" in2="goo-12" />
                        </filter>
                      </defs>
                    </svg>
                  </div>
                  <label htmlFor={checkboxId} className="option-label">{option}</label>
                </div>
              );
            })}
          </div>
        ))}
        <span id="button-bg">
          <button className="button" onClick={handleSubmit}>
            Submit Quiz
          </button>
        </span>
      </div>
    )}
  </div>
);
};

export default TakeTestPage;
