import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QuizDetails.css';
import Layout from './Layout';

const QuizDetails = () => {
  const navigate = useNavigate();
  document.title = 'Details Page | ScoreMax';

  const { quiz_id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);

  // Check user is logged in
  if (!localStorage.getItem('token')) {
    const pathURL = window.location.pathname.split("/").join('/').substring(1);
    localStorage.setItem("attemptedRoute", JSON.stringify({ pathURL }));
    window.location.href = "/login";
  }
  

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const url = `${process.env.REACT_APP_BACKEND_URL}/quizzes/details/${quiz_id}`;
        const response = await fetch(url, {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
          },
        });
        const data = await response.json();
        if (response.ok) {
          setQuiz(data);
        } else {
          alert(data.msg);
        }
      } catch (error) {
        console.error('Error fetching quiz details:', error);
      }
    };

    fetchQuiz();
  }, [quiz_id]);
  

  const handleDelete = async () => {
    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/quizzes/delete/${quiz_id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'x-auth-token': localStorage.getItem('token'),
        },
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.msg);
        navigate('/dashboard');
      } else {
        alert(data.msg);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/edit-quiz/${quiz_id}`);
  };

  const handleTakeTest = () => {
    navigate(`/attempt/${quiz_id}`);
  };

  if (!quiz) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="quiz-details">
        <div className="buttons">
          <button onClick={() => setShowConfirmEdit(true)}>Edit Quiz</button>
          <button onClick={() => setShowConfirmDelete(true)}>Delete Quiz</button>
          {quiz.numberOfParticipants > 0 && (
            <button onClick={() => navigate(`/result/${quiz_id}`)}>See Stats</button>
          )}
          <button onClick={handleTakeTest} aria-label={`Take test for ${quiz.title}`}>
            Take Test
          </button>
        </div>

        <h2>{quiz.title}</h2>
        <p><strong>Time Limit:</strong> {quiz.timeLimit} minutes</p>
        <p><strong>Last Updated:</strong> {new Date(quiz.lastUpdated).toLocaleString()}</p>
        <p><strong>Number of Participants:</strong> {quiz.numberOfParticipants}</p>
        <p><strong>Quiz Id:</strong> {quiz.quiz_id}</p>

        <div className="questions">
          {quiz.questions?.map((question, index) => (
  question.questionText && question.options?.length > 0 ? (
    <div key={question.question_id} className="question-card">
      <h4>Question {index + 1}</h4>
      <p>{question.questionText}</p>
      <ul>
  {question.options.map((option, i) => {
    const isSelected = option === question.selectedOption;
    const isCorrect = option === question.correctAnswer;
    return (
      <li key={i} style={{
        backgroundColor: isSelected ? '#fff3cd' : '',
        border: isCorrect ? '2px solid green' : ''
      }}>
        {option}
        {isSelected && <span> ✅ Selected</span>}
        {isCorrect && <span> ✔️ Correct</span>}
      </li>
    );
  })}
</ul>
<p><strong>Selected Answer:</strong> {question.selectedOption || 'Not answered'}</p>
<p><strong>Correct Answer:</strong> {question.correctAnswer}</p>

    </div>
  ) : null
))}

        </div>

        {showConfirmDelete && (
          <div className="confirm-popup">
            <p>Are you sure you want to delete this quiz?</p>
            <button onClick={handleDelete}>Yes</button>
            <button onClick={() => setShowConfirmDelete(false)}>No</button>
          </div>
        )}

        {showConfirmEdit && (
          <div className="confirm-popup">
            <p>Are you sure you want to edit this quiz?</p>
            <button onClick={handleEdit}>Yes</button>
            <button onClick={() => setShowConfirmEdit(false)}>No</button>
          </div>
        )}
      </div>
    </Layout>
  );
};



export default QuizDetails;
