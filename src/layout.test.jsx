import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Loaded for their cascade. App.less column-stacks every div under
// #router-container with an ID selector, so anything moved out of an inline
// style has to outrank that to keep working -- which is what these tests check.
import './App.less';
import './styles/shared.less';

vi.mock('./utilities/firebase.js', () => ({ default: {}, database: {} }));
vi.mock('./utilities/services', () => ({
  openLobby: vi.fn(), startGame: vi.fn(), joinLobby: vi.fn(),
  removeGameFromDb: vi.fn(), removeMeFromLobby: vi.fn(), removeListener: vi.fn(),
  listenForGameUpdates: vi.fn(), listenForGameState: vi.fn(),
  saveHsssResponse: vi.fn(), setGameFinished: vi.fn(),
  checkForEndOfHsssGame: vi.fn().mockResolvedValue(false),
  getHsssPrompts: vi.fn().mockResolvedValue(false),
  setHsssPrompts: vi.fn().mockResolvedValue(true),
  getHelpCreatingStory: vi.fn().mockResolvedValue(false),
  setWord: vi.fn(), checkStringForRealWord: vi.fn(), markWordGuessed: vi.fn(),
  startNextRound: vi.fn(), setGameState: vi.fn(), awardPoint: vi.fn(),
  voteToContinue: vi.fn(), setAnswerForRound: vi.fn(), setQuestionForUser: vi.fn(),
}));

const services = await import('./utilities/services');
const Home = (await import('./views/Home')).default;
const JoinGame = (await import('./views/JoinGame')).default;
const HsssMain = (await import('./views/games/HeSaidSheSaid/HeSaidSheSaidMain')).default;
const HsssCreate = (await import('./views/games/HeSaidSheSaid/HeSaidSheSaidCreate')).default;
const AnswerIsMain = (await import('./views/games/AnswerIs/AnswerIsMain')).default;
const WordFightMain = (await import('./views/games/WordFight/WordFightMain')).default;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  localStorage.gameCode = JSON.stringify('ABCDEF');
  localStorage.playerId = JSON.stringify(0);
});

afterEach(() => {
  localStorage.clear();
  services.listenForGameUpdates.mockReset();
  vi.restoreAllMocks();
});

// Mirrors App.jsx: the blanket rule only applies in this shape.
const inApp = (ui, entries = ['/']) =>
  render(
    <div className="App">
      <div id="router-container">
        <MemoryRouter initialEntries={entries}>{ui}</MemoryRouter>
      </div>
    </div>
  );

const feed = data => services.listenForGameUpdates.mockImplementation(cb => cb(data, {}));
const styleOf = sel => getComputedStyle(document.querySelector(sel));

describe('Home', () => {
  test('keeps the tutorial button on its own row and tints the game buttons', async () => {
    inApp(<Home />);
    await screen.findByText(/He Said, She Said/);

    expect(styleOf('.tutorial-row').flexDirection).toBe('row');
    expect(styleOf('.tutorial-row').justifyContent).toBe('flex-end');
    // Has to beat antd's own .ant-btn background.
    expect(styleOf('.game-button').backgroundColor).toBe('rgb(50, 50, 50)');
  });

  test('pins the dismiss button to the bottom of the note', async () => {
    inApp(<Home />);
    await screen.findByRole('button', { name: /dismiss/i });

    expect(styleOf('.bottom-action-row').alignItems).toBe('flex-end');
  });
});

describe('JoinGame', () => {
  test('centers the form and lays the fields out', async () => {
    inApp(<JoinGame />, ['/join-game?game=hsss']);
    await screen.findByText(/game code/i);

    expect(styleOf('#join-game-container').justifyContent).toBe('center');
    expect(styleOf('.player-type-row').flexDirection).toBe('row');
    expect(styleOf('.radio-row').flexDirection).toBe('row');
    expect(styleOf('.field-label').width).toBe('100%');
    // Leaves room for the share button beside it.
    expect(styleOf('.code-input').width).toBe('calc(100% - 40px)');
    expect(styleOf('.ant-space-compact').flexDirection).toBe('row');
  });

  test('sizes the lobby controls', async () => {
    inApp(<JoinGame />, ['/join-game?game=hsss']);
    await screen.findByText(/game code/i);
    fireEvent.click(screen.getByRole('radio', { name: /hosting/i }));
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: /open lobby/i }));
    await screen.findByText(/people in Lobby/i);

    expect(styleOf('.lobby-actions').flexDirection).toBe('row');
    expect(styleOf('.lobby-actions').width).toBe('200px');
    expect(styleOf('.spacer-h-8').width).toBe('8px');
    expect(styleOf('.start-button').width).toBe('200px');
  });
});

