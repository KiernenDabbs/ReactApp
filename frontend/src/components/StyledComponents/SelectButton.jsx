import React from 'react';
import styled from 'styled-components';

export default function Button({ displayText, onClick }) {
  return (
    <StyledWrapper>
      <button className="button" onClick={onClick}>{displayText}</button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    width: 100%;
    color: #ecf0f1;
    font-size: 17px;
    background-color: rgb(90, 90, 90);
    border: 1px solid rgb(90, 90, 90);
    border-radius: 5px;
    cursor: pointer;
    padding: 10px;
    box-shadow: 0px 6px 0px rgb(50, 45, 45);
    transition: all 0.1s;
  }

  .button:active {
    box-shadow: 0px 2px 0px rgb(50, 45, 45);
    position: relative;
    top: 2px;
  }`;