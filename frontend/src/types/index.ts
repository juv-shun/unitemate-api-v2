export interface Pokemon {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
}

export interface PokemonStats {
  pokemon: string;
  number_of_games: number;
  number_of_wins: number;
}

export interface StatsApiResponse {
  number_of_games: number;
  start_date: string;
  end_date: string;
  result_per_pokemon: PokemonStats[];
}

export interface EnhancedPokemonStats extends PokemonStats {
  winRate: number;
  pokemonInfo: Pokemon;
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

export type PokemonType = 'アタック型' | 'バランス型' | 'スピード型' | 'ディフェンス型' | 'サポート型' | 'すべて';