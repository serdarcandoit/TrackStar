
export interface CoinPrice {
    id: string;
    current_price: number;
    price_change_percentage_24h: number;
    sparkline_in_7d?: {
        price: number[];
    };
    symbol: string;
    name: string;
    image: string;
}

const BASE_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.EXPO_PUBLIC_COINGECKO_API_KEY;

export const CryptoApi = {
    /**
     * Fetch current prices for a list of coin Ids
     * @param coinIds List of coin IDs (e.g. ['bitcoin', 'ethereum'])
     */
    fetchPrices: async (coinIds: string[]): Promise<CoinPrice[]> => {
        if (coinIds.length === 0) return [];

        try {
            const idsParam = coinIds.join(',');
            const response = await fetch(
                `${BASE_URL}/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&sparkline=true&price_change_percentage=24h&x_cg_demo_api_key=${API_KEY}`
            );

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data.map((coin: any) => ({
                id: coin.id,
                current_price: coin.current_price,
                price_change_percentage_24h: coin.price_change_percentage_24h,
                sparkline_in_7d: coin.sparkline_in_7d,
                symbol: coin.symbol,
                name: coin.name,
                image: coin.image,
            }));
        } catch (error) {
            console.error('Error fetching crypto prices:', error);
            // In a real app we might return cached data or an error state
            // For now, return empty array so UI doesn't crash
            return [];
        }
    },

    /**
     * Search for coins (useful for adding new assets)
     * @param query Search query
     */
    searchCoins: async (query: string): Promise<any[]> => {
        try {
            const response = await fetch(`${BASE_URL}/search?query=${query}&x_cg_demo_api_key=${API_KEY}`);
            const data = await response.json();
            return data.coins || [];
        } catch (error) {
            console.error('Error searching coins:', error);
            return [];
        }
    },

    fetchMarketChart: async (id: string, days: string): Promise<number[][]> => {
        try {
            const response = await fetch(`${BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}&x_cg_demo_api_key=${API_KEY}`);
            if (!response.ok) throw new Error('Failed to fetch chart data');
            const data = await response.json();
            return data.prices || [];
        } catch (error) {
            console.error('Error fetching market chart:', error);
            return [];
        }
    }
};
