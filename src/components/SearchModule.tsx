import { useState } from 'react';
import { Search, MapPin, Loader2, CheckCircle, Phone, Globe, Star } from 'lucide-react';
import { searchPlacesByCity } from '../services/googleMapsApi';
import { classifyPhoneNumber, formatPhoneNumber } from '../services/phoneValidation';
import { supabase } from '../lib/supabase';
import type { DataTier, PlacesSearchResult } from '../types';

export const SearchModule = () => {
  const [city, setCity] = useState('');
  const [tier, setTier] = useState<DataTier>('Pro');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlacesSearchResult[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setSavedCount(0);

    try {
      const searchResults = await searchPlacesByCity(city, tier);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = async () => {
    setLoading(true);
    let count = 0;

    for (const result of results) {
      const phoneType = result.phone ? classifyPhoneNumber(result.phone) : undefined;
      const formattedPhone = result.phone ? formatPhoneNumber(result.phone) : undefined;

      const { error } = await supabase.from('prospects').upsert(
        {
          place_id: result.place_id,
          name: result.name,
          address: result.address,
          city: result.city,
          region: result.region,
          business_type: result.business_type,
          phone: formattedPhone,
          phone_type: phoneType,
          website: result.website,
          rating: result.rating,
          reviews_count: result.reviews_count || 0,
          status: 'New',
          tier: result.tier,
          synced_to_airtable: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'place_id' }
      );

      if (!error) count++;
    }

    setSavedCount(count);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Discover Hotel Prospects
        </h2>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name (e.g., San Francisco)"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Tier
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTier('Essentials')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  tier === 'Essentials'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                disabled={loading}
              >
                <div className="font-semibold text-gray-900 dark:text-white">Essentials</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Name, Address, Place ID, Type
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTier('Pro')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  tier === 'Pro'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                disabled={loading}
              >
                <div className="font-semibold text-gray-900 dark:text-white">Pro</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  + Phone, Website, Rating, Reviews
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !city.trim()}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Search Hotels
              </>
            )}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Search Results
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Found {results.length} prospects in {city}
              </p>
            </div>
            <button
              onClick={handleSaveResults}
              disabled={loading || savedCount > 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center"
            >
              {savedCount > 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved {savedCount}
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save to Database'
              )}
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {results.map((result) => {
              const phoneType = result.phone ? classifyPhoneNumber(result.phone) : undefined;
              const isMobile = phoneType === 'MOBILE';

              return (
                <div
                  key={result.place_id}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {result.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {result.address}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {result.business_type}
                        </span>
                        {result.tier === 'Pro' && result.phone && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isMobile
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            {phoneType}
                          </span>
                        )}
                      </div>
                    </div>
                    {result.tier === 'Pro' && (
                      <div className="text-right space-y-1">
                        {result.rating && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Star className="w-4 h-4 text-yellow-500 mr-1 fill-current" />
                            {result.rating.toFixed(1)} ({result.reviews_count})
                          </div>
                        )}
                        {result.phone && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatPhoneNumber(result.phone)}
                          </div>
                        )}
                        {result.website && (
                          <a
                            href={result.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center justify-end"
                          >
                            <Globe className="w-3 h-3 mr-1" />
                            Website
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
