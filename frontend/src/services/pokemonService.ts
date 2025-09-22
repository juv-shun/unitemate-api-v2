import { Pokemon } from '../types';

const S3_POKEMON_URL = 'https://s3.ap-northeast-1.amazonaws.com/juv-shun.website-hosting/pokemon_master_data/pokemons.json';

const ID_MAPPING: Record<string, string> = {
  'alolan_ninetales': 'ninetales',
  'galarian_rapidash': 'rapidash',
  'alcremie': 'mawhip',
};

const convertPokemonId = (pokemon: Pokemon): Pokemon => {
  const mappedId = ID_MAPPING[pokemon.id];
  return {
    ...pokemon,
    id: mappedId || pokemon.id,
  };
};

export const fetchPokemonData = async (): Promise<Pokemon[]> => {
  try {
    const response = await fetch(S3_POKEMON_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Pokemon[] = await response.json();

    return data.map(convertPokemonId);
  } catch (error) {
    console.error('Failed to fetch pokemon data from S3:', error);
    throw error;
  }
};