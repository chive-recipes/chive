import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { LoginPage } from '../LoginPage';
import * as auth from '../../hooks/useAuth';
import { route } from 'preact-router';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('preact-router', () => ({
  route: vi.fn(),
}));

describe('LoginPage Component', () => {
  const mockSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders handle input, info text, and sign in button', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: mockSignIn,
      signOut: vi.fn(),
    });

    render(<LoginPage />);

    expect(screen.getByPlaceholderText('handle.bsky.social')).toBeInTheDocument();
    expect(screen.getByText(/Use your/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('redirects to / if user is already authenticated', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: { did: 'did:plc:test', handle: 'test.bsky.social' },
      isLoading: false,
      signIn: mockSignIn,
      signOut: vi.fn(),
    });

    render(<LoginPage />);
    expect(route).toHaveBeenCalledWith('/', true);
  });

  it('handles sign in submission with valid handle', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: mockSignIn,
      signOut: vi.fn(),
    });

    render(<LoginPage />);

    const input = screen.getByPlaceholderText('handle.bsky.social');
    fireEvent.input(input, { target: { value: 'myhandle.bsky.social' } });

    const submitBtn = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(submitBtn);

    expect(mockSignIn).toHaveBeenCalledWith('myhandle.bsky.social');
  });

  it('shows error if sign in throws', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Invalid handle'));
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: mockSignIn,
      signOut: vi.fn(),
    });

    render(<LoginPage />);

    const input = screen.getByPlaceholderText('handle.bsky.social');
    fireEvent.input(input, { target: { value: 'badhandle' } });

    const submitBtn = screen.getByRole('button', { name: 'Sign in' });
    await fireEvent.click(submitBtn);

    expect(await screen.findByText('Invalid handle')).toBeInTheDocument();
  });
});
