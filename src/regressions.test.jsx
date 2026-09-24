import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { notification } from 'antd';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('./utilities/firebase.js', () => ({ default: {}, database: {} }));
vi.mock('./utilities/services', () => ({
  openLobby: vi.fn(), startGame: vi.fn(), joinLobby: vi.fn(),
  removeGameFromDb: vi.fn(), removeMeFromLobby: vi.fn(), removeListener: vi.fn(),
  listenForGameUpdates: vi.fn(), listenForGameState: vi.fn(),
  saveHsssResponse: vi.fn(), setGameFinished: vi.fn(),
  checkForEndOfHsssGame: vi.fn().mockResolvedValue(false),
  getHsssGameData: vi.fn().mockResolvedValue(null),
  getHsssPrompts: vi.fn().mockResolvedValue(false),
  setHsssPrompts: vi.fn().mockResolvedValue(true),
  getHelpCreatingStory: vi.fn().mockResolvedValue(false),
  setAnswerForRound: vi.fn(), setQuestionForUser: vi.fn(), setGameState: vi.fn(),
  awardPoint: vi.fn(), voteToContinue: vi.fn(), setWord: vi.fn(),
  checkStringForRealWord: vi.fn(), markWordGuessed: vi.fn(), startNextRound: vi.fn(),
}));

const services = await import('./utilities/services');
const AnswerIsMain = (await import('./views/games/AnswerIs/AnswerIsMain')).default;
const WordFightMain = (await import('./views/games/WordFight/WordFightMain')).default;
const HeSaidSheSaidMain = (await import('./views/games/HeSaidSheSaid/HeSaidSheSaidMain')).default;
const SiteHeader = (await import('./components/Header/SiteHeader')).default;
const HeSaidSheSaidResults = (await import('./views/games/HeSaidSheSaid/HeSaidSheSaidResults')).default;
const Home = (await import('./views/Home')).default;

let rejections;

beforeEach(() => {
  rejections = [];
  process.on('unhandledRejection', r => rejections.push(String(r)));
  localStorage.gameCode = JSON.stringify('ABCDEF');
  localStorage.playerId = JSON.stringify(0);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  process.removeAllListeners('unhandledRejection');
  // antd keeps its notification stack outside the render tree, so it survives
  // React's cleanup and would leak into the next test.
  notification.destroy();
  localStorage.clear();
  services.listenForGameUpdates.mockReset();
  services.listenForGameState.mockReset();
  services.removeListener.mockReset();
  services.getHsssGameData.mockReset();
  vi.restoreAllMocks();
});

const routed = ui => render(<MemoryRouter>{ui}</MemoryRouter>);
const feed = data => services.listenForGameUpdates.mockImplementation(cb => cb(data, {}));

describe('Answer Is', () => {
  const round = extra => ({
    state: 'results', picker: 0, recentWinner: 1,
    players: [{ id: 0, name: 'Ada', points: 1 }, { id: 1, name: 'Grace', points: 5 }],
    ...extra,
  });

  test('declares a winner even when pointsToWin was typed as a string', async () => {
    feed(round({ pointsToWin: '5' }));
    routed(<AnswerIsMain />);

    expect(await screen.findByText(/Grace Wins!/i)).toBeInTheDocument();
  });

  test('highlights the round winner by player id, not sorted position', async () => {
    // Grace (id 1) won the round and has the most points, so she sorts to the
    // top. Highlighting by array index would color Ada instead.
    feed(round({ pointsToWin: 99 }));
    routed(<AnswerIsMain />);

    await screen.findByText(/leader board/i);
    // jsdom reports computed colors as rgb(), so compare in that form.
    expect(screen.getByText('Grace: 5')).toHaveStyle({ color: 'rgb(0, 191, 255)' });
    expect(screen.getByText('Ada: 1')).toHaveStyle({ color: 'rgb(255, 255, 255)' });
  });

  test('does not reorder the players array it was handed', async () => {
    const data = round({ pointsToWin: 99 });
    feed(data);
    routed(<AnswerIsMain />);

    await screen.findByText(/leader board/i);
    expect(data.players.map(p => p.name)).toEqual(['Ada', 'Grace']);
  });

  test('leaving after a win clears the stored game and unsubscribes', async () => {
    // This screen used to navigate home without doing either, which left the
    // finished game's code and player id behind for the next game to trip over.
    services.listenForGameUpdates.mockImplementation(cb =>
      cb(round({ pointsToWin: 5 }), 'listener-1'));
    routed(<AnswerIsMain />);

    (await screen.findByRole('button', { name: /return to home/i })).click();

    expect(localStorage.gameCode).toBeUndefined();
    expect(localStorage.playerId).toBeUndefined();
    expect(services.removeListener).toHaveBeenCalledWith('listener-1');
  });
});

