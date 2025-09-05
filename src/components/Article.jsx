import React from 'react';
import scrollama from "scrollama";
import D3Visualization from './visualizations/D3Visualization';
import Header from './Header';
import ScrollTest from './ScrollTest';

const Article = () => {
  return (
    <div id="rootparent">
      <Header />
      <ScrollTest />
    </div>
  );
};

export default Article; 