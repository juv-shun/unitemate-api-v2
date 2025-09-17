import { Pokemon, PokemonStats, EnhancedPokemonStats, PokemonType } from '../types';
import pokemonData from '../data/pokemons.json';

export const pokemonMap = new Map<string, Pokemon>(
  pokemonData.map((pokemon: Pokemon) => [pokemon.id, pokemon])
);

export const calculateWinRate = (wins: number, totalGames: number): number => {
  if (totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 100 * 10) / 10;
};

export const enhancePokemonStats = (stats: PokemonStats[]): EnhancedPokemonStats[] => {
  return stats
    .map((stat) => {
      const pokemonInfo = pokemonMap.get(stat.pokemon);
      if (!pokemonInfo) {
        console.warn(`Pokemon not found: ${stat.pokemon}`);
        return null;
      }

      return {
        ...stat,
        winRate: calculateWinRate(stat.number_of_wins, stat.number_of_games),
        pokemonInfo,
      };
    })
    .filter((stat): stat is EnhancedPokemonStats => stat !== null)
    .sort((a, b) => b.number_of_games - a.number_of_games);
};

export const filterByType = (
  stats: EnhancedPokemonStats[],
  type: PokemonType
): EnhancedPokemonStats[] => {
  if (type === 'すべて') return stats;
  return stats.filter(stat => stat.pokemonInfo.type === type);
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  const eightDaysAgo = new Date(today);
  eightDaysAgo.setDate(today.getDate() - 8);
  const oneDayAgo = new Date(today);
  oneDayAgo.setDate(today.getDate() - 1);

  return (
    start >= eightDaysAgo &&
    start <= oneDayAgo &&
    end >= eightDaysAgo &&
    end <= oneDayAgo &&
    start <= end
  );
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDefaultDateRange = () => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 1);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);

  return {
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
  };
};