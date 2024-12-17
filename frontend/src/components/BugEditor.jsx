import { useState, useEffect } from "react";
import axios from 'axios';
import FancyInput from "./StyledComponents/FancyInput";
import SubmitButton from "./StyledComponents/SubmitButton";

export default function BugEditor({ bugCounterState, listState, bugListState, userListState, showError, showSuccess }) {
  const [displayState, setDisplayState] = useState('start');
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setSteps] = useState('');
  const [assignedToUser, setAssignedToUser] = useState('');
  const [classification, setClassification] = useState('unclassified');
  const [closed, setClosed] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function getUsers() {
      try {
        const result = await axios.get('http://localhost:2024/api/users', { withCredentials: true });
        setUsers(result.data);
      } catch (err) {
        showError('Error fetching users. Please try again later.');
      }
    }
    getUsers();
  }, []);

  const handleSubmit = (event) => {
    // Prevent default form submission
    event.preventDefault();
    setDisplayState('start');

    if (title === '' && description === '' && stepsToReproduce === '' && assignedToUser === '' && classification === '' && closed === '') {
      showError('Must complete at least one field!');
      return;
    }
    else {
      if (id === '') {
        addBug();
      }
      else {
        editBug();
      }
    }
  };

  async function addBug() {
    let updatedTitle = title;
    let updatedDescription = description;
    let updatedSteps = stepsToReproduce;
    let updatedAssignedToUserId = assignedToUser.id;
    let updatedAssignedToUserName = assignedToUser.fullName;
    let updatedClassification = classification;
    let updatedClosed = closed;

    if (updatedTitle !== '' && updatedDescription !== '' && updatedSteps !== '' && assignedToUser !== '' && updatedClassification !== '' && updatedClosed !== '') {
      await axios.post(`http://localhost:2024/api/bugs`, { title: updatedTitle, description: updatedDescription, stepsToReproduce: updatedSteps, assignedToUserId: updatedAssignedToUserId, assignedToUserName: updatedAssignedToUserName, classification: updatedClassification, closed: updatedClosed }, { withCredentials: true });
      showSuccess('Bug reported!');

      bugCounterState();
    } else {
      showError('Must complete all fields!');
    }
  }

  async function editBug() {
    try {
      let updatedTitle = title;
      let updatedDescription = description;
      let updatedSteps = stepsToReproduce;
      let updatedAssignedToUserId = assignedToUser.id;
      let updatedAssignedToUserName = assignedToUser.fullName;
      let updatedClassification = classification;
      let updatedClosed = closed;

      const result = await axios.get(`http://localhost:2024/api/bugs/${id}`);
      if (!result.data) {
        showError('Bug not found!');
        setDisplayState('invalid');
        return;
      }

      if (updatedTitle === '') {
        updatedTitle = result.data.title;
      }
      if (updatedDescription === '') {
        updatedDescription = result.data.description;
      }
      if (updatedSteps === '') {
        updatedSteps = result.data.stepsToReproduce;
      }
      if (assignedToUser === '') {
        if (result.data.assignedToUserId) {
          updatedAssignedToUserId = result.data.assignedToUserId;
        }
        else {
          updatedAssignedToUserId = assignedToUser.id;
        }
        if (result.data.assignedToUserName) {
          updatedAssignedToUserName = result.data.assignedToUserName;
        }
        else {
          updatedAssignedToUserName = assignedToUser.fullName
        }
      }
      if (classification === '') {
        if (result.data.classifyUserId) {
          if (result.data.classification) {
            updatedClassification = result.data.classification;
          }
          else {
            updatedClassification = 'unclassified';
          }
        }
      }
      if (closed === false) {
        updatedClosed = result.data.closed;
      }
      await axios.patch(`http://localhost:2024/api/bugs/${id}`, { title: updatedTitle, description: updatedDescription, stepsToReproduce: updatedSteps, assignedToUserId: updatedAssignedToUserId, assignedToUserName: updatedAssignedToUserName, classification: updatedClassification, closed: updatedClosed }, { withCredentials: true });
      showSuccess(`Bug ${id} edited!`);
      bugCounterState();
    } catch (err) {
      if (err.response.status === 404) {
        console.log('Error: ' + err);
        showError('Bug not found!');
        setDisplayState('invalid');
        return;
      }
      else if (err.response.status === 400) {
        console.log('Error: ' + JSON.stringify(err.response));
        showError('Must complete all fields! (400)');
        return;
      }
      else if (err.response.status === 403) {
        console.log('Error: ' + err);
        showError('Unauthorized!');
        return;
      }
      else if (err.response.status === 500) {
        console.log('Error: ' + err);
        showError('Server error!');
        return;
      }
      else {
        console.log('Error: ' + err);
        showError('Bug not found!');
        setDisplayState('invalid');
        return;
      }
    }
  }

  return (
    <div className="inputField">
      <h3>Report/Edit Bug</h3>
      <form onSubmit={handleSubmit}>
        <label>Leave ID blank to report a new bug, enter correct ID to edit existing bug</label>
        <label className='label'>Enter Bug ID</label>
        <FancyInput type={"text"} placeholder={"Enter Bug ID"} name={"bugId"} onChange={(e) => setId(e.target.value)} value={id} />
        <br />
        <label className='label'>Enter New Title</label>
        <FancyInput type={"text"} placeholder={"Enter New Title"} name={"title"} onChange={(e) => setTitle(e.target.value)} value={title} />
        <label className='label'>Enter New Description</label>
        <FancyInput type={"text"} placeholder={"Enter New Description"} name={"description"} onChange={(e) => setDescription(e.target.value)} value={description} />
        <label className='label'>Enter New Steps To Reproduce</label>
        <FancyInput type={"text"} placeholder={"Enter New Steps To Reproduce"} name={"description"} onChange={(e) => setSteps(e.target.value)} value={stepsToReproduce} />
        <div className="input-group mb-3">
          <span className="selectLabel input-group-text">Assign User To Bug: </span>
          <select className="select form-select" id="assignTo" name="assignTo" onChange={(e) => setAssignedToUser(JSON.parse(e.target.value))}>
            <option value={''}>Unassigned</option>
            {users.map((user) => (
              <option key={user._id} value={JSON.stringify(user)}>
                {user.fullName}
              </option>
            ))}
          </select>
          <span className="selectLabel input-group-text">Classify Bug: </span>
          <select className="select form-select" id="classify" name="classify" onChange={(e) => setClassification(e.target.value)}>
            <option value={"unclassified"}>Unclassified</option>
            <option value={"approved"}>Approved</option>
            <option value={"resolved"}>Resolved</option>
          </select>
        </div>
        <div className="input-group mb-3">
          <label className="form-check-label checklabel" htmlFor="close">Close?</label>
          <input className="form-check-input checkbox" type="checkbox" value="" id="close" onChange={(e) => setClosed(e.target.value)}></input>
          <SubmitButton className="fancyButton formform" text="Submit" displayText={"Submit"} />

        </div>
      </form>
      {displayState === 'invalid' && <div><p className="error">Bug not found or fields are empty!</p></div>}
    </div >
  );
};