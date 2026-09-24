import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../../utilities/firebase.js', () => ({ default: {}, database: {} }));
vi.mock('../../../utilities/services', () => ({
  startGame: vi.fn(), removeListener: vi.fn(), listenForGameState: vi.fn(),
  openLobby: vi.fn(), joinLobby: vi.fn(), removeGameFromDb: vi.fn(),
  removeMeFromLobby: vi.fn(), listenForGameUpdates: vi.fn(),
  saveHsssResponse: vi.fn(), setGameFinished: vi.fn(),
  checkForEndOfHsssGame: vi.fn().mockResolvedValue(false),
  getHsssGameData: vi.fn().mockResolvedValue(null),
  getHsssPrompts: vi.fn().mockResolvedValue(false),
  setHsssPrompts: vi.fn().mockResolvedValue(true),
  getHelpCreatingStory: vi.fn(),
}));

const services = await import('../../../utilities/services');
const HsssCreate = (await import('./HeSaidSheSaidCreate')).default;
const HsssMain = (await import('./HeSaidSheSaidMain')).default;
const HsssResults = (await import('./HeSaidSheSaidResults')).default;
const JoinGame = (await import('../../JoinGame')).default;
const { defaultPromptTexts } = await import('./usePrompts');

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  localStorage.gameCode = JSON.stringify('ABCDEF');
  localStorage.playerId = JSON.stringify(0);
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// The create screen sends the host on to the game, so it is rendered inside a
// route table that can show where it ended up.
const routed = (ui, entry) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/" element={<div>home screen</div>} />
        <Route path={entry} element={ui} />
        <Route path="/hsss" element={<div>game screen</div>} />
      </Routes>
    </MemoryRouter>
  );

const openEditor = () => fireEvent.click(screen.getByRole('radio', { name: /write my own/i }));

const startGameButton = () => screen.getByRole('button', { name: /^start game$/i });

// The game code sits in a field of its own on this screen, so the prompt rows
// are picked out rather than counted from the top.
const promptFields = () =>
  screen.getAllByRole('textbox').filter(f => f.classList.contains('prompt-input'));

const writePrompts = texts => {
  const fields = promptFields();
  texts.forEach(([idx, value]) => fireEvent.change(fields[idx], { target: { value } }));
};

