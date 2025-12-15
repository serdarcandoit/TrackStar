
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

console.log('--- API DEBUG ---');
console.log('API Key Loaded:', API_KEY ? 'YES' : 'NO');
if (API_KEY) console.log('Key Prefix:', API_KEY.substring(0, 5));
console.log('-----------------');

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
                const text = await response.text();
                console.error(`Fetch Prices failed: ${response.status} ${text}`);
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
            return [];
        }
    },

    /**
     * Search for coins (useful for adding new assets)
     * Returns object with results or error message.
     */
    searchCoins: async (query: string): Promise<{ results: any[], error?: string }> => {
        // Debug Log
        console.log('--- SEARCHING COINS ---');
        console.log('API Key available:', !!API_KEY);
        if (API_KEY) console.log('Key Prefix:', API_KEY.substring(0, 5));

        try {
            const response = await fetch(`${BASE_URL}/search?query=${query}&x_cg_demo_api_key=${API_KEY}`);

            if (!response.ok) {
                const text = await response.text();
                console.error(`Search failed: ${response.status} ${text}`);

                if (response.status === 429) {
                    return { results: [], error: "Too many requests. Please wait a moment." };
                }
                return { results: [], error: "Failed to fetch coins." };
            }

            const data = await response.json();
            return { results: data.coins || [] };
        } catch (error) {
            console.error('Error searching coins:', error);
            return { results: [], error: "Network error occurred." };
        }
    },

    fetchMarketChart: async (id: string, days: string): Promise<number[][]> => {
        try {
            const response = await fetch(`${BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}&x_cg_demo_api_key=${API_KEY}`);
            if (!response.ok) {
                const text = await response.text();
                console.error(`Fetch Chart failed: ${response.status} ${text}`);
                throw new Error('Failed to fetch chart data');
            }
            const data = await response.json();
            return data.prices || [];
        } catch (error) {
            console.error('Error fetching market chart:', error);
            return [];
        }
    }
};
