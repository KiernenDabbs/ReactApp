import { useState } from "react";
import debug from "debug";
const debugUserSummary = debug('app:UserSummary');
import SubmitButton from './StyledComponents/SubmitButton';
import FancyInput from './StyledComponents/FancyInput';
import axios from "axios";

export default function UserSummary({ showSuccess, showError, user }) {
  return (
    <div className="inputField">
      <h3>User: {user.fullName}</h3>
      <p>ID: {user._id}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      {user.createdOn && <p>Created On: {user.createdOn}</p>}
      {user.lastUpdated && <p>Updated On: {user.lastUpdated}</p>}
    </div>
  );
}