describe('Word Fight', () => {
  const ended = {
    state: 'ended', picker: 0, word: 'zebra',
    players: [
      { name: 'Ada', points: 1 },
      { name: 'Bob', points: 9 },
      { name: 'Cy', points: 5 },
    ],
  };

  test('crowns the highest scorer', async () => {
    feed(ended);
    routed(<WordFightMain />);

    expect(await screen.findByText(/Congrats to Bob!/)).toBeInTheDocument();
  });

  test('orders the score board by points descending', async () => {
    feed(ended);
    routed(<WordFightMain />);

    await screen.findByText(/game over/i);
    const names = [...document.querySelectorAll('.score-board-row')]
      .map(row => row.firstChild.textContent);
    expect(names).toEqual(['Bob', 'Cy', 'Ada']);
  });

  test('does not reorder the players array it was handed', async () => {
    const data = { ...ended, players: ended.players.map(p => ({ ...p })) };
    feed(data);
    routed(<WordFightMain />);

    await screen.findByText(/game over/i);
    expect(data.players.map(p => p.name)).toEqual(['Ada', 'Bob', 'Cy']);
  });
});

describe('He Said She Said', () => {
  test('reaches the waiting screen without throwing', async () => {
    localStorage.hsssStep = JSON.stringify(10);
    routed(<HeSaidSheSaidMain />);

    await screen.findByText(/waiting on your friends/i);
    await new Promise(r => setTimeout(r, 100));

    expect(rejections).toEqual([]);
  });

  test('subscribes to game state once across re-renders, and unsubscribes on unmount', async () => {
    localStorage.hsssStep = JSON.stringify(10);
    services.listenForGameState.mockImplementation(cb => cb('waiting', 'listener-1'));

    const waiting = <MemoryRouter><HeSaidSheSaidMain /></MemoryRouter>;
    const { rerender, unmount } = render(waiting);

    await screen.findByText(/waiting on your friends/i);
    await waitFor(() => expect(services.listenForGameState).toHaveBeenCalled());

    // The old code subscribed from a useMemo, so every render stacked another
    // listener on the same game.
    for (let i = 0; i < 3; i++) rerender(waiting);
    expect(services.listenForGameState).toHaveBeenCalledTimes(1);

    unmount();
    expect(services.removeListener).toHaveBeenCalledWith('listener-1');
  });
});

describe('one-time messages', () => {
  const story = {
    state: 'ended',
    players: [
      { name: 'Ada', responses: Array.from({ length: 10 }, (_, i) => `ada-${i}`) },
      { name: 'Grace', responses: Array.from({ length: 10 }, (_, i) => `grace-${i}`) },
    ],
  };

  const notices = () => document.querySelectorAll('.ant-notification-notice').length;

  // StrictMode double-invokes effects in development, which is how the author
  // tags bubble ended up on screen twice.
  const strict = ui => render(<StrictMode><MemoryRouter>{ui}</MemoryRouter></StrictMode>);

  test('opens the author tags notification once, and not on later visits', async () => {
    services.getHsssGameData.mockResolvedValue(story);

    const { unmount } = strict(<HeSaidSheSaidResults />);
    await screen.findByText(/story #/i);
    await waitFor(() => expect(notices()).toBe(1));
    unmount();

    strict(<HeSaidSheSaidResults />);
    await screen.findByText(/story #/i);
    await new Promise(r => setTimeout(r, 200));

    expect(notices()).toBe(1);
  });

  test('shows the thank-you note on a first visit only', async () => {
    const visible = () =>
      document.querySelectorAll('#home-message-container:not(.hidden-message)').length;

    const { unmount } = strict(<Home />);
    await screen.findByText(/He Said, She Said/);
    expect(visible()).toBe(1);
    unmount();

    strict(<Home />);
    await screen.findByText(/He Said, She Said/);

    expect(visible()).toBe(0);
  });
});

describe('SiteHeader', () => {
  test.each([
    ['hsss', 'He Said She Said'],
    ['ai', 'Answer Is'],
    ['wf', 'Word Fight'],
  ])('titles the %s game "%s"', async (game, title) => {
    render(
      <MemoryRouter initialEntries={[`/join-game?game=${game}`]}>
        <SiteHeader />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });
});
