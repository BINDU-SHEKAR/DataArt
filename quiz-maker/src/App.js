import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

// Core Components
import Header from "./Components/Header";
import Home from "./Components/Home";
import Authorisation from "./Components/Authorisation";
import Register from "./Components/Register";
import Dashboard from "./Components/DashBoard";
import ResultPage from "./Components/Resultpage";
import QuizDetails from "./Components/QuizDetails";
import EditQuiz from "./Components/EditQuiz";
import TestPage from "./Components/TestPage";
import ForgotPassword from "./Components/ForGotPassword";
import ResetPassword from "./Components/ResetPassword";
import Aboutus from "./Components/Aboutus";
import Formulas from "./Components/Formulas";
import QuestionBank from "./Components/QuestionBank";
import SubjectQuiz from "./Components/SubjectQuiz";
import UploadQues from "./Components/AddQues";
import UploadPage from "./pages/UploadPage";
import Login from './Components/Login';



// Helper to check admin role
const isAdmin = () => localStorage.getItem("role") === "admin";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Authorisation />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/aboutus" element={<Aboutus />} />
<Route path="/login" element={<Login />} />

        {/* Admin-only Routes */}
        {isAdmin() && (
          <>
            <Route path="/upload" element={<UploadPage />} /> {/* ✅ CSV Upload Page */}
            <Route path="/admin/upload-questions" element={<UploadQues />} /> {/* ✅ Manual Add Questions */}
            <Route path="*" element={<Navigate to="/upload" />} /> {/* ✅ Redirect unknown admin routes */}
          </>
        )}

        {/* Student Routes */}
        {!isAdmin() && (
          <>
            <Route path="/formulas" element={<Formulas />} />
            <Route path="/question-bank" element={<QuestionBank />} />
            <Route path="/take-quiz/:subject" element={<SubjectQuiz />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-tests" element={<Dashboard />} />
            <Route path="/my-results" element={<Dashboard />} />
            <Route path="/take-test" element={<Dashboard />} />
            <Route path="/profile" element={<Dashboard />} />
            <Route path="/result/:quiz_id" element={<ResultPage />} />
            <Route path="/quiz/:quiz_id" element={<QuizDetails />} />
            <Route path="/edit-quiz/:quiz_id" element={<EditQuiz />} />
            <Route path="/attempt/:quiz_id" element={<TestPage />} />
            <Route path="*" element={<Home />} /> {/* ✅ Redirect unknown student routes */}
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
