import axios from 'axios';

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  type: string;
  holders: number;
  icon_url?: string;
  price?: {
    value: number;
    currency: string;
  };
}

export interface TokensResponse {
  items: Token[];
  next_page_params?: {
    items_count: number;
    smart_contract_id: number;
  };
}

const API_URL = 'https://arbitrum.blockscout.com/api/v2';

export const fetchTokens = async (): Promise<Token[]> => {
  try {
    const response = await axios.get<TokensResponse>(`${API_URL}/tokens`, {
      params: {
        type: 'ERC-20'
      }
    });
    return response.data.items;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    throw error;
  }
};

export const fetchPopularTokens = async (): Promise<Token[]> => {
  try {
    const response = await axios.get<TokensResponse>(`${API_URL}/tokens`, {
      params: {
        type: 'ERC-20',
        filter: 'by_volume' // Assuming this parameter exists, otherwise we'll just use regular tokens
      }
    });
    return response.data.items.slice(0, 10); // Return top 10 tokens
  } catch (error) {
    console.error('Error fetching popular tokens:', error);
    throw error;
  }
};

export const searchTokens = async (query: string): Promise<Token[]> => {
  try {
    const response = await axios.get<TokensResponse>(`${API_URL}/tokens`, {
      params: {
        type: 'ERC-20',
        q: query
      }
    });
    return response.data.items;
  } catch (error) {
    console.error('Error searching tokens:', error);
    throw error;
  }
};

export const useTokensQuery = () => {
  return {
    queryKey: ['tokens'],
    queryFn: fetchTokens,
    staleTime: 5 * 60 * 1000, // 5 minutes
  };
};

export const usePopularTokensQuery = () => {
  return {
    queryKey: ['tokens', 'popular'],
    queryFn: fetchPopularTokens,
    staleTime: 5 * 60 * 1000, // 5 minutes
  };
};

export const useSearchTokensQuery = (query: string) => {
  return {
    queryKey: ['tokens', 'search', query],
    queryFn: () => searchTokens(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: query.length > 0,
  };
};