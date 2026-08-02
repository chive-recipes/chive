import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/preact';
import { RecipeCreatorBadge } from '../RecipeCreatorBadge';
import * as auth from '../../hooks/useAuth';
import { clearProfileCache } from '../../hooks/useProfile';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('RecipeCreatorBadge', () => {
  beforeEach(() => {
    clearProfileCache();
    vi.restoreAllMocks();
  });

  it('renders nothing for detail variant when user is not signed in and recipe is official', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { container } = render(<RecipeCreatorBadge variant="detail" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders verified recipe badge in card-overlay variant when user is not signed in', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<RecipeCreatorBadge variant="card-overlay" />);
    expect(screen.getByTitle('Official Verified Recipe')).toBeInTheDocument();
    expect(screen.queryByText('Verified')).toBeNull();
    expect(screen.queryByText(/@/)).toBeNull();
  });

  it('renders signed in user handle and avatar in detail variant to validate UGC UI', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: {
        did: 'did:plc:chef123',
        handle: 'gordon.bsky.social',
        displayName: 'Chef Gordon',
        avatar: 'https://example.com/gordon.jpg',
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<RecipeCreatorBadge variant="detail" recipeUri="at://did:plc:chef123/com.chive.recipe/123" />);
    expect(screen.getByText('Chef Gordon')).toBeInTheDocument();
    expect(screen.getByText('(@gordon.bsky.social)')).toBeInTheDocument();
    
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', 'https://example.com/gordon.jpg');
  });

  it('renders signed in user handle in card-body variant', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: {
        did: 'did:plc:chef123',
        handle: 'gordon.bsky.social',
        avatar: 'https://example.com/gordon.jpg',
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<RecipeCreatorBadge variant="card-body" recipeUri="at://did:plc:chef123/com.chive.recipe/123" />);
    expect(screen.getByText('@gordon.bsky.social')).toBeInTheDocument();
  });

  it('fetches and renders creator profile in card-body variant when user is NOT signed in', async () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        did: 'did:plc:external123',
        handle: 'alice.bsky.social',
        avatar: 'https://example.com/alice.jpg',
      }),
    } as Response);

    render(<RecipeCreatorBadge variant="card-body" recipeUri="at://did:plc:external123/com.chive.recipe/456" />);

    await waitFor(() => {
      expect(screen.getByText('@alice.bsky.social')).toBeInTheDocument();
    });

    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', 'https://example.com/alice.jpg');
  });
});
