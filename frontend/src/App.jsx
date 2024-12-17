import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles.css';
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
function showError(message) {
  toast(message, { type: 'error', position: 'bottom-right' });
}
function showSuccess(message) {
  toast(message, { type: 'success', position: 'bottom-right' });
}
import 'react-toastify/dist/ReactToastify.min.css';
import HomePage from './components/HomePage.jsx';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import DataDisplay from './components/dataDisplay.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Comment from './components/Comment.jsx';
import TestCase from './components/TestCase.jsx';

//Start main function here
export default function App() {
  const [auth, setAuth] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem('auth'));
    console.log("Auth: " + JSON.stringify(auth));
    if (auth) {
      setAuth(auth);
    }
  }, []);

  function onLogin(auth) {
    console.log(`Logged in! ${auth}`);
    setAuth(auth);
    navigate('./');
    showSuccess('Logged in!');
  }

  function onLogout() {
    setAuth(null);
    navigate('/login');
    showSuccess('Logged out!');
    document.cookie = "authToken=; max-age=0; path=/";
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth');
  }

  return (
    <>
      <ToastContainer />
      <Navbar auth={auth} onLogout={onLogout} />
      <div className='mainContent'>
        <Routes>
          <Route path="/" element={<HomePage auth={auth} setAuth={setAuth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/login" element={<LoginForm auth={auth} setAuth={setAuth} showError={showError} showSuccess={showSuccess} onLogIn={onLogin} onLogout={onLogout} />} />
          <Route path="/register" element={<RegisterForm auth={auth} setAuth={setAuth} showError={showError} showSuccess={showSuccess} onLogIn={onLogin} onLogout={onLogout} />} />
          <Route path="/data" element={<DataDisplay auth={auth} setAuth={setAuth} showError={showError} showSuccess={showSuccess} onLogout={onLogout} />} />
          <Route path="/comment" element={<Comment auth={auth} setAuth={setAuth} showError={showError} showSuccess={showSuccess} onLogout={onLogout} />} />
          <Route path="/testCase" element={<TestCase auth={auth} setAuth={setAuth} showError={showError} showSuccess={showSuccess} onLogout={onLogout} />} />
          {/* default redirect to home page */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <Footer />
    </>
  )
}