import React from 'react';
import styled from 'styled-components';
import Article from './components/Article';

const AppContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
`;

function App() {
  return (
    <AppContainer>
      <Article />
    </AppContainer>
  );
}

export default App; 