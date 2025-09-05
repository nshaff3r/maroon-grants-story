import React, { useState, useEffect } from 'react';
import { Scrollama, Step } from 'react-scrollama';
import styled from 'styled-components';
import D3Visualization from './visualizations/D3Visualization';


const sampleText = [
    "In 2025, the Trump administration cancelled grants to universities around the country.",
    "UChicago was one of the universities that lost funding.",
    "These are the grants that the <i>Maroon</i> found lost funding.",
    "Understanding political economies, a National Security Grant, was cancelled earlier in March.",
    "We spoke with researcher Jane Doe about how it affected her research."
]

const sampleTextTwo = [
    "Using social research for the humanities was another grant that was cancelled.",
  
    "Researcher John Doe said that he was forced to pause his research until he could secure a new source of funding.",
  
    '"I just wish we had more certainty about the future of our research," he said.',
]

const bodyOne = [
  "The University of Chicago is a leading private research university located in the Hyde Park neighborhood of Chicago, Illinois. Established in 1890, it quickly developed a reputation for academic excellence and a distinctive intellectual culture centered on critical thinking and debate. Its striking Gothic-style campus is balanced with modern facilities and sits close to the shoreline of Lake Michigan, offering students both a scenic and urban academic environment.",

  "UChicago is particularly well known for its rigorous Core Curriculum, which ensures that undergraduates develop a broad foundation in the humanities, social sciences, and natural sciences. The university has been home to groundbreaking achievements, from the development of modern sociology to the first controlled nuclear reaction. Its alumni and faculty include Nobel Prize winners, world leaders, entrepreneurs, and influential scholars who have shaped disciplines and public policy around the globe.",

  "Life at UChicago extends far beyond the classroom. The campus hosts more than 400 student organizations, a vibrant arts scene, and competitive athletics. Students also take advantage of the university’s close ties to the city of Chicago, engaging with diverse communities, cultural institutions, and internship opportunities. This combination of rigorous academics, historic traditions, and urban engagement makes UChicago a unique and dynamic place to learn and grow.",

  "The University of Chicago is a leading private research university located in the Hyde Park neighborhood of Chicago, Illinois. Established in 1890, it quickly developed a reputation for academic excellence and a distinctive intellectual culture centered on critical thinking and debate. Its striking Gothic-style campus is balanced with modern facilities and sits close to the shoreline of Lake Michigan, offering students both a scenic and urban academic environment."
]

const bodyTwo = [
  "The University of Chicago is a leading private research university located in the Hyde Park neighborhood of Chicago, Illinois. Established in 1890, it quickly developed a reputation for academic excellence and a distinctive intellectual culture centered on critical thinking and debate. Its striking Gothic-style campus is balanced with modern facilities and sits close to the shoreline of Lake Michigan, offering students both a scenic and urban academic environment.",

  "UChicago is particularly well known for its rigorous Core Curriculum, which ensures that undergraduates develop a broad foundation in the humanities, social sciences, and natural sciences. The university has been home to groundbreaking achievements, from the development of modern sociology to the first controlled nuclear reaction. Its alumni and faculty include Nobel Prize winners, world leaders, entrepreneurs, and influential scholars who have shaped disciplines and public policy around the globe.",

  "Life at UChicago extends far beyond the classroom. The campus hosts more than 400 student organizations, a vibrant arts scene, and competitive athletics. Students also take advantage of the university’s close ties to the city of Chicago, engaging with diverse communities, cultural institutions, and internship opportunities. This combination of rigorous academics, historic traditions, and urban engagement makes UChicago a unique and dynamic place to learn and grow.",
]

const Credits = () => {
  return (
    <div className="credits_container">
      <p className="credits_font"><a href="">Access the data</a> for this project.</p>
      <p className="credits_font">Find the <a href="">code for this project</a> on GitHub.</p>
    </div>
  )
}

const ScrollContainer = ({ start, onStepEnter, onStepExit, textArray, height }) => {
  return (
    <div className="scroll_container" style={{ height: height }}>
        <Scrollama onStepEnter={onStepEnter} onStepExit={onStepExit} offset={1}>
          {textArray.map((text, index) => (
            <Step data={start + index} key={start + index}>
              <div className="text_container">
                <p className="scroll_font" dangerouslySetInnerHTML={{ __html: text }}></p>
              </div>
            </Step>
          ))}
        </Scrollama>
      </div>
  )
}
const TreemapAnimations = ({ currentStepIndex, scrollY }) => {
  return (
    <div className="scroll__graphic" >
      <div id="graphic-title-container"
        style={{
          height: Math.min(50, 300-scrollY/5),
          display: 300-scrollY/5 <= 0 ? 'none' : 'block'
        }}>
        <h1
          id="graphic_title" 
          style={{ opacity: 2.5-scrollY/500 }}
        >Federal Grants at UChicago
        </h1>
      </div>
      <D3Visualization currentStepIndex={currentStepIndex} />
    </div>
  )
}

const ScrollTest = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const saved = localStorage.getItem('currentStepIndex');
    return saved !== null ? parseInt(saved) : 0;
  });
  const [scrollY, setScrollY] = useState(() => {
    const saved = localStorage.getItem('scrollY');
    return saved !== null ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('currentStepIndex', currentStepIndex.toString());
  }, [currentStepIndex]);

  useEffect(() => {
    localStorage.setItem('scrollY', scrollY.toString());
  }, [scrollY]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onStepEnter = ({ data }) => {
    setCurrentStepIndex(data);
  };

  const onStepExit = ({ data, direction }) => {
    setCurrentStepIndex(data);
    if (direction === "up") {
      setCurrentStepIndex(data - 1); // move back a step
    } else if (direction === "down") {
      setCurrentStepIndex(data); // move forward
    }
  };

  return (
    <div id="scroll">
      <TreemapAnimations currentStepIndex={currentStepIndex} scrollY={scrollY} />
      <ScrollContainer onStepEnter={onStepEnter} onStepExit={onStepExit} textArray={sampleText} start={0} height={"500vh"} />
      <div className="body_container">
        {bodyOne.map((text, index) => (
          <p className="body_font" key={index}>{text}</p>
        ))}
        <TreemapAnimations currentStepIndex={currentStepIndex} scrollY={scrollY} />
        <ScrollContainer onStepEnter={onStepEnter} onStepExit={onStepExit} textArray={sampleTextTwo}start={5} height={"300vh"}/>
        <div className="body_container">
          {bodyTwo.map((text, index) => (
            <p className="body_font" key={index}>{text}</p>
          ))}
          <div className="contentdiv"></div>
          <h2 className="section">Explore the Grants</h2>
          <TreemapAnimations currentStepIndex={8} scrollY={scrollY} />
          {/* <div id="enddiv"></div> */}
          <div className="contentdiv"></div>
          <Credits />
        </div>
      </div>

    </div>
  );
};

export default ScrollTest;
