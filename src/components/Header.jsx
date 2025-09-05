import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons';

const Headline = () => {
  return (
    <div className="headerdiv">
      <h1 id="header"> The Trump Administration's Cancelled UChicago Grants </h1>
      <h2 id="subhead">Maroon Data does X Y and Z.</h2>
    </div>
  )
}

const Byline = () => {
  return (
    <div className="headerdiv" style={{marginTop: "30px"}}>
      <p className="byline">Written by: <a className="byline_link" href="https://chicagomaroon.com/staff_name/celeste-alcalay/">Celeste Alcalay</a> and <a className="byline_link" href="https://chicagomaroon.com/staff_name/gabriel-kraemer/">Gabriel Kraemer</a></p>
      <p className="byline">Graphics and Development by <a className="byline_link" href="https://chicagomaroon.com/staff_name/nolan-shaffer">Nolan Shaffer</a></p>
      <p className="byline">September 1, 2025</p>
      <FontAwesomeIcon icon={faAngleDoubleDown} color="white" id="arrow" size="3x"/>
    </div>
  )
}

const Header = () => {
  return (
    <div id="intro-container"> 
      <img id="maroon" src="maroon_logo_white.svg"/>
      <Headline/>
      <div id="separator"></div>
      <Byline/>
    </div>
  );
};

export default Header; 