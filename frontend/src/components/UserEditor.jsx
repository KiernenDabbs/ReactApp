import { find } from "lodash";
import { useState } from "react";
import axios from 'axios';
import FancyInput from './StyledComponents/FancyInput';
import SubmitButton from './StyledComponents/SubmitButton';
import { useNavigate } from 'react-router-dom';

export default function UserEditor({ userCounterState, listState, bugListState, userListState, showError, showSuccess }) {
  const navigate = useNavigate();

  let state = 'start';
  const [displayState, setDisplayState] = useState('start');
  const [id, setId] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    // Prevent default form submission
    event.preventDefault();
    console.log('Email:', email);
    setDisplayState('start');

    if (givenName !== '' || familyName !== '' || email !== '' || password !== '' || role !== '') {
      state = 'ready';
    }

    if (state === 'ready') {
      if (id === '') {
        addUser();
      }
      else {
        editUser();
      }
    }
    else {
      showError('Must complete at least one valid field!');
      return;
    }
  };

  async function addUser() {
    console.log('Getting to the addUser function');
    //await setId(userArray.length + 1);
    if (givenName === '' || familyName === '' || email === '' || password === '' || role === '') {
      showError('Must complete all fields!');
      return;
    }
    else {
      const fullName = `${givenName} ${familyName}`;
      const role = 'user';
      const axiosResult = await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, { email, password, fullName, givenName, familyName, role }, { withCredentials: true });
      console.log(axiosResult.data.message);
      if (axiosResult.data.message) {
        showSuccess('User added!');
      }

      userCounterState();
      state = 'done';
    }
  }

  async function editUser() {
    console.log('Getting to the editUser function');
    try {
      const result = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${id}`);
      let newGivenName;
      let newFamilyName;
      let newPassword;
      let newRole;
      if (result.data) {
        newGivenName = result.data.givenName;
        newFamilyName = result.data.familyName;
        newPassword = result.data.password;
        newRole = result.data.role;
      }
      if (!result.data) {
        showError('User not found!');
        setDisplayState('invalid');
        return;
      }
      else {
        if (givenName === '' && familyName === '' && password === '' && role === '') {
          showError('Must complete at least one valid field!');
          return;
        }
        else {
          if (givenName !== '') {
            newGivenName = givenName;
          }
          if (familyName !== '') {
            newFamilyName = familyName;
          }
          if (password !== '') {
            newPassword = password;
          }
          if (role !== '') {
            newRole = role;
          }
          let newFullName = `${newGivenName} ${newFamilyName}`

          console.log('Getting to the patch');
          let result = await axios.patch(`http://localhost:2024/api/users/${id}`, { password: newPassword, fullName: newFullName, givenName: newGivenName, familyName: newFamilyName, role: newRole }, { withCredentials: true });
          showSuccess(`User ${id} edited!`);
          console.log(result.data);

          userCounterState();
          navigate('/data');
          state = 'done';
        }
      }
    }
    catch (err) {
      if (err.response.status === 404) {
        showError('User not found!');
        console.log(JSON.stringify(err));
        setDisplayState('invalid');
        return;
      }
      else if (err.response.status === 400) {
        showError("Error: " + JSON.stringify(err.response.data.message));
        console.log("Error: " + JSON.stringify(err));
        return;
      }
      else if (err.response.status === 403) {
        showError('Unauthorized!');
        console.log(JSON.stringify(err));
        return;
      }
      else if (err.response.status === 500) {
        showError('Server error!');
        console.log(JSON.stringify(err));
        return;
      }
      else {
        showError('User not found!');
        console.log(JSON.stringify(err));
        setDisplayState('invalid');
        return;
      }
    }
  }

  // function clearForm() {
  //   setId('');
  //   setGivenName('');
  //   setFamilyName('');
  //   setEmail('');
  //   setPassword('');
  //   document.getElementsByName('userId')[0].value = '';
  //   document.getElementsByName('givenName')[0].value = '';
  //   document.getElementsByName('familyName')[0].value = '';
  //   document.getElementsByName('email')[0].value = '';
  //   document.getElementsByName('password')[0].value = '';
  // }

  return (
    <div className="inputField">
      <h3>Add/Edit User</h3>
      <form onSubmit={handleSubmit}>
        <label>Leave ID blank to create a new user, enter correct ID to edit existing user</label>
        <label className='label'>Enter User ID</label>
        <FancyInput type={"text"} placeholder={"Enter User ID"} name={"userId"} onChange={(e) => setId(e.target.value)} />
        <br />
        <label className='label'>Enter New First and/or Last Name</label>
        <div className="flex">
          <FancyInput type={"text"} placeholder={"First Name"} name={"givenName"} onChange={(e) => setGivenName(e.target.value)} />
          <FancyInput type={"text"} placeholder={"Last Name"} name={"familyName"} onChange={(e) => setFamilyName(e.target.value)} />
        </div>
        <label className='label'>Enter New Email (For user creation only)</label>
        <FancyInput type={"text"} placeholder={"Enter New Email"} name={"email"} onChange={(e) => setEmail(e.target.value)} />
        <label className='label'>Enter New Password</label>
        <span className="" onClick={() => setShowPassword(!showPassword)}>
          <i className={`eye input-icon bi ${showPassword === true ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
        </span>
        <div className="">
          <FancyInput type={"password"} showPassword={showPassword} placeholder={"Enter New Password"} name={"password"} onChange={(e) => setPassword(e.target.value)} minLength={8} />
        </div>
        <div className="input-group mb-3">
          <span className="selectLabel input-group-text">Assign Role: </span>
          <select className="select form-select" id="classify" name="classify" onChange={(e) => setRole(e.target.value)}>
            <option value={''}>Unassigned</option>
            <option value={"user"}>User</option>
            <option value={"developer"}>Developer</option>
            <option value={"quality analyst"}>Quality Analyst</option>
            <option value={"business analyst"}>Business Analyst</option>
            <option value={"product manager"}>Product Manager</option>
            <option value={"technical manager"}>Technical Manager</option>
          </select>
        </div>
        <SubmitButton className="fancyButton" text="Edit User" displayText={"Edit User"} />
      </form>
      {displayState === 'invalid' && <div><p className="error">User not found!</p></div>}
    </div>
  )
};