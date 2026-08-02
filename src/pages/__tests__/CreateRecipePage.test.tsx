import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { CreateRecipePage } from '../CreateRecipePage';
import * as auth from '../../hooks/useAuth';
import * as api from '../../lib/api';
import * as authLib from '../../lib/auth';
import * as imageUtils from '../../lib/imageUtils';
import { route } from 'preact-router';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('preact-router', () => ({
  route: vi.fn(),
}));

vi.mock('../../lib/api', () => ({
  publishRecipe: vi.fn(),
  uploadBlob: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  getSessionFetchHandler: vi.fn(),
  getCurrentDid: vi.fn(),
}));

vi.mock('../../lib/imageUtils', () => ({
  processRecipeImage: vi.fn(),
}));

describe('CreateRecipePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login if user is not authenticated', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<CreateRecipePage />);
    expect(route).toHaveBeenCalledWith('/login');
  });

  it('renders the form when user is authenticated', () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: { did: 'did:plc:test', handle: 'test.bsky.social' },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<CreateRecipePage />);
    expect(screen.getByRole('heading', { name: 'Post a Recipe' })).toBeInTheDocument();
    expect(screen.getByText('Basic Details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Recipe/i })).toBeInTheDocument();
  });

  it('handles successful form submission', async () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: { did: 'did:plc:test', handle: 'test.bsky.social' },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(authLib.getCurrentDid).mockReturnValue('did:plc:test');
    const mockHandler = vi.fn();
    vi.mocked(authLib.getSessionFetchHandler).mockReturnValue(mockHandler as any);
    
    vi.mocked(imageUtils.processRecipeImage).mockResolvedValue({
      fullsize: { blob: new Blob(), width: 100, height: 100 },
      thumbnail: { blob: new Blob(), width: 50, height: 50 },
    });
    
    vi.mocked(api.uploadBlob).mockResolvedValueOnce({ $type: 'blob', ref: { $link: 'bafy1' }, mimeType: 'image/webp', size: 100 });
    vi.mocked(api.uploadBlob).mockResolvedValueOnce({ $type: 'blob', ref: { $link: 'bafy2' }, mimeType: 'image/webp', size: 50 });
    vi.mocked(api.publishRecipe).mockResolvedValue({
      uri: 'at://did:plc:test/com.chive.recipe/fake-rkey',
      cid: 'fake-cid',
      value: {} as any
    });

    render(<CreateRecipePage />);

    // Fill form
    fireEvent.input(screen.getByPlaceholderText("e.g., Grandma's Apple Pie"), { target: { value: 'Test Recipe' } });
    fireEvent.input(screen.getByPlaceholderText("e.g., 2 cups all-purpose flour"), { target: { value: 'Ingredient 1' } });
    fireEvent.input(screen.getByPlaceholderText("Describe this step..."), { target: { value: 'Step 1' } });

    // Mock file input
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    const submitBtn = screen.getByRole('button', { name: /Publish Recipe/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.publishRecipe).toHaveBeenCalled();
    });
    
    expect(api.publishRecipe).toHaveBeenCalledWith(mockHandler, 'did:plc:test', expect.objectContaining({
      name: 'Test Recipe',
      ingredients: ['Ingredient 1'],
      steps: ['Step 1'],
    }));

    expect(route).toHaveBeenCalledWith('/recipe/test.bsky.social/fake-rkey');
  });

  it('shows error if image is missing', async () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      user: { did: 'did:plc:test', handle: 'test.bsky.social' },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(authLib.getCurrentDid).mockReturnValue('did:plc:test');
    vi.mocked(authLib.getSessionFetchHandler).mockReturnValue(vi.fn() as any);

    render(<CreateRecipePage />);

    // Fill name but omit image
    fireEvent.input(screen.getByPlaceholderText("e.g., Grandma's Apple Pie"), { target: { value: 'Test Recipe' } });
    fireEvent.input(screen.getByPlaceholderText("e.g., 2 cups all-purpose flour"), { target: { value: 'Ingredient 1' } });
    fireEvent.input(screen.getByPlaceholderText("Describe this step..."), { target: { value: 'Step 1' } });

    const submitBtn = screen.getByRole('button', { name: /Publish Recipe/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Please upload an image for your recipe.')).toBeInTheDocument();
    });
  });
});
