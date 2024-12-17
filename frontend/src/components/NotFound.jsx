import React from "react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function NotFound() {
  return (
    <div className='notFound'>
      <h1>404 Not Found</h1>
      <p>Sorry, the page you are looking for does not exist</p>
      <p>Click <NavLink to='/'>here</NavLink> to return to the home page</p>
    </div>
  );
}