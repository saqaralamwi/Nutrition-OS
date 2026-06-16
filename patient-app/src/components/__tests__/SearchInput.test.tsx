import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from '../SearchInput';
import React from 'react';

describe('SearchInput', () => {
  test('renders with Arabic placeholder', () => {
    render(
      <SearchInput
        value=""
        onChange={() => {}}
        placeholder="ابحث عن طعام..."
      />
    );
    const input = screen.getByPlaceholderText('ابحث عن طعام...');
    expect(input).toBeDefined();
  });

  test('displays the current value', () => {
    render(
      <SearchInput
        value="تفاح"
        onChange={() => {}}
        placeholder="ابحث عن طعام..."
      />
    );
    const input = screen.getByDisplayValue('تفاح');
    expect(input).toBeDefined();
  });

  test('calls onChange when typing', () => {
    let value = '';
    render(
      <SearchInput
        value=""
        onChange={(v) => { value = v; }}
        placeholder="ابحث عن طعام..."
      />
    );
    const input = screen.getByPlaceholderText('ابحث عن طعام...');
    fireEvent.change(input, { target: { value: 'موز' } });
    expect(value).toBe('موز');
  });

  test('has Arabic CSS class', () => {
    const { container } = render(
      <SearchInput
        value=""
        onChange={() => {}}
        placeholder="ابحث عن طعام..."
      />
    );
    const input = container.querySelector('input');
    expect(input?.className).toContain('arabic');
  });

  test('renders search icon SVG', () => {
    const { container } = render(
      <SearchInput
        value=""
        onChange={() => {}}
        placeholder="ابحث عن طعام..."
      />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });
});
