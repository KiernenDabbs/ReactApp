import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PuffLoader } from "react-spinners/PuffLoader";
import SubmitButton from "./StyledComponents/SubmitButton";

export default function TestCase({ auth, showError, showSuccess, onLogout }) {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);
  const [testCases, setTestCases] = useState([]); // New state to hold test cases
  const [loading, setLoading] = useState(true); // New state to handle loading status
  const [status, setStatus] = useState(''); // New state to hold test case content
  const [delay, setDelay] = useState(null);
  const [displayCounter, setDisplayCounter] = useState(0);

  let bug = localStorage.getItem('bug');
  bug = JSON.parse(bug);

  useEffect(() => {
    const fetchTestCases = async () => {
      try {
        const response = await axios.get(`http://localhost:2024/api/bugs/${bug._id}/tests`, { withCredentials: true });
        console.log("response: " + JSON.stringify(response.data));
        setTestCases(response.data);
        setLoading(false);

        setTimeout(() => {
          setDelay('false');
        }, 500);
      } catch (error) {
        showError("Failed to load test cases");
        console.error("error: " + error);
        setLoading(false);
      }
    };

    fetchTestCases();
  }, [displayCounter]);

  async function handleSubmit(event) {
    try {
      event.preventDefault();

      let addedBy = auth.userId;
      console.log("Status: " + status);
      console.log("Added by: " + addedBy);

      console.log("Getting to axios post");
      const response = await axios.post(`http://localhost:2024/api/bugs/${bug._id}/tests`, { status: status, author: addedBy }, { withCredentials: true });
      console.log("Past axios post");
      if (response.status === 200 || response.status === 201) {
        showSuccess("Test case added successfully");
        setStatus('');
        document.getElementsByName('status')[0].value = '';
        setDisplayCounter(displayCounter + 1);
        navigate('/testCase');
      } else {
        showError(`Error: ${response.data?.message || 'Failed to add test case'}`);
      }
    } catch (error) {
      if (error.response.status === 403) {
        showError("Unauthorized!");
      }
      else {
        console.log("Error: " + error);
        showError(`Error: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  return (
    <div className="commentPage container">
      <div className="row returnButton">
        <button onClick={() => navigate('/data')}>Return to Data Display</button>
      </div>
      <div className="row">
        <main className="commentForm col-5">
          <h3 className="bugTitle">Test Cases for Bug: &quot;{bug.title}&quot;</h3>
          {loading ? (
            <p>Loading test cases:</p>
          ) : testCases.length > 0 ? (
            testCases.map((testCase) => (
              <div key={testCase._id} className="showComment row">
                {console.log("test case: " + JSON.stringify(testCase))}
                {testCase.status && <p>{testCase.status}</p>}
                {testCase.addedBy && <p>Author: {testCase.addedBy}</p>}
                {testCase.author && <p>Author: {testCase.author}</p>}
              </div>
            ))
          ) : (
            <p>No test cases found</p>
          )}
        </main>
        <aside className="testCaseForm col-5">
          <h3 className="bugTitle">Add Test Case</h3>
          <form onSubmit={handleSubmit}>
            <label htmlFor="testCase">Status:</label><br />
            <select className="form-select" id="status" name="status" onChange={(e) => setStatus(e.target.value)}>
              <option value={"pending"}>Pending</option>
              <option value={"failed"}>Failed</option>
              <option value={"passed"}>Passed</option>
            </select>
            <button type="submit">Submit</button>
            {/* <SubmitButton className="fancyButton" text="Add Comment" displayText={"Add Comment"} /> */}
          </form>
        </aside>
      </div>
    </div>
  );
}
