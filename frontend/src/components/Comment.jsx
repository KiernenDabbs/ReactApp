import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PuffLoader } from "react-spinners/PuffLoader";
import SubmitButton from "./StyledComponents/SubmitButton";

export default function Comment({ auth, showError, showSuccess, onLogout }) {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);
  const [comments, setComments] = useState([]); // New state to hold comments
  const [loading, setLoading] = useState(true); // New state to handle loading status
  const [content, setContent] = useState(''); // New state to hold comment content
  const [delay, setDelay] = useState(null);
  const [displayCounter, setDisplayCounter] = useState(0);

  let bug = localStorage.getItem('bug');
  bug = JSON.parse(bug);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:2024/api/bugs/${bug._id}/comments`, { withCredentials: true });
        console.log("response: " + response.data);
        setComments(response.data);
        setLoading(false);
        /*
        let getComments = [];
        for (let i = 0; i < response.data.length; i++) {
          let comment = await axios.get(`http://localhost:2024/api/bugs/${bug._id}/comments/${response.data[i]}`, { withCredentials: true });
          getComments.push(comment);
        }
        console.log("Got past for loop: " + getComments);

        setComments(getComments);
        console.log("response: " + response.data);
        setLoading(false);

        */

        // response.map((comment) => {
        //   comment = `http://localhost:2024/api/bugs/${bug._id}/comments/${comment}`;
        //   getComments.push(comment);
        // });
        // setComments(response.data);
        // console.log("response: " + response.data);
        // setLoading(false);
        setTimeout(() => {
          setDelay('false');
        }, 500);
      } catch (error) {
        showError("Failed to load comments");
        console.error("error: " + error);
        setLoading(false);
      }
    };

    fetchComments();
  }, [displayCounter]);

  async function handleSubmit(event) {
    try {
      event.preventDefault();

      let addedBy = auth.userId;

      console.log("Getting to axios post");
      const response = await axios.post(`http://localhost:2024/api/bugs/${bug._id}/comments`, { content, addedBy }, { withCredentials: true });
      console.log("Past axios post");
      if (response.status === 200 || response.status === 201) {
        showSuccess("Comment added successfully");
        setContent('');
        document.getElementsByName('content')[0].value = '';
        setDisplayCounter(displayCounter + 1);
        navigate('/comment');
      } else {
        showError(`Error: ${response.data?.message || 'Failed to add comment'}`);
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
          <h3 className="bugTitle">Comments for Bug: &quot;{bug.title}&quot;</h3>
          {loading ? (
            <p>Loading comments:</p>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} className="showComment row">
                {console.log("comment: " + JSON.stringify(comment))}
                <p>{comment.content}</p>
                {comment.addedBy && <p>Added by: {comment.addedBy}</p>}
              </div>
            ))
          ) : (
            <p>No comments found</p>
          )}
        </main>
        <aside className="commentForm col-5">
          <h3 className="bugTitle">Add Comment</h3>
          <form onSubmit={handleSubmit}>
            <label htmlFor="comment">Comment:</label><br />
            <textarea id="content" name="content" rows="4" cols="50" onChange={(e) => setContent(e.target.value)}></textarea><br />
            <button type="submit">Submit</button>
            {/* <SubmitButton className="fancyButton" text="Add Comment" displayText={"Add Comment"} /> */}
          </form>
        </aside>
      </div>
    </div>
  );
}
