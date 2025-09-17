import React from 'react';
import { EnhancedPokemonStats } from '../types';

interface StatsTableProps {
  stats: EnhancedPokemonStats[];
  totalGames: number;
}

export const StatsTable: React.FC<StatsTableProps> = ({ stats, totalGames }) => {
  if (stats.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <p className="text-center text-gray-500">データがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          ポケモン統計 (総試合数: {totalGames.toLocaleString()}試合)
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ポケモン
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タイプ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                試合数
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                勝数
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                勝率
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.map((stat, index) => (
              <tr key={stat.pokemon} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <img
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                        src={stat.pokemonInfo.imageUrl}
                        alt={stat.pokemonInfo.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMjQiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOUIxMEUzIi8+Cjwvc3ZnPgo8L3N2Zz4K';
                        }}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.pokemonInfo.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stat.pokemon}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(stat.pokemonInfo.type)}`}>
                    {stat.pokemonInfo.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                  {stat.number_of_games.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {stat.number_of_wins.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <span className={`font-medium ${getWinRateColor(stat.winRate)}`}>
                    {stat.winRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getTypeColor = (type: string): string => {
  const typeColors: Record<string, string> = {
    'アタック型': 'bg-red-100 text-red-800',
    'バランス型': 'bg-purple-100 text-purple-800',
    'スピード型': 'bg-blue-100 text-blue-800',
    'ディフェンス型': 'bg-green-100 text-green-800',
    'サポート型': 'bg-yellow-100 text-yellow-800',
  };
  return typeColors[type] || 'bg-gray-100 text-gray-800';
};

const getWinRateColor = (winRate: number): string => {
  if (winRate >= 60) return 'text-green-600';
  if (winRate >= 50) return 'text-yellow-600';
  return 'text-red-600';
};