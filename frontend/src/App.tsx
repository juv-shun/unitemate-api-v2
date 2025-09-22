import { useEffect, useState, useCallback } from "react";
import { DateRangeSelector } from "./components/DateRangeSelector";
import { StatsTable } from "./components/StatsTable";
import { TypeFilter } from "./components/TypeFilter";
import {
  DateRange,
  EnhancedPokemonStats,
  PokemonType,
  StatsApiResponse,
} from "./types";
import {
  enhancePokemonStats,
  filterByType,
  getDefaultDateRange,
} from "./utils/pokemon";

function App() {
  const [statsData, setStatsData] = useState<StatsApiResponse | null>(null);
  const [enhancedStats, setEnhancedStats] = useState<EnhancedPokemonStats[]>(
    []
  );
  const [filteredStats, setFilteredStats] = useState<EnhancedPokemonStats[]>(
    []
  );
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [selectedType, setSelectedType] = useState<PokemonType>("すべて");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const apiUrl = process.env.REACT_APP_API_URL;

  const fetchStats = useCallback(async (range: DateRange) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        start_date: range.start_date,
        end_date: range.end_date,
      });

      const response = await fetch(`${apiUrl}/stats?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StatsApiResponse = await response.json();
      setStatsData(data);

      const enhanced = await enhancePokemonStats(data.result_per_pokemon);
      setEnhancedStats(enhanced);
      setFilteredStats(filterByType(enhanced, selectedType));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, selectedType]);

  useEffect(() => {
    fetchStats(dateRange);
  }, [dateRange, fetchStats]);

  useEffect(() => {
    setFilteredStats(filterByType(enhancedStats, selectedType));
  }, [enhancedStats, selectedType]);

  const handleDateRangeApply = () => {
    fetchStats(dateRange);
  };

  const handleTypeChange = (type: PokemonType) => {
    setSelectedType(type);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ユナメイトAPI
          </h1>
        </header>

        <div className="space-y-6 lg:space-y-0 lg:flex lg:justify-between lg:items-start lg:gap-6 mb-6">
          <div className="lg:w-2/5">
            <DateRangeSelector
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onApply={handleDateRangeApply}
            />
          </div>

          <div className="lg:w-3/5">
            <TypeFilter
              selectedType={selectedType}
              onTypeChange={handleTypeChange}
            />
          </div>
        </div>

        {loading && (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">データを読み込んでいます...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  エラーが発生しました
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <p className="mt-1 text-xs text-red-600">API URL: {apiUrl}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && statsData && (
          <StatsTable
            stats={filteredStats}
            totalGames={statsData.number_of_games}
          />
        )}

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Environment: {process.env.NODE_ENV}</p>
          <p>
            集計期間: {statsData?.start_date} 〜 {statsData?.end_date}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
