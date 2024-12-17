import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Navbar({ auth, onLogout, showError }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function getUsers() {
      console.log('Getting to getUsers');
      const newAuth = JSON.parse(localStorage.getItem('auth'));
      console.log("Auth: " + newAuth);
      if (newAuth) {
        try {
          const userId = newAuth.userId;
          const result = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, { withCredentials: true });
          setUser(result.data);
          console.log('User: ' + JSON.stringify(result.data));
          console.log('Role: ' + result.data.role);
        } catch (err) {
          showError('Error fetching users. Please try again later.');
        }
      }
      else {
        console.log('No auth');
        return;
      }
    }
    getUsers();
  }, []);

  function onClickLogout(evt) {
    evt.preventDefault();
    onLogout();
  }

  return (
    <nav className="navbar navbar-dark bg-dark navbar-expand-lg">
      <div className="container-fluid">
        <i className="bi bi-bug"></i>
        <a className="navbar-brand" href="/">Issue Tracker</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink to="/" className='nav-link'>Home</NavLink>
            </li>
            {auth ?
              <>
                <li className="nav-item">
                  <NavLink to="/data" className='nav-link'>Data</NavLink>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={(evt) => onClickLogout(evt)}>Logout</button>
                </li>
                <li className="nav-item user">
                  <p className="nav-link">Permissions: {user ? user.role : "User"}</p>
                </li>
              </> :
              <>
                <li className="nav-item">
                  <NavLink to="/login" className='nav-link'>Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/register" className='nav-link'>Register</NavLink>
                </li>
              </>
            }

          </ul>
        </div>
      </div>
    </nav>
  );
}