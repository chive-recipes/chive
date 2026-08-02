import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { Header } from '../Header';
import * as auth from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Preact Router Mock
vi.mock('preact-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useRouter: () => [{ url: '/' }],
}));

describe('Header Component', () => {
  it('renders sign in button when not authenticated', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<Header />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('renders user avatar when authenticated', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: { did: 'did:plc:test', handle: 'test.bsky.social', avatar: 'http://example.com/avatar.jpg' },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<Header />);
    const avatarImg = screen.getByRole('img');
    expect(avatarImg).toHaveAttribute('src', 'http://example.com/avatar.jpg');
  });
});
