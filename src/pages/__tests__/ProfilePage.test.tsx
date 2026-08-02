import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/preact';
import { ProfilePage } from '../ProfilePage';
import * as auth from '../../hooks/useAuth';
import * as api from '../../lib/api';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual('../../lib/api');
  return {
    ...actual,
    fetchRecipes: vi.fn(),
  };
});

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign in prompt when signed out and no DID parameter is provided', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<ProfilePage />);

    expect(screen.getByText('Sign in to view your profile')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'SIGN IN' })).toBeInTheDocument();
  });

  it('fetches and renders published recipes for authenticated user profile', async () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: {
        did: 'did:plc:myuser123',
        handle: 'myuser.bsky.social',
        displayName: 'My Display Name',
        avatar: 'https://example.com/avatar.jpg',
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const mockRecords: api.RecordEnvelope[] = [
      {
        uri: 'at://did:plc:myuser123/com.chive.recipe/recipe1',
        cid: 'bafk123',
        value: {
          $type: 'com.chive.recipe',
          name: 'My Special Pancakes',
          description: 'Fluffy homemade pancakes',
          ingredients: ['Flour', 'Milk'],
          steps: ['Mix', 'Cook'],
          image: { $type: 'blob', ref: { $link: 'img1' }, mimeType: 'image/webp', size: 100 },
          thumbnail: { $type: 'blob', ref: { $link: 'thumb1' }, mimeType: 'image/webp', size: 50 },
          createdAt: new Date().toISOString(),
        },
      },
    ];

    vi.mocked(api.fetchRecipes).mockResolvedValue({ records: mockRecords });

    render(<ProfilePage identifier="did:plc:myuser123" />);

    await waitFor(() => {
      expect(screen.getByText('My Display Name')).toBeInTheDocument();
      expect(screen.getByText('My Special Pancakes')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/myuser\.bsky\.social/)[0]).toBeInTheDocument();

    expect(api.fetchRecipes).toHaveBeenCalledWith(100, undefined, 'did:plc:myuser123');
  });

  it('renders empty state when user has zero published recipes', async () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: {
        did: 'did:plc:newuser',
        handle: 'newuser.bsky.social',
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(api.fetchRecipes).mockResolvedValue({ records: [] });

    render(<ProfilePage identifier="did:plc:newuser" />);

    await waitFor(() => {
      expect(screen.getByText('No recipes published yet')).toBeInTheDocument();
      expect(screen.getByText('POST YOUR FIRST RECIPE')).toBeInTheDocument();
    });
  });

  it('renders User Not Found state when DID is non-existent', async () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    render(<ProfilePage identifier="did:plc:fakeinvalid123" />);

    await waitFor(() => {
      expect(screen.getByText('User Not Found')).toBeInTheDocument();
      expect(screen.getByText('EXPLORE RECIPES')).toBeInTheDocument();
    });
  });
});
