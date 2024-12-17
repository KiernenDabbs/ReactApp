import { useState } from "react";
import SelectButton from './StyledComponents/SelectButton';

//Import components
import BugEditor from './BugEditor.jsx';
import BugList from './BugList.jsx';
import BugSummary from './BugSummary.jsx';
import UserEditor from './UserEditor.jsx';
import UserList from './UserList.jsx';
import UserSummary from './UserSummary.jsx';

export default function dataDisplay({ setAuth, onLogout, showError, showSuccess, auth }) {
  const [state, setState] = useState('start');
  const [listState, setListState] = useState('BugList');
  const [bug, setBug] = useState(null);
  const [user, setUser] = useState(null);
  const [bugCounter, setBugCounter] = useState(0); // Used to refresh the bug list
  const [userCounter, setUserCounter] = useState(0); // Used to refresh the user list

  function bugCounterState() {
    setBugCounter(bugCounter + 1);
  }
  function userCounterState() {
    setUserCounter(userCounter + 1);
  }

  function startDisplay() {
    return (
      <div className="inputField">
        <h3>Waiting for user input</h3>
        <p>Click a button above to edit stored data, or click <br /> &quot;View Full Details&quot; on the left to display full information</p>
      </div>
    )
  }

  function setBugViewState(bug) {
    setState('Bug');
    setBug(bug);
    console.log(bug);
  }

  function setUserViewState(user) {
    setState('User');
    setUser(user);
    console.log(user);
  }

  return (
    <>
      <aside className="listContainer">
        <div className='flex buttons'>
          <SelectButton className='col-2 button' onClick={() => setListState('BugList')} text='Bugs' displayText={"Bugs"} />
          <SelectButton className='col-2 button' onClick={() => setListState('UserList')} text='Users' displayText={"Users"} />
        </div>
        {listState === 'BugList' && <BugList setViewState={setBugViewState} onLogout={onLogout} showError={showError} showSuccess={showSuccess} listState={listState} bugCounter={bugCounter} bugCounterState={bugCounterState} auth={auth} />}
        {listState === 'UserList' && <UserList setViewState={setUserViewState} onLogout={onLogout} showError={showError} showSuccess={showSuccess} listState={listState} userCounter={userCounter} userCounterState={userCounterState} auth={auth} />}
      </aside>
      <main>
        <div className='body container'>
          <div className='flex buttons'>
            <SelectButton className='col-2 button' onClick={() => setState('BugEditor')} text='Edit Bug' displayText={"Edit Bug"} />
            <SelectButton className='col-2 button' onClick={() => setState('UserEditor')} text='Edit User' displayText={"Edit User"} />
          </div>
          <div className='dataAccess'>
            {state === 'start' && startDisplay()}
            {/*Display the bug or user editor*/}
            {state === 'BugEditor' && <BugEditor showError={showError} showSuccess={showSuccess} />}
            {state === 'UserEditor' && <UserEditor showError={showError} showSuccess={showSuccess} />}
            {/*Display the bug or user summary*/}
            {state === 'Bug' && <BugSummary showError={showError} showSuccess={showSuccess} bug={bug} />}
            {state === 'User' && <UserSummary showError={showError} showSuccess={showSuccess} user={user} />}
          </div>
        </div >
      </main>
    </>
  )
}