import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/preact';
import { RecipePage } from '../RecipePage';
import * as auth from '../../hooks/useAuth';
import * as api from '../../lib/api';
import { route } from 'preact-router';

import * as authLib from '../../lib/auth';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../lib/auth', async () => {
  const actual = await vi.importActual('../../lib/auth');
  return {
    ...actual,
    getSessionFetchHandler: vi.fn(),
  };
});

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual('../../lib/api');
  return {
    ...actual,
    deleteRecipe: vi.fn(),
  };
});

vi.mock('preact-router', () => ({
  route: vi.fn(),
}));

// Provide a fake component for testing badges
vi.mock('../RecipeCreatorBadge', () => ({
  RecipeCreatorBadge: () => <div data-testid="recipe-creator-badge" />
}));

const mockRecipeEnvelope: api.RecordEnvelope = {
  uri: 'at://did:plc:author123/com.chive.recipe/recipe1',
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
};

describe('RecipePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).__chive_nav_count = 1;
  });

  it('does not render delete button for non-authors', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: {
        did: 'did:plc:otheruser',
        handle: 'other.bsky.social',
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<RecipePage recipeEnvelope={mockRecipeEnvelope} />);
    expect(screen.queryByTitle('Delete Recipe')).not.toBeInTheDocument();
  });

  it('renders delete button for authors and handles deletion flow', async () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: {
        did: 'did:plc:author123',
        handle: 'author.bsky.social',
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(authLib.getSessionFetchHandler).mockReturnValue(vi.fn() as any);

    vi.mocked(api.deleteRecipe).mockResolvedValue(undefined);

    render(<RecipePage recipeEnvelope={mockRecipeEnvelope} />);
    
    const deleteButton = screen.getByTitle('Delete Recipe');
    expect(deleteButton).toBeInTheDocument();

    // Click delete to show modal
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete Recipe?')).toBeInTheDocument();
    });

    // Cancel deletion
    const cancelButton = screen.getByText('CANCEL');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Delete Recipe?')).not.toBeInTheDocument();
    });

    // Open modal again
    fireEvent.click(deleteButton);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'DELETE' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.deleteRecipe).toHaveBeenCalledWith(expect.any(Function), 'did:plc:author123', 'recipe1');
      expect(route).toHaveBeenCalledWith('/profile/author.bsky.social');
    });
  });
});
