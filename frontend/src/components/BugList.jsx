import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import PuffLoader from "react-spinners/PuffLoader";
import { useNavigate } from 'react-router-dom';

export default function BugList({ bugCounter, bugCounterState, auth, showError, showSuccess, onLogout, setViewState }) {
  const navigate = useNavigate();

  const [selectedBug, setSelectedBug] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [classification, setClassification] = useState('');
  const [closed, setClosed] = useState(false);
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [commentCount, setCommentCount] = useState(0);

  const [delay, setDelay] = useState(null);

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const { data } = await axios.get('http://localhost:2024/api/bugs', { withCredentials: true });
        const result = data.filter((bug) => !bug.closed);
        setBugs(result);
        console.log('Fetching Bugs...');
      } catch (error) {
        console.error(error);
        showError('Error fetching bugs. Please try again later.');
        onLogout();
      }

      setTimeout(() => {
        setDelay('false');
      }, 500);
    };
    fetchBugs();
  }, [bugCounter]);

  const handleConfirmView = async (evt, bugId) => {
    evt.preventDefault();
    try {
      const response = await axios.get(`http://localhost:2024/api/bugs/${bugId}`, { withCredentials: true });
      if (response.status === 200 || response.status === 201) {
        setSelectedBug(response.data);
        setViewState(response.data);
      } else {
        showError(`Error: ${response.data?.message || 'Bug not found'}`);
      }
    } catch (error) {
      console.error(error);
      showError(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleConfirmComment = async (evt, bug) => {
    evt.preventDefault();
    if (window.confirm("Would you like to comment or view comments on this bug? (This will take you to a separate page)")) {
      if (localStorage.getItem('bug')) {
        localStorage.removeItem('bug');
      }
      localStorage.setItem('bug', JSON.stringify(bug));
      navigate('/comment');
    };
  }

  const handleConfirmTestCase = async (evt, bug) => {
    evt.preventDefault();
    if (window.confirm("Would you like to add a test case or view test cases on this bug? (This will take you to a separate page)")) {
      if (localStorage.getItem('bug')) {
        localStorage.removeItem('bug');
      }
      localStorage.setItem('bug', JSON.stringify(bug));
      navigate('/testCase');
    };
  }

  const handleConfirmClose = async (evt, bugId) => {
    evt.preventDefault();
    if (window.confirm("Are you sure you want to close this bug?")) {
      try {
        const response = await axios.patch(`http://localhost:2024/api/bugs/${bugId}/close`, { closed: true }, { withCredentials: true });
        if (response.status === 200 || response.status === 201) {
          showSuccess('Bug closed successfully.');
          bugCounterState();
        } else {
          showError(`Error: ${response.data?.message || 'Bug not found'}`);
        }
      } catch (error) {
        console.error(error);
        showError(`Error closing bug: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  async function handleClosed() {
    if (closed === false) {
      setClosed(true);
    }
    else {
      setClosed(false);
    }
  }

  async function handleSearch(evt) {
    evt.preventDefault();
    try {
      const { data } = await axios.get(`http://localhost:2024/api/bugs`, {
        headers: { authorization: `Bearer ${auth?.authToken}` },
        params: { keywords: keywords, classification: classification, closed: closed, minAge: minAge, maxAge: maxAge, sortBy: sortBy }
      });
      // if (data.status === 200 || data.status === 201) {
      setBugs(data);
      console.log("bugs " + bugs)
      // } else {
      //   showError(`Error: ${data.data?.message || 'No bugs found'}`);
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
        <h3>Bug List</h3>
        <form className="container" onSubmit={(evt) => handleSearch(evt)}>
          <div className="row">
            <input className=" col-6 input searchInput" type="text" id="search" placeholder={"search"} name="search" onChange={(e) => setKeywords(e.target.value)} />
            <select className='col-4 form-select' onChange={(e) => setClassification(e.target.value)}>
              <option value="unclassified">Unclassified</option>
              <option value="approved">Approved</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="row">
            <label className='col-2 form-check-label'>Closed?</label>
            <input className='col-2 form-check-input' type="checkbox" id="closed" name="closed" value="closed" onChange={handleClosed} />
            <label className='col-2 form-input-label'>Min. Age</label>
            <input className='col-2 form-input' type="number" id="minAge" name="minAge" min={0} value={minAge} placeholder='' onChange={(e) => setMinAge(e.target.value)} />
            <label className='col-2 form-input-label'>Max. Age</label>
            <input className='col-2 form-input' type="number" id="maxAge" name="maxAge" min={0} value={maxAge} placeholder='' onChange={(e) => setMaxAge(e.target.value)} />
          </div>
          <div className="row lastRow">
            <label className='col-2 form-input-label'>Sort By</label>
            <select className='col-4 form-select' onChange={(e) => setSortBy(e.target.value)}>
              <option value="">Select Sort</option>
              <option value="title">Title</option>
              <option value="classification">Classification</option>
              <option value="assignedTo">Assigned To</option>
              <option value="createdBy">Reported By</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <button className="col-2 btn btn-primary searchButton" type="submit">Search</button>
          </div>
        </form>
        {bugs.length === 0 ? (
          <p>No bugs available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Comment?</th>
                <th>View Test Cases?</th>
                <th>View Full Details?</th>
                <th>Close?</th>
              </tr>
            </thead>
            <tbody>

              {bugs.map((bug) => (

                <tr key={bug._id}>
                  <td>{bug.title}</td>
                  <td className="comment" onClick={(e) => handleConfirmComment(e, bug)}>
                    {`Comment?`}
                  </td>
                  <td className="comment" onClick={(e) => handleConfirmTestCase(e, bug)}>
                    {`View Test Cases?`}
                  </td>
                  <td className="view" onClick={(e) => handleConfirmView(e, bug._id)}>
                    {"View Full Details?"}
                  </td>
                  <td className="delete" onClick={(e) => handleConfirmClose(e, bug._id)}>
                    {"Close?"}
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
