import axios from 'axios';
import _ from 'lodash';
import { useState, useEffect } from "react";
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, Link } from "react-router-dom";
import { NavLink } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import SubmitButton from './StyledComponents/SubmitButton';
import FancyInput from './StyledComponents/FancyInput';

export default function LoginForm({ auth, showError, showSuccess, setAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response = await axios.post(`http://localhost:2024/api/users/login`, { email, password }, { withCredentials: true });
      let user = await axios.get(`http://localhost:2024/api/users/${response.data.userId}`, { withCredentials: true });
      console.log(`User ` + JSON.stringify(user.data));
      //console.log(import.meta.env.VITE_API_URL);
      if (response) {
        if (response.status === 200) {
          if (response.data.message == 'Invalid email or password') {
            //setMessage(response.data.message);
            showError(response.data.message);
          } else {
            //setMessage(response.data.message);
            showSuccess(`Welcome back ${user.data.role} ${user.data.givenName}!`);
            console.log(`Auth: ${JSON.stringify(response.data)}`);
            setAuth(response.data);
            localStorage.setItem('auth', JSON.stringify(response.data)); //Save auth to local storage
            navigate('/data');
          }
        }
        else if (response.status === 400) {
          //setMessage(response.data.message);
          showError(response.data.message);
        }
        else if (response.status === 401) {
          //setMessage(response.data.message);
          showError("Incorrect password");
        }
        else {
          showError("Unknown Error");
        }
        //setMessage(response.data.message);
      }
      else {
        showError("Unknown Error");
      }
    } catch (e) {
      if (e.response.status === 401) {
        showError("Incorrect password");
      }
      else if (e.response.status === 400) {
        showError(e.response.data);
      }
      else if (e.response.status === 404) {
        showError("User not found");
      }
      else {
        showError("Unknown Error");
      }
    }
  };

  return (
    <div className="form">
      <h3>Login</h3>
      <form onSubmit={handleSubmit}>
        <label className='label'>Enter Email</label>
        <FancyInput type={"text"} placeholder={"Enter Email"} name={"email"} onChange={(e) => setEmail(e.target.value)} required />
        <label className='label'>Enter Password</label>
        <span className="" onClick={() => setShowPassword(!showPassword)}>
          <i className={`eye input-icon bi ${showPassword === true ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
        </span>
        <div className="">
          <FancyInput type={"password"} showPassword={showPassword} placeholder={"Enter Password"} name={"password"} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        <SubmitButton className="fancyButton" text="Login" displayText={"Login"} />
      </form>
    </div>
  )
};