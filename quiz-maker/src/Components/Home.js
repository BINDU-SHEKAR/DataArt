import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Loader from './Loader';
import '@fortawesome/fontawesome-free/css/all.min.css'; // ✅ Font Awesome import

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') !== null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.title = 'Home | Quiz Master';
  }, []);

  const handleSignUp = () => navigate('/register');
  const handleSignIn = () => navigate('/login');
  const handleDashboard = () => navigate('/dashboard');
  const handleAboutUs = () => navigate('/aboutus');

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="home-container">
          <div className="split-screen">
            <div className="left-section">
              <div className="logo-text">
                <h1>
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    S
                    <i
                      className="fas fa-graduation-cap"
                      style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '-10px',
                        fontSize: '0.8em',
                        color: '#ffc107',
                        transform: 'rotate(-20deg)'
                      }}
                    ></i>
                  </span>
                  coreMax
                </h1>
              </div>

              <p>
                Your ultimate destination to create quizzes and take quizzes.
                Join us to challenge your knowledge and improve your skills.
              </p>
            </div>

            <div className="right-section">
              <div className="button-container">
                {!isAuthenticated ? (
                  <>
                    <button className="buttons" onClick={handleSignUp}>Sign Up</button>
                    <button className="buttons" onClick={handleSignIn}>Sign In</button>
                  </>
                ) : (
                  <button className="buttons" onClick={handleDashboard}>Go to Dashboard</button>
                )}
                <button className="buttons" onClick={handleAboutUs}>About Us</button>
              </div>
            </div>
          </div>

          <div className="cta-banner">
            <span>Join us today!</span>
            Start your journey with ScoreMax.
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
