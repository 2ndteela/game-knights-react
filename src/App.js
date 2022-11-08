import './App.less';
import React from 'react' 
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Home from './views/Home'
import JoinGame from './views/JoinGame';
import HeSaidSheSaidMain from './views/games/HeSaidSheSaid/HeSaidSheSaidMain';
import './ultilites/firebase.js'
import GameContextProvider from './contexts/GameContext';

function App() {
    
  return (
    <GameContextProvider>
    <div className="App">
      <header>
        <h3>Game Knights</h3>
        <div>Quit</div>
      </header>
      <div id="router-container">
      <Router>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/join-game' element={<JoinGame />} />
          <Route path='/hsss' element={<HeSaidSheSaidMain />} />
        </Routes>
      </Router>
      </div>
    </div>
    </GameContextProvider>
  );
}

export default App;
