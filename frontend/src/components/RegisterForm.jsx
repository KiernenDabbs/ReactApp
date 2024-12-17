import { useState } from "react";
import { toast } from 'react-toastify';
import { useNavigate, Link } from "react-router-dom";
import FancyInput from "./StyledComponents/FancyInput";
import SubmitButton from "./StyledComponents/SubmitButton";
import axios from "axios";

export default function RegisterForm({ showError, showSuccess, onLogin, setAuth }) {
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (event) => {
    // Prevent default form submission
    event.preventDefault();
    registerUser();
  };

  async function registerUser() {
    const fullName = `${givenName} ${familyName}`;
    const role = 'user';
    try {
      // Validate email and password before proceeding
      if (!email.includes('@') || !email.includes('.')) {
        showError('Invalid email format.');
        return;
      }
      if (password.length < 8) {
        showError('Password must be at least 8 characters.');
        return;
      }

      console.log('Register User function hit');
      const response = await axios.post(`http://localhost:2024/api/users`, { givenName, familyName, fullName, email, password, role }, { withCredentials: true });
      console.log('Response:', response);
      if (response.status === 200 || response.status === 201) {
        console.log(response.data);
        showSuccess(response.data.message);
        setAuth(response.data);
        localStorage.setItem('auth', JSON.stringify(response.data)); //Save auth to local storage
        navigate('/data');
      } else {
        console.error('Error: user already exists', response.status);
        showError(`Error: ${response.data.message || 'User already exists'}`);
      }
    } catch (error) {
      console.error('Error:', error.message);
      showError(`Error: ${error.response?.data?.message || error.message}`);
    }
  }

  return (
    <div className="form">
      <h3>Register</h3>
      <form onSubmit={handleSubmit}>
        <label className="label">Enter First and Last Name</label>
        <div className="flex">
          <FancyInput type="text" placeholder="First Name" name="givenName" onChange={(e) => setGivenName(e.target.value)} required />
          <FancyInput type="text" placeholder="Last Name" name="familyName" onChange={(e) => setFamilyName(e.target.value)} required />
        </div>
        <label className="label">Enter Email</label>
        <FancyInput type="text" placeholder="Enter Email" name="email" onChange={(e) => setEmail(e.target.value)} required />
        <label className="label">Enter Password</label>
        <span className="" onClick={() => setShowPassword(!showPassword)}>
          <i className={`eye input-icon bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
        </span>
        <div className="">
          <FancyInput type={showPassword ? 'text' : 'password'} placeholder="Enter Password" name="password" onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        <SubmitButton className="fancyButton" text="Register" displayText="Register" />
      </form>
    </div>
  );
}
