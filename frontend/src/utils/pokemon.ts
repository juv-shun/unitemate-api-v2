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
      if (stat.pokemon === 'unknown' || stat.pokemon === '') {
        return null;
      }

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
  const eightDaysAgo = getJSTDate(-8);
  const oneDayAgo = getJSTDate(-1);

  return (
    start >= eightDaysAgo &&
    start <= oneDayAgo &&
    end >= eightDaysAgo &&
    end <= oneDayAgo &&
    start <= end
  );
};

export const getJSTDate = (daysOffset: number = 0): Date => {
  const now = new Date();
  const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  jstDate.setUTCDate(jstDate.getUTCDate() + daysOffset);
  jstDate.setUTCHours(0, 0, 0, 0);
  return jstDate;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDefaultDateRange = () => {
  const endDate = getJSTDate(-1);
  const startDate = getJSTDate(-7);

  return {
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
  };
};