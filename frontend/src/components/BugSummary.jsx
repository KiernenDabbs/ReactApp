import { useState } from "react";
import debug from "debug";
const debugBugSummary = debug('app:BugSummary');
import SubmitButton from './StyledComponents/SubmitButton';
import FancyInput from './StyledComponents/FancyInput';
import axios from "axios";

export default function BugSummary({ showSuccess, showError, bug }) {
  return (
    <div className="inputField">
      <h3>Issue: {bug.title}</h3>
      <p>ID: {bug._id}</p>
      <p>Description: {bug.description}</p>
      <p>Classification: {bug.classification}</p>
      <p>Steps to Reproduce: {bug.stepsToReproduce}</p>
      {bug.closed == false && <p>Bug is open</p>}
      {bug.closed == true && <p>Bug is closed</p>}
      {bug.assignedToUserName && <p>Assigned To: {bug.assignedToUserName}</p>}
      {bug.assignedToUserId && <p>Assigned To ID: {bug.assignedToUserId}</p>}
      {bug.createdByUserName && <p>Reported By: {bug.createdByUserName}</p>}
      {bug.createdOn && <p>Reported On: {bug.createdOn}</p>}
    </div>
  );
}
