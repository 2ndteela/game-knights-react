import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('./firebase', () => ({ default: {}, database: {}, ai: {} }));

const generateContent = vi.fn();

vi.mock('firebase/ai', () => ({
  getGenerativeModel: vi.fn(() => ({ generateContent })),
  Schema: { array: vi.fn(() => ({})), string: vi.fn(() => ({})) },
}));

const { getHelpCreatingStory } = await import('./services');

const examples = ["Write a boy's name", "Now a girl's name", 'Where are they?'];

// The model is told to answer with a JSON array, but a language model is still
// the one answering, so every one of these has to be survivable.
const answers = text => generateContent.mockResolvedValue({ response: { text: () => text } });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  generateContent.mockReset();
  vi.restoreAllMocks();
});

describe('getHelpCreatingStory', () => {
  test('returns the suggested prompts, trimmed', async () => {
    answers('["  Name a villain ", "Name a pet"]');

    expect(await getHelpCreatingStory(examples)).toEqual(['Name a villain', 'Name a pet']);
  });

  test('asks for as many prompts as it was given examples for, and takes no more', async () => {
    answers(JSON.stringify(['one', 'two', 'three', 'four', 'five']));

    expect(await getHelpCreatingStory(examples)).toEqual(['one', 'two', 'three']);
    expect(generateContent).toHaveBeenCalledWith(expect.stringContaining('3 simple prompts'));
  });

  test('drops blanks and anything that is not a string', async () => {
    answers('["Name a villain", "   ", null, 7, "Name a pet"]');

    expect(await getHelpCreatingStory(examples)).toEqual(['Name a villain', 'Name a pet']);
  });

  test('cuts a rambling suggestion down to the length of a prompt field', async () => {
    answers(JSON.stringify([`Name a villain ${'x'.repeat(200)}`]));

    const [suggestion] = await getHelpCreatingStory(examples);
    expect(suggestion.length).toBe(60);
  });

  test('reports failure when the answer is not a list', async () => {
    answers('{"prompts": ["Name a villain"]}');

    expect(await getHelpCreatingStory(examples)).toBe(false);
    // A model answering in the wrong shape is a thing that happens, so it is
    // handled rather than left to throw its way into the console.
    expect(console.error).not.toHaveBeenCalled();
  });

  test('reports failure when the answer is not even JSON', async () => {
    answers('Sure! Here are some prompts:');

    expect(await getHelpCreatingStory(examples)).toBe(false);
  });

  test('reports failure when nothing usable came back', async () => {
    answers('["", "  "]');

    expect(await getHelpCreatingStory(examples)).toBe(false);
  });

  test('reports failure when the call itself blows up', async () => {
    generateContent.mockRejectedValue(new Error('App Check token is invalid'));

    expect(await getHelpCreatingStory(examples)).toBe(false);
  });
});
