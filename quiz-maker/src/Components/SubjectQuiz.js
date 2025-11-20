import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SubjectQuiz.css';

const SubjectQuiz = () => {
  const { subject } = useParams();
  const [questions, setQuestions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const navigate = useNavigate();

  useEffect(() => {
    const generateQuiz = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/quizzes/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ subject })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Quiz generation failed');

        setQuizId(data.quiz_id);

        const quizRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/quizzes/${data.quiz_id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        const quizData = await quizRes.json();
        const parsedQuestions = Array.isArray(quizData.questions)
          ? quizData.questions
          : JSON.parse(quizData.questions);

        setQuestions(parsedQuestions);
      } catch (err) {
        console.error('❌ Failed to generate quiz:', err.message);
      }
    };

    generateQuiz();
  }, [subject]);

  useEffect(() => {
    if (submitted || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, questions]);

  const handleAnswer = (selected) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: selected }));
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (submitted || questions.length === 0) return;

    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++;
    });
    setFinalScore(score);

    const payload = {
      quiz_id: quizId,
      answers: questions.map((q, i) => ({
        question_id: q.question_id,
        selectedOption: answers[i] || null
      })),
      score
    };

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/quizzes/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.msg || 'Submission failed');

      setSubmitted(true);
    } catch (err) {
      console.error('❌ Failed to submit quiz:', err.message);
    }
  };

  if (submitted) {
    return (
      <div className="result-screen">
        <h2>Quiz Completed</h2>
        <p>You scored {finalScore} out of {questions.length}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return <p>Loading questions for {subject}...</p>;
  }

  const current = questions[currentIndex];
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="quiz-screen">
      <h2>{subject} Quiz</h2>
      <p className="timer">Time Left: {minutes}:{seconds}</p>
      <p>Question {currentIndex + 1} of {questions.length}</p>
      <h3>{current.questionText}</h3>
      <div className="options">
        {current.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(opt)}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubjectQuiz;