describe('He Said She Said', () => {
  test('squares off the prompt input', async () => {
    inApp(<HsssMain />, ['/hsss']);
    await screen.findByRole('button', { name: /next/i });

    expect(styleOf('.prompt-wrapper').width).toBe('100%');
    // Has to beat antd's own .ant-input radius.
    expect(styleOf('.square-input').borderRadius).toBe('0px');
  });

  test('lays out the story picker and squares off its prompt fields', async () => {
    inApp(<HsssCreate />, ['/hsss-create']);
    await screen.findByRole('button', { name: /^start game$/i });

    expect(styleOf('.create-actions').flexDirection).toBe('row');
    // antd renders the option group as a div, which the blanket column rule
    // would stack instead of laying side by side.
    expect(styleOf('.radio-row').flexDirection).toBe('row');
    // The share button sits beside the code rather than under it.
    expect(styleOf('.code-row').flexDirection).toBe('row');

    fireEvent.click(screen.getByRole('radio', { name: /write my own/i }));
    await screen.findByRole('button', { name: /get help from ai/i });

    expect(styleOf('.prompt-input').borderRadius).toBe('0px');
    // The fields are 100% of this, so anything narrower than the container
    // shrinks every prompt field with it.
    expect(styleOf('.prompt-list').width).toBe('100%');
  });

  test('centers the waiting screen', async () => {
    localStorage.hsssStep = JSON.stringify(10);
    inApp(<HsssMain />, ['/hsss']);
    await screen.findByText(/waiting on your friends/i);

    expect(styleOf('.waiting-wrapper').justifyContent).toBe('center');
    expect(styleOf('.waiting-wrapper').alignItems).toBe('center');
  });
});

describe('Answer Is', () => {
  test('lays out the pick list', async () => {
    feed({
      game: 'ai', state: 'picking', picker: 0, answer: '42',
      players: [{ id: 0, name: 'Ada', question: 'Q one?' }, { id: 1, name: 'Grace', question: 'Q two?' }],
    });
    inApp(<AnswerIsMain />, ['/ai']);
    await screen.findByText(/pick the question/i);

    expect(styleOf('.pick-list').justifyContent).toBe('flex-start');
    expect(styleOf('.pick-option').width).toBe('100%');
    expect(styleOf('.pick-button').backgroundColor).toBe('rgb(67, 67, 67)');
  });
});

describe('Word Fight', () => {
  test('stripes alternate player rows and marks finishers green', async () => {
    feed({
      state: 'guessing', picker: 0, word: 'zebra', startTime: new Date().toISOString(),
      players: [{ name: 'Ada' }, { name: 'Bob', timeStamp: 'x' }, { name: 'Cy' }],
    });
    inApp(<WordFightMain />, ['/wf']);
    await screen.findByText(/waiting on guesses/i);

    expect(styleOf('.player-and-check.striped').backgroundColor).toBe('rgb(35, 35, 35)');
    expect(styleOf('.check-mark').color).toBe('rgb(0, 128, 0)');
    expect(styleOf('.section-heading.spaced').marginBottom).toBe('4px');
  });

  test('centers and narrows the final score board', async () => {
    feed({
      state: 'ended', picker: 0, word: 'zebra',
      players: [{ name: 'Ada', points: 1 }, { name: 'Bob', points: 9 }],
    });
    inApp(<WordFightMain />, ['/wf']);
    await screen.findByText(/game over/i);

    expect(styleOf('.main-container.centered').alignItems).toBe('center');
    expect(styleOf('#score-board.narrow').width).toBe('300px');
  });
});
