import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FoodCard } from '../FoodCard';
import React from 'react';

const mockFood = {
  id: 'food-001',
  nameEn: 'Apple',
  nameAr: 'تفاح',
  category: 'فواكه',
  calories: 52,
  protein: 0.3,
  carbs: 14,
  fat: 0.2,
  fiber: 2.4,
  sodium: 1,
  potassium: 107,
};

describe('FoodCard', () => {
  test('renders food name in Arabic and English', () => {
    render(
      <MemoryRouter>
        <FoodCard food={mockFood} isSelected={false} onSelect={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText('تفاح')).toBeDefined();
    expect(screen.getByText('Apple')).toBeDefined();
  });

  test('renders calories per 100g', () => {
    render(
      <MemoryRouter>
        <FoodCard food={mockFood} isSelected={false} onSelect={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText(/52 kcal\/100g/)).toBeDefined();
  });

  test('renders macro nutrients', () => {
    render(
      <MemoryRouter>
        <FoodCard food={mockFood} isSelected={false} onSelect={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText(/0.3g/)).toBeDefined();
    expect(screen.getByText(/14g/)).toBeDefined();
    expect(screen.getByText(/0.2g/)).toBeDefined();
    expect(screen.getByText(/2.4g/)).toBeDefined();
  });

  test('shows selected state with primary border', () => {
    const { container } = render(
      <MemoryRouter>
        <FoodCard food={mockFood} isSelected={true} onSelect={() => {}} />
      </MemoryRouter>
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('border-primary-600');
  });

  test('shows default state with gray border', () => {
    const { container } = render(
      <MemoryRouter>
        <FoodCard food={mockFood} isSelected={false} onSelect={() => {}} />
      </MemoryRouter>
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('border-gray-200');
  });

  test('calls onSelect when clicked', () => {
    let selected = false;
    render(
      <MemoryRouter>
        <FoodCard
          food={mockFood}
          isSelected={false}
          onSelect={() => { selected = true; }}
        />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('تفاح'));
    expect(selected).toBe(true);
  });

  test('renders image when image_url is provided', () => {
    const foodWithImage = { ...mockFood, image_url: 'https://example.com/image.jpg', thumbnail_url: 'https://example.com/thumb.jpg' };
    const { container } = render(
      <MemoryRouter>
        <FoodCard food={foodWithImage} isSelected={false} onSelect={() => {}} />
      </MemoryRouter>
    );
    const img = container.querySelector('img');
    expect(img).toBeDefined();
    expect(img?.getAttribute('src')).toBe('https://example.com/thumb.jpg');
  });

  test('renders without image when no image_url', () => {
    const { container } = render(
      <MemoryRouter>
        <FoodCard food={mockFood} isSelected={false} onSelect={() => {}} />
      </MemoryRouter>
    );
    expect(container.querySelector('img')).toBeNull();
  });
});
