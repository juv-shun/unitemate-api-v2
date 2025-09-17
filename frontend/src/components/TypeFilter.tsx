import React from 'react';
import { PokemonType } from '../types';

interface TypeFilterProps {
  selectedType: PokemonType;
  onTypeChange: (type: PokemonType) => void;
}

const POKEMON_TYPES: PokemonType[] = [
  'すべて',
  'アタック型',
  'バランス型',
  'スピード型',
  'ディフェンス型',
  'サポート型',
];

export const TypeFilter: React.FC<TypeFilterProps> = ({
  selectedType,
  onTypeChange,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">タイプフィルター</h2>

      <div className="flex flex-wrap gap-2">
        {POKEMON_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === type
                ? getSelectedTypeStyle(type)
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

const getSelectedTypeStyle = (type: PokemonType): string => {
  const typeStyles: Record<PokemonType, string> = {
    'すべて': 'bg-gray-600 text-white',
    'アタック型': 'bg-red-600 text-white',
    'バランス型': 'bg-yellow-600 text-white',
    'スピード型': 'bg-green-600 text-white',
    'ディフェンス型': 'bg-blue-600 text-white',
    'サポート型': 'bg-purple-600 text-white',
  };
  return typeStyles[type];
};