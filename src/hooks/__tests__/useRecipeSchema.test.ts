import { renderHook } from '@testing-library/preact';
import { describe, it, expect, afterEach } from 'vitest';
import { useRecipeSchema } from '../useRecipeSchema';
import type { ChiveRecipe } from '../../lib/api';

describe('useRecipeSchema', () => {
  afterEach(() => {
    // Cleanup any lingering scripts in head
    document.head.innerHTML = '';
  });

  it('does not inject script if recipe is undefined', () => {
    renderHook(() => useRecipeSchema(undefined, 'at://did:plc:test/com.chive.recipe/fake-rkey'));
    const script = document.querySelector('#recipe-json-ld');
    expect(script).toBeNull();
  });

  it('injects script with JSON-LD data when recipe is provided', () => {
    const mockRecipe: ChiveRecipe = {
      $type: 'com.chive.recipe',
      name: 'Test Recipe',
      description: 'A delicious test recipe',
      ingredients: ['1 cup flour', '2 eggs'],
      steps: ['Mix ingredients', 'Bake at 350F'],
      createdAt: '2023-10-01T12:00:00Z',
      image: {
        $type: 'blob',
        ref: { $link: 'mock-cid-image' },
        mimeType: 'image/webp',
        size: 1024,
      },
      thumbnail: {
        $type: 'blob',
        ref: { $link: 'mock-cid-thumbnail' },
        mimeType: 'image/webp',
        size: 512,
      },
      times: {
        prep: 'PT15M',
        cook: 'PT30M',
      },
      yield: '4 servings'
    };

    const { unmount } = renderHook(() => useRecipeSchema(mockRecipe, 'at://did:plc:test/com.chive.recipe/fake-rkey'));
    
    const script = document.querySelector('#recipe-json-ld');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('type')).toBe('application/ld+json');

    const schema = JSON.parse(script!.textContent || '');
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Recipe');
    expect(schema.name).toBe('Test Recipe');
    expect(schema.description).toBe('A delicious test recipe');
    expect(schema.recipeYield).toBe('4 servings');
    expect(schema.prepTime).toBe('PT15M');
    expect(schema.cookTime).toBe('PT30M');
    expect(schema.recipeIngredient).toEqual(['1 cup flour', '2 eggs']);
    expect(schema.recipeInstructions).toEqual([
      { '@type': 'HowToStep', text: 'Mix ingredients' },
      { '@type': 'HowToStep', text: 'Bake at 350F' }
    ]);
    expect(schema.datePublished).toBe('2023-10-01T12:00:00Z');
    // Just testing it includes the link somewhere (CDN structure can be flexible)
    expect(schema.image[0]).toContain('mock-cid-image');
    
    // Check cleanup on unmount
    unmount();
    expect(document.querySelector('#recipe-json-ld')).toBeNull();
  });

  it('updates the script content if recipe changes', () => {
    const mockRecipe1: ChiveRecipe = {
      $type: 'com.chive.recipe',
      name: 'Recipe One',
      description: 'First',
      ingredients: [],
      steps: [],
      createdAt: '2023-01-01T00:00:00Z',
      image: {
        $type: 'blob',
        ref: { $link: 'cid1' },
        mimeType: 'image/webp',
        size: 1024,
      },
      thumbnail: {
        $type: 'blob',
        ref: { $link: 'cid1-thumb' },
        mimeType: 'image/webp',
        size: 512,
      }
    };

    const mockRecipe2 = { ...mockRecipe1, name: 'Recipe Two' };

    const { rerender } = renderHook((recipe) => useRecipeSchema(recipe, 'at://did:plc:test/com.chive.recipe/fake-rkey'), {
      initialProps: mockRecipe1,
    });

    let script = document.querySelector('#recipe-json-ld');
    let schema = JSON.parse(script!.textContent || '');
    expect(schema.name).toBe('Recipe One');

    rerender(mockRecipe2);

    script = document.querySelector('#recipe-json-ld');
    schema = JSON.parse(script!.textContent || '');
    expect(schema.name).toBe('Recipe Two');
  });
});
