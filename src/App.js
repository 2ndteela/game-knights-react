import './App.less';
import React from 'react' 
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Home from './views/Home'
import JoinGame from './views/JoinGame';
import HeSaidSheSaidMain from './views/games/HeSaidSheSaid/HeSaidSheSaidMain';
import HeSaidSheSaidResults from './views/games/HeSaidSheSaid/HeSaidSheSaidResults'
import './ultilites/firebase.js'
import SiteHeader from './components/Header/SiteHeader';
import AnswerIsMain from './views/games/AnswerIs/AnswerIsMain';
import WordFightMain from './views/games/WordFight/WordFightMain';

function App() {
    
  return (
    <Router>
    <div className="App">
      <SiteHeader />
      <div id="router-container">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/join-game' element={<JoinGame />} />
          
          {/* He Said She Said routes */}
          <Route path='/hsss' element={<HeSaidSheSaidMain />} />
          <Route path='/hsss-results' element={<HeSaidSheSaidResults />} />

          {/* Answer Is routes */}
          <Route path='/ai' element={<AnswerIsMain />} />

          {/* Word Fight Routes */}
          <Route path='/wf' element={<WordFightMain />} />
        </Routes>
      </div>
    </div>
    </Router>
  );
}

export default App;
