import './App.less';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Home from './views/Home'
import JoinGame from './views/JoinGame';
import HeSaidSheSaidMain from './views/games/HeSaidSheSaid/HeSaidSheSaidMain';

function App() {
  return (
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
  );
}

export default App;
