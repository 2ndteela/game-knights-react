import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import App from './App';

// The real module calls initializeApp, which needs network access.
vi.mock('./utilities/firebase.js', () => ({
  default: {},
  database: {},
}));

describe('App', () => {
  test('renders the home page with a button for every game', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /he said, she said/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /answer is/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /word fight/i })).toBeInTheDocument();
  });

  test('renders the site header', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /game knights/i })).toBeInTheDocument();
  });
});
