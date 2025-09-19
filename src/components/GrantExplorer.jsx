import React, { useState, useEffect } from 'react';
import { TreemapAnimations } from './ScrollTest';

const GrantButton = ({ onClick, label }) => {
  const [clicked, setClicked] = useState(false);
  const [hover, setHover] = useState(false);
  if (!clicked) {
    return (
      <div>
        <div 
          className="grant_button" 
          style={{ backgroundColor: hover ? '#0A8F4E' : '' }} 
          onMouseEnter={() => setHover(true)} 
          onMouseLeave={() => setHover(false)}
          onClick={() => {
            setClicked(!clicked);
            setHover(false);
            onClick({label})
          }}
        >
          <div className="oval-dollar"></div>
          <p 
            className="button_label"
            style = {{
              backgroundColor: hover ? '#3D8857' : '',
              opacity: .7,
              color: '#393A33'

            }}
          >
            $
          </p>
          <p 
            className="button_label" 
            style={{
              backgroundColor: hover ? '#0A8F4E' : '',
              opacity: hover ? 0 : 1
            }}
          >
            { label }
          </p>
        </div>
      </div>
    )
  } else {
    return (
      <div>
        <div 
          className="grant_button" 
          style={{ backgroundColor:'maroon' }} 
          onMouseEnter={() => setHover(true)} 
          onMouseLeave={() => setHover(false)}
          onClick={() => {
            setClicked(!clicked)
            setHover(false);
            onClick({label});
          }}
        >
          <div className="oval-dollar" style={{ borderColor: "white" }}></div>
          <p 
            className="button_label"
            style = {{
              backgroundColor: 'maroon',
              opacity: .7,
              color: 'white'

            }}
          >
            $
          </p>
          <p 
            className="button_label" 
            style={{
              backgroundColor: 'maroon',
              opacity: hover ? 0 : 1,
              color: 'white'
            }}
          >
            { label }
          </p>
        </div>
      </div>
    )
  }
}

const AgencyOption = ({ onClick, label, show}) => {
  const [hover, setHover] = useState(false);
  const [clicked, setClicked] = useState(false)
  if (!clicked) {
    return (
      <div>
        {show && <div
        style={{backgroundColor: hover ? '#0A8F4E' : ''}}
        className="agency_option"
        onMouseEnter={() => setHover(true)} 
        onMouseLeave={() => setHover(false)}
        onClick={() => {
          setClicked(!clicked);
          setHover(false);
          onClick({label})
        }}
        >
          <p
            className="button_label"
            style={{
              top: 0,
              backgroundColor: hover ? '#0A8F4E' : '',
              color: hover ? "#393A33" : ""
            }}
            onMouseEnter={() => setHover(true)} 
            onMouseLeave={() => setHover(false)}
            onClick={() => {
              setClicked(!clicked);
              setHover(false);
              onClick({label})
            }}
            >{label}</p>
        </div>}
      </div>
    )
  } else {
    return (
      <div>
        {show && <div
        style={{backgroundColor: 'maroon', borderColor: "white"}}
        className="agency_option"
        onClick={() => {
          setClicked(!clicked);
          setHover(false);
          onClick({label})
        }}
        >
          <p
            className="button_label"
            style={{
              top: 0,
              backgroundColor: 'maroon',
              color: 'white'
            }}
            
          >{label}</p>
        </div>}
      </div>
    )
  }
}

const GrantOptions = ({ onClick, label }) => {
  const [hover, setHover] = useState(true);
  return (
    <div>
      <div 
        className="grant_button" 
        style={{
          backgroundColor: hover ? '#0A8F4E' : '',
          height: hover ? '128px' : ''
        }} 
        onMouseEnter={() => setHover(true)} 
        onMouseLeave={() => setHover(false)}
      >
        <AgencyOption label="NIH" show={hover} onClick={onClick}/>
        <AgencyOption label="NSF" show={hover} onClick={onClick}/>
        <AgencyOption label="NEH" show={hover} onClick={onClick}/>
        <AgencyOption label="DOD" show={hover} onClick={onClick}/>
        <AgencyOption label="State" show={hover} onClick={onClick}/>
        {!hover && <div className="oval-dollar"></div>}
        <p 
          className="button_label" 
          style={{
            backgroundColor: hover ? '#0A8F4E' : '',
            opacity: hover ? 0 : 1
          }}
        >
          { label }
        </p>
      </div>
    </div>
  )
}


const GrantExplorer = () => {
  const [clicked, setClicked] = useState(false);
  const [highlighted, setHighlighted] = useState([])

  const onClickAction = (label) => {
    const index = highlighted.findIndex(c => c === label)
    if (index != -1) {
      console.log(index)
      // setHighlighted(highlighted.slice(0, index)) remove highlighted
    } else {
      highlighted.push(label)
      setHighlighted(highlighted)
    }
    console.log(highlighted)
  }

  return (
    <div>
      <div className="grant_button_container">
        <GrantButton onClick={(label) => {onClickAction(label.label)}} label="South Side" />
        <GrantButton onClick={(label) => {onClickAction(label.label)}} label="Minority" />
        <GrantOptions onClick={(label) => {onClickAction(label.label)}} label="Agency" />
      </div>
      <TreemapAnimations currentStepIndex={8} scrollY={10000} />
    </div>
  )
}

export default GrantExplorer;