describe('picking a story', () => {
  test('the host is sent to the story screen instead of starting the game', async () => {
    services.listenForGameUpdates.mockImplementation(cb =>
      cb({ state: 'lobby', game: 'hsss', players: [{ name: 'Ada' }] }, 'listener-1'));

    render(
      <MemoryRouter initialEntries={['/join-game?game=hsss']}>
        <Routes>
          <Route path="/join-game" element={<JoinGame />} />
          <Route path="/hsss-create" element={<div>story screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('radio', { name: /hosting/i }));
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: /open lobby/i }));
    fireEvent.click(await screen.findByRole('button', { name: /pick story/i }));

    expect(await screen.findByText('story screen')).toBeInTheDocument();
    // Starting here would leave the prompts unwritten.
    expect(services.startGame).not.toHaveBeenCalled();
    expect(services.removeListener).toHaveBeenCalledWith('listener-1');
  });


  test('the standard story starts the game without storing any prompts', async () => {
    routed(<HsssCreate />, '/hsss-create');

    // The standard story is the option already selected, so confirming is enough.
    expect(screen.getByRole('radio', { name: /standard story/i })).toBeChecked();
    fireEvent.click(startGameButton());

    expect(await screen.findByText('game screen')).toBeInTheDocument();
    expect(services.startGame).toHaveBeenCalledWith(null);
    // Nothing written means everyone falls back to the defaults, so the standard
    // story costs no storage and no migration for games already in the database.
    expect(services.setHsssPrompts).not.toHaveBeenCalled();
  });

  test('custom prompts are stored in order, skipping the blanks', async () => {
    routed(<HsssCreate />, '/hsss-create');
    openEditor();
    writePrompts([[0, 'Name a villain'], [2, '  Worst place to nap  '], [5, 'A bad excuse']]);

    fireEvent.click(startGameButton());

    await screen.findByText('game screen');
    expect(services.setHsssPrompts).toHaveBeenCalledWith(
      'ABCDEF',
      ['Name a villain', 'Worst place to nap', 'A bad excuse']
    );
  });

  test('prompts are stored before the game starts', async () => {
    routed(<HsssCreate />, '/hsss-create');
    openEditor();
    writePrompts([[0, 'one'], [1, 'two'], [2, 'three']]);

    fireEvent.click(startGameButton());
    await screen.findByText('game screen');

    // The other players jump to their first prompt the moment the state changes,
    // so prompts written after that would arrive too late for them.
    expect(services.setHsssPrompts.mock.invocationCallOrder[0])
      .toBeLessThan(services.startGame.mock.invocationCallOrder[0]);
  });

  test('a story of one or two prompts cannot be started', async () => {
    routed(<HsssCreate />, '/hsss-create');
    openEditor();
    writePrompts([[0, 'Name a villain'], [1, 'Name a pet']]);

    expect(startGameButton()).toBeDisabled();
  });

  test('the game code stays on screen and can be shared', async () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    routed(<HsssCreate />, '/hsss-create');

    // Friends can still join while the host picks, so the code has to be here.
    expect(screen.getByText('ABCDEF')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    expect(writeText).toHaveBeenCalledWith(
      'https://gameknights.web.app/join-game?gameCode=ABCDEF&game=hsss'
    );
    vi.unstubAllGlobals();
  });

  test('shows how many people are waiting, and keeps up as they arrive', async () => {
    let feedLobby;
    services.listenForGameUpdates.mockImplementation(cb => { feedLobby = cb; });
    routed(<HsssCreate />, '/hsss-create');

    // The lobby screen dropped its listener on the way here, so a count taken
    // once would sit still while the rest of the table filled up.
    await act(async () => feedLobby({ state: 'lobby', players: [{ name: 'Ada' }] }, 'listener-2'));
    expect(screen.getByText('1 person in lobby')).toBeInTheDocument();

    await act(async () =>
      feedLobby({ state: 'lobby', players: [{ name: 'Ada' }, { name: 'Grace' }] }, 'listener-2'));
    expect(screen.getByText('2 people in lobby')).toBeInTheDocument();
  });

  test('cancelling closes the lobby instead of leaving it open', async () => {
    let feedLobby;
    services.listenForGameUpdates.mockImplementation(cb => { feedLobby = cb; });
    routed(<HsssCreate />, '/hsss-create');
    await act(async () => feedLobby({ state: 'lobby', players: [{ name: 'Ada' }] }, 'listener-2'));

    fireEvent.click(screen.getByRole('button', { name: /cancel lobby/i }));

    expect(await screen.findByText('home screen')).toBeInTheDocument();
    // A lobby left behind keeps handing out a code for a game nobody will start.
    expect(services.removeGameFromDb).toHaveBeenCalledWith('ABCDEF');
    expect(localStorage.gameCode).toBeUndefined();
    expect(services.removeListener).toHaveBeenCalledWith('listener-2');
    expect(services.startGame).not.toHaveBeenCalled();
  });

  test('AI suggestions fill the prompt fields', async () => {
    services.getHelpCreatingStory.mockResolvedValue(['Name a villain', 'Name a pet', 'A bad excuse']);
    routed(<HsssCreate />, '/hsss-create');
    openEditor();
    writePrompts([[4, 'Left over from before']]);

    fireEvent.click(await screen.findByRole('button', { name: /get help from ai/i }));

    await waitFor(() =>
      expect(promptFields().map(f => f.value).slice(0, 3))
        .toEqual(['Name a villain', 'Name a pet', 'A bad excuse'])
    );
    // A suggestion list shorter than the field count clears the rest: half of an
    // older set left behind would read as prompts the host had approved.
    expect(promptFields()[4].value).toBe('');
    // The standard prompts go along as examples: they are what tells the model
    // how many to write and what shape they take.
    expect(services.getHelpCreatingStory).toHaveBeenCalledWith(defaultPromptTexts);
    // The host still approves them: the suggestions land in the fields rather
    // than starting the game.
    expect(services.setHsssPrompts).not.toHaveBeenCalled();
    expect(startGameButton()).toBeEnabled();
  });

  test('a failed suggestion says so and leaves what the host wrote alone', async () => {
    services.getHelpCreatingStory.mockResolvedValue(false);
    routed(<HsssCreate />, '/hsss-create');
    openEditor();
    writePrompts([[0, 'Name a villain']]);

    fireEvent.click(await screen.findByRole('button', { name: /get help from ai/i }));

    expect(await screen.findByText(/story machine came up empty/i)).toBeInTheDocument();
    expect(promptFields()[0].value).toBe('Name a villain');
  });

  test('sends anyone who is not the host back to the menu', async () => {
    localStorage.playerId = JSON.stringify(2);
    routed(<HsssCreate />, '/hsss-create');

    expect(await screen.findByText('home screen')).toBeInTheDocument();
  });
});

