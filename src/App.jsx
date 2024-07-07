import React, { useState } from 'react';
import TransitionCanvas from './components/TransitionScene';
import './App.css'


const App = () => {
  const [toggle, setToggle] = useState(false);

  const toggleScene = () => {
    setToggle((prev) => !prev);
  };

  return (
    <>
      <TransitionCanvas toggle={toggle} />
      <button onClick={toggleScene} style={{ position: 'absolute', top: '10px', left: '10px' }}>
        Toggle Scene
      </button>
    </>
  );
};

export default App;
