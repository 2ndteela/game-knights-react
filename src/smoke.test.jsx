import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { TutorialDialog } from './components/TutorialDialog/TutorialDialog';
import JoinGame from './views/JoinGame';
import HeSaidSheSaidMain from './views/games/HeSaidSheSaid/HeSaidSheSaidMain';
import WordFightMain from './views/games/WordFight/WordFightMain';
import AnswerIsMain from './views/games/AnswerIs/AnswerIsMain';
import HeSaidSheSaidResults from './views/games/HeSaidSheSaid/HeSaidSheSaidResults';
import * as services from './utilities/services';

vi.mock('./utilities/firebase.js', () => ({ default: {}, database: {} }));

// One shared services mock: every view only talks to Firebase through this
// module, so stubbing it lets the views render without a live database.
vi.mock('./utilities/services', () => ({
  openLobby: vi.fn(),
  startGame: vi.fn(),
  joinLobby: vi.fn(),
  removeGameFromDb: vi.fn(),
  removeMeFromLobby: vi.fn(),
  removeListener: vi.fn(),
  listenForGameUpdates: vi.fn(),
  listenForGameState: vi.fn(),
  saveHsssResponse: vi.fn(),
  setGameFinished: vi.fn(),
  checkForEndOfHsssGame: vi.fn().mockResolvedValue(false),
  getHsssGameData: vi.fn().mockResolvedValue(null),
  getHsssPrompts: vi.fn().mockResolvedValue(false),
  setHsssPrompts: vi.fn().mockResolvedValue(true),
  getHelpCreatingStory: vi.fn().mockResolvedValue(false),
  setAnswerForRound: vi.fn(),
  setQuestionForUser: vi.fn(),
  setGameState: vi.fn(),
  awardPoint: vi.fn(),
  voteToContinue: vi.fn(),
  setWord: vi.fn(),
  checkStringForRealWord: vi.fn(),
  markWordGuessed: vi.fn(),
  startNextRound: vi.fn(),
}));

let errors;
let warns;

beforeEach(() => {
  errors = [];
  warns = [];
  vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.join(' ')));
  vi.spyOn(console, 'warn').mockImplementation((...a) => warns.push(a.join(' ')));
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

const noComplaints = () => expect([...errors, ...warns].join('\n')).toBe('');

const renderRouted = ui => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('view smoke tests', () => {
  test('TutorialDialog opens a Modal with a Select and Carousel', async () => {
    render(<TutorialDialog />);
    await userEvent.click(screen.getByRole('button', { name: /how to play/i }));

    // No game picked yet, so the modal falls back to the generic title.
    expect(await screen.findByText(/^Tutorials$/)).toBeInTheDocument();
    noComplaints();
  });

  test('JoinGame renders Space.Compact and Radio.Group', async () => {
    renderRouted(<JoinGame />);

    expect(await screen.findByText(/game code/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /hosting/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /joining/i })).toBeInTheDocument();
    noComplaints();
  });

  test('HeSaidSheSaidMain renders a prompt with its Progress timer', async () => {
    renderRouted(<HeSaidSheSaidMain />);

    expect(await screen.findByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(document.querySelector('.ant-progress')).toBeTruthy();
    noComplaints();
  });

  test('WordFightMain mounts with the message hook wired up', async () => {
    renderRouted(<WordFightMain />);
    noComplaints();
  });

  test('AnswerIsMain mounts while waiting on game data', async () => {
    renderRouted(<AnswerIsMain />);
    noComplaints();
  });

  test('AnswerIsMain renders the leader board once a round has results', async () => {
    localStorage.gameCode = JSON.stringify('ABCDEF');
    localStorage.playerId = JSON.stringify(1);

    services.listenForGameUpdates.mockImplementation(cb =>
      cb(
        {
          state: 'results',
          picker: 0,
          pointsToWin: 5,
          recentWinner: 1,
          answer: '42',
          players: [
            { id: 0, name: 'Ada', points: 2 },
            { id: 1, name: 'Grace', points: 3 },
          ],
        },
        {}
      )
    );

    renderRouted(<AnswerIsMain />);

    expect(await screen.findByText(/leader board/i)).toBeInTheDocument();
    expect(screen.getByText(/Grace: 3/)).toBeInTheDocument();
    noComplaints();
  });

  test('HeSaidSheSaidResults renders a story with Popconfirm author tags', async () => {
    const responses = n =>
      Array.from({ length: 10 }, (_, i) => `${n}-answer-${i}`);

    services.getHsssGameData.mockResolvedValue({
      state: 'ended',
      players: [
        { name: 'Ada', responses: responses('ada') },
        { name: 'Grace', responses: responses('grace') },
      ],
    });

    renderRouted(<HeSaidSheSaidResults />);

    expect(await screen.findByText(/story #/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to home/i })).toBeInTheDocument();

    // Author tags are Popconfirm triggers; clicking one opens the author popup.
    await userEvent.click(screen.getByText('ada-answer-2'));
    expect(await screen.findByText('Ada')).toBeInTheDocument();
    noComplaints();
  });
});
