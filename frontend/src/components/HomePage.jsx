import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { toast } from 'react-toastify';
import { NavLink } from 'react-router-dom';

export default function HomePage(showError, showSuccess) {
  function checkAuth() {
    const auth = JSON.parse(localStorage.getItem('auth'));
    if (auth) {
      return true;
    }
    else {
      return false;
      // showError('Please log in to access this page');
    }
  }

  return (
    <div className='homePage'>
      <h1>Issue Tracker</h1>
      <p>Welcome to the issue tracker!</p>
      {checkAuth() ? <p>Since you are already logged in, click <NavLink to='/data'>here</NavLink> to view or edit data</p> :
        <p>Please <NavLink to='/login'>log in</NavLink> or <NavLink to='/register'>register</NavLink> to begin</p>}
    </div>
  );
}