describe('playing a custom story', () => {
  const routedGame = ui => render(<MemoryRouter>{ui}</MemoryRouter>);

  test('asks the host\'s prompt instead of a standard one', async () => {
    services.getHsssPrompts.mockResolvedValue(['Name a villain', 'Name a pet', 'A bad excuse']);
    routedGame(<HsssMain />);

    expect(await screen.findByText('Name a villain')).toBeInTheDocument();
  });

  test('waits on everyone once the shorter set is answered', async () => {
    services.getHsssPrompts.mockResolvedValue(['Name a villain', 'Name a pet', 'A bad excuse']);
    localStorage.hsssStep = JSON.stringify(3);
    routedGame(<HsssMain />);

    await screen.findByText(/waiting on your friends/i);
    // Three answers is the whole game here; against a hard-coded ten nobody
    // would ever be finished.
    await waitFor(() => expect(services.checkForEndOfHsssGame).toHaveBeenCalledWith(3));
  });

  test('shows no prompt at all until the stored set has arrived', async () => {
    let release;
    services.getHsssPrompts.mockImplementation(() => new Promise(r => { release = r; }));

    routedGame(<HsssMain />);

    expect(screen.getByText(/loading your prompts/i)).toBeInTheDocument();
    // Falling back to the defaults while the request is in flight would show a
    // prompt from the standard story, and the answer would land on the wrong one.
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();

    await act(async () => release(['Name a villain']));
    expect(await screen.findByText('Name a villain')).toBeInTheDocument();
  });
});

describe('reading back a custom story', () => {
  const players = [
    { name: 'Ada', responses: ['Ada-villain', 'Ada-pet', 'Ada-excuse'] },
    { name: 'Grace', responses: ['Grace-villain', 'Grace-pet', 'Grace-excuse'] },
  ];

  test('puts each answer under the prompt it was written for', async () => {
    services.getHsssGameData.mockResolvedValue({
      state: 'ended',
      prompts: ['Name a villain', 'Name a pet', 'A bad excuse'],
      players,
    });

    render(<MemoryRouter><HsssResults /></MemoryRouter>);

    expect(await screen.findByText('Name a villain')).toBeInTheDocument();
    expect(screen.getByText('Ada-villain')).toBeInTheDocument();
    expect(screen.getByText('Grace-pet')).toBeInTheDocument();
    // The standard story's connective text only fits the standard prompts.
    expect(screen.queryByText(/were at/i)).toBeNull();
    // The story rows are laid out in a row for the standard template, so the
    // custom ones have to outrank that to stack prompt over answer.
    const row = document.querySelector('.story-row.custom-row');
    expect(getComputedStyle(row).flexDirection).toBe('column');
  });

  test('keeps the story rows to the number of prompts asked', async () => {
    services.getHsssGameData.mockResolvedValue({
      state: 'ended',
      prompts: ['Name a villain', 'Name a pet', 'A bad excuse'],
      players,
    });

    render(<MemoryRouter><HsssResults /></MemoryRouter>);

    await screen.findByText('Name a villain');
    expect(document.querySelectorAll('.story-row').length).toBe(3);
  });
});
