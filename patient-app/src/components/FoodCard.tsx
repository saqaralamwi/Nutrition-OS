import React from 'react';

interface FoodItem {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  potassium: number;
  image_url?: string;
  thumbnail_url?: string;
}

interface FoodCardProps {
  food: FoodItem;
  isSelected: boolean;
  onSelect: () => void;
}

export function FoodCard({ food, isSelected, onSelect }: FoodCardProps): React.ReactElement {
  return (
    <button
      onClick={onSelect}
      className={`bg-white border-2 rounded-lg p-4 transition hover:shadow-lg ${
        isSelected
          ? 'border-primary-600 shadow-lg'
          : 'border-gray-200 hover:border-primary-300'
      }`}
    >
      {food.image_url && (
        <img
          src={food.thumbnail_url || food.image_url}
          alt={food.nameEn}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      )}
      <h3 className="font-semibold text-gray-800 arabic text-lg">{food.nameAr}</h3>
      <p className="text-sm text-gray-600">{food.nameEn}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-primary-700 font-semibold">{food.calories} kcal/100g</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{food.category}</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-xs text-gray-600">
        <span>{'\uD83D\uDCAA'} {food.protein}g</span>
        <span>{'\uD83C\uDF5E'} {food.carbs}g</span>
        <span>{'\uD83E\uDDC8'} {food.fat}g</span>
        <span>{'\uD83C\uDF3E'} {food.fiber}g</span>
      </div>
    </button>
  );
}
