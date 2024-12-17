import React from 'react';
import styled from 'styled-components';

export default function Input({ type, showPassword, name, placeholder, onChange, required, minLength }) {
  if (showPassword === true) {
    type = "text";
  }

  if (minLength === undefined) {
    minLength = 0;
  }

  if (required === undefined) {
    return (
      <StyledWrapper>
        <input type={type} name={name} className="fancyInput" placeholder={placeholder} onChange={onChange} minLength={minLength} />
      </StyledWrapper>
    );
  }
  else {
    return (
      <StyledWrapper>
        <input type={type} name={name} className="fancyInput" placeholder={placeholder} onChange={onChange} required minLength={minLength} />
      </StyledWrapper>
    );
  }
}

const StyledWrapper = styled.div`
  .fancyInput {
   border: 2px solid #e8e8e8;
   padding: 15px;
   border-radius: 10px;
   background-color: #212121;
   font-size: medium;
   font-weight: bold;
   color: #e8e8e8;
   text-align: center;
  }

  .fancyInput:focus {
   outline-color: white;
   background-color: #212121;
   color: #e8e8e8;
   box-shadow: 5px 5px #888888;
  }`;