import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import FancyInput from './StyledComponents/FancyInput';
import SelectButton from './StyledComponents/SubmitButton';
import PuffLoader from "react-spinners/PuffLoader";

export default function UserList({ userCounter, userCounterState, auth, showError, showSuccess, onLogout, setViewState }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [role, setRole] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [sortBy, setSortBy] = useState('');

  const [delay, setDelay] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get('http://localhost:2024/api/users', { withCredentials: true });
        setUsers(data);
        console.log('Fetching Users...');
      } catch (error) {
        console.error(error);
        showError('Error fetching users. Please try again later.');
        onLogout();
      }

      setTimeout(() => {
        setDelay('false');
      }, 500);
    };
    fetchUsers();
  }, [userCounter]);

  const handleConfirmView = async (evt, userId) => {
    evt.preventDefault();
    try {
      const response = await axios.get(`http://localhost:2024/api/users/${userId}`, { withCredentials: true });
      if (response.status === 200 || response.status === 201) {
        setSelectedUser(response.data);
        setViewState(response.data);
      } else {
        showError(`Error: ${response.data?.message || 'User not found'}`);
      }
    } catch (error) {
      console.error(error);
      showError(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleConfirmDelete = async (evt, userId) => {
    evt.preventDefault();
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await axios.delete(`http://localhost:2024/api/users/${userId}`, { withCredentials: true });
        if (response.status === 200 || response.status === 201) {
          showSuccess('User deleted successfully.');
          userCounterState();
        } else {
          showError(`Error: ${response.data?.message || 'User not found'}`);
        }
      } catch (error) {
        console.error(error);
        showError(`Error deleting user: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  async function handleSearch(evt) {
    evt.preventDefault();
    console.log(`Auth Token ${auth?.authToken} keywords ${keywords}`);
    try {
      const { data } = await axios.get(`http://localhost:2024/api/users`, {
        headers: { authorization: `Bearer ${auth?.authToken}` },
        params: { keywords: keywords, role: role, minAge: minAge, maxAge: maxAge, sortBy: sortBy }
      });
      console.log(data);
      // if (data.status === 200 || data.status === 201) {
      setUsers(data);
      console.log("users " + users)
      // } else {
      //   showError(`Error: ${data.data?.message || 'No users found'}`);
      // }
    } catch (error) {
      console.error(error);
      showError(`Error searching users: ${error.response?.data?.message || error.message}`);
    }
  }

  if (!delay) {
    return (
      <div className="container loading">
        <PuffLoader color={"#FFFFFF"} loading={true} size={150} />
      </div>
    )
  }
  else {
    return (
      <div className="list">
        <h3>User List</h3>
        <form className="container" onSubmit={(evt) => handleSearch(evt)}>
          <div className="row">
            <input className="col-6 input searchInput" type="text" id="search" placeholder={"search"} name="search" onChange={(e) => setKeywords(e.target.value)} />
            <select className="col-4 form-select" onChange={(e) => setRole(e.target.value)}>
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="developer">Developer</option>
              <option value="quality analyst">Quality Analyst</option>
              <option value="business analyst">Business Analyst</option>
              <option value="product manager">Product Manager</option>
              <option value="technical manager">Technical Manager</option>
            </select>
          </div>
          <div className="row">
            <label className='col-2 form-input-label'>Min. Age</label>
            <input className='col-2 form-input' type="number" min={0} id="minAge" name="minAge" value={minAge} placeholder='' onChange={(e) => setMinAge(e.target.value)} />
            <label className='col-2 form-input-label'>Max. Age</label>
            <input className='col-2 form-input' type="number" min={0} id="maxAge" name="maxAge" value={maxAge} placeholder='' onChange={(e) => setMaxAge(e.target.value)} />
          </div>
          <div className="row lastRow">
            <label className='col-2 form-input-label'>Sort By</label>
            <select className='col-4 form-select' onChange={(e) => setSortBy(e.target.value)}>
              <option value="givenName">First Name</option>
              <option value="familyName">Last Name</option>
              <option value="role">Role</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <button className="col-2 btn btn-primary searchButton" type="submit">Search</button>
          </div>
        </form>
        {users.length === 0 ? (
          <p>No users available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>View Full Details?</th>
                <th>Delete?</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td className="view" onClick={(e) => handleConfirmView(e, user._id)}>
                    {"View Full Details?"}
                  </td>
                  <td className="delete" onClick={(e) => handleConfirmDelete(e, user._id)}>
                    {"Delete?"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }
}
