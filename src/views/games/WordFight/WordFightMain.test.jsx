import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../../utilities/firebase.js', () => ({ default: {}, database: {} }));
vi.mock('../../../utilities/services', () => ({
  listenForGameUpdates: vi.fn(),
  removeListener: vi.fn(),
  checkStringForRealWord: vi.fn(),
  markWordGuessed: vi.fn(),
  setWord: vi.fn(),
  startNextRound: vi.fn(),
}));

const services = await import('../../../utilities/services');
const WordFightMain = (await import('./WordFightMain')).default;

const PLAYERS = [{ name: 'Ada' }, { name: 'Bob' }, { name: 'Cy' }];

beforeEach(() => {
  localStorage.gameCode = JSON.stringify('ABCDEF');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  localStorage.clear();
  services.listenForGameUpdates.mockReset();
  vi.restoreAllMocks();
});

// playerId decides which screen a given game state resolves to, so every test
// sets it before rendering.
const play = (me, data) => {
  localStorage.playerId = JSON.stringify(me);
  services.listenForGameUpdates.mockImplementation(cb => cb(data, 'listener-1'));

  return render(<MemoryRouter><WordFightMain /></MemoryRouter>);
};

const rows = () => [...document.querySelectorAll('.player-and-check')]
  .map(row => row.firstChild.textContent);

describe('WordFightMain screens', () => {
  test('the picker gets the word input before a word is set', async () => {
    play(0, { state: 'started', picker: 0, players: PLAYERS });

    expect(await screen.findByText(/pick a word to try and trick everyone/i)).toBeInTheDocument();
    expect(document.querySelector('.word-input')).toBeTruthy();
  });

  test('a guesser sees the hidden word sitting in alphabetical order', async () => {
    localStorage['wf-previousGuesses'] = JSON.stringify(['zebra', 'apple']);
    play(2, { state: 'started', picker: 0, word: 'mango', players: PLAYERS });

    await screen.findByText('apple');
    const guesses = [...document.querySelectorAll('.guess-in-list')].map(g => g.textContent);

    expect(guesses).toEqual(['apple', '?????', 'zebra']);
    expect(screen.queryByText('mango')).not.toBeInTheDocument();
  });

  test('the picker waits on everyone but themselves', async () => {
    play(1, { state: 'started', picker: 1, word: 'mango', players: PLAYERS });

    await screen.findByText(/waiting on guesses/i);
    expect(rows()).toEqual(['Ada', 'Cy']);
  });

  test('a finished guesser sees the other guessers, not themselves or the picker', async () => {
    play(2, {
      state: 'started', picker: 0, word: 'mango',
      players: [{ name: 'Ada' }, { name: 'Bob' }, { name: 'Cy', timeStamp: 'x' }],
    });

    await screen.findByText(/great work/i);
    expect(screen.getByText('mango')).toBeInTheDocument();
    expect(rows()).toEqual(['Bob']);
  });

  test('bands rows by position in the game, not position in the list', async () => {
    // Picker is Bob at index 1, so the guessers are Ada (0) and Cy (2) -- both
    // even, so neither is striped. Banding off the rendered list instead would
    // stripe Cy for being second.
    play(1, { state: 'started', picker: 1, word: 'mango', players: PLAYERS });

    await screen.findByText(/waiting on guesses/i);
    expect(rows()).toHaveLength(2);
    expect(document.querySelectorAll('.player-and-check.striped')).toHaveLength(0);
  });

  test('names the picker on the waiting screen and shows the scoreboard', async () => {
    play(2, { state: 'started', picker: 1, players: PLAYERS });

    expect(await screen.findByText(/waiting on Bob to pick a word/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /scoreboard/i })).toBeInTheDocument();
  });

  test('the game over screen unsubscribes on the way home', async () => {
    play(0, {
      state: 'ended', picker: 0, word: 'mango',
      players: [{ name: 'Ada', points: 1 }, { name: 'Bob', points: 9 }],
    });

    const home = await screen.findByRole('button', { name: /return to home/i });
    home.click();

    expect(services.removeListener).toHaveBeenCalledWith('listener-1');
  });
});
