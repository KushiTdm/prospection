import type { PlacesSearchResult, DataTier } from '../types';
import { supabase } from '../lib/supabase';

const MOCK_HOTELS = [
  { name: 'Grand Plaza Hotel', types: ['hotel'], region: 'California' },
  { name: 'Oceanview Resort & Spa', types: ['resort'], region: 'Florida' },
  { name: 'Downtown Hostel', types: ['hostel'], region: 'New York' },
  { name: 'Mountain Lodge Inn', types: ['hotel'], region: 'Colorado' },
  { name: 'Seaside Boutique Hotel', types: ['hotel'], region: 'California' },
  { name: 'City Center Suites', types: ['hotel'], region: 'Texas' },
  { name: 'Coastal Adventures Tours', types: ['tour_operator'], region: 'Hawaii' },
  { name: 'Backpacker Haven Hostel', types: ['hostel'], region: 'Oregon' },
  { name: 'Luxury Palace Hotel', types: ['hotel'], region: 'Nevada' },
  { name: 'Budget Stay Inn', types: ['hotel'], region: 'Arizona' },
  { name: 'Wanderlust Travel Agency', types: ['travel_agency'], region: 'Washington' },
  { name: 'Sunset Beach Resort', types: ['resort'], region: 'California' },
  { name: 'Historic District Hotel', types: ['hotel'], region: 'Massachusetts' },
  { name: 'Alpine Ski Lodge', types: ['hotel'], region: 'Vermont' },
  { name: 'Urban Explorer Hostel', types: ['hostel'], region: 'Illinois' },
];

const MOBILE_PHONES = [
  '+1-415-555-0101',
  '+1-213-555-0102',
  '+1-305-555-0103',
  '+1-646-555-0104',
  '+1-720-555-0105',
  '+1-858-555-0106',
  '+1-512-555-0107',
  '+1-808-555-0108',
  '+1-503-555-0109',
  '+1-702-555-0110',
];

const FIXED_PHONES = [
  '+1-800-555-0201',
  '+1-888-555-0202',
  '+1-877-555-0203',
  '+1-866-555-0204',
  '+1-800-555-0205',
];

const generateMockPlaceId = (name: string): string => {
  return `ChIJ${btoa(name).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`;
};

export const searchPlacesByCity = async (
  city: string,
  tier: DataTier = 'Essentials'
): Promise<PlacesSearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  await supabase.from('api_usage').insert({
    api_name: 'google_maps',
    operation_type: 'search',
    quota_used: tier === 'Pro' ? 5 : 1,
  });

  const results: PlacesSearchResult[] = MOCK_HOTELS.map((hotel, index) => {
    const placeId = generateMockPlaceId(`${hotel.name}-${city}`);
    const isProTier = tier === 'Pro';
    const hasMobilePhone = Math.random() > 0.4;

    const result: PlacesSearchResult = {
      place_id: placeId,
      name: hotel.name,
      address: `${100 + index} Main Street, ${city}, ${hotel.region} ${90000 + index}`,
      city,
      region: hotel.region,
      business_type: hotel.types[0] === 'tour_operator'
        ? 'Tour Operator'
        : hotel.types[0] === 'travel_agency'
        ? 'Travel Agency'
        : hotel.types[0] === 'hostel'
        ? 'Hostel'
        : hotel.types[0] === 'resort'
        ? 'Resort'
        : 'Hotel',
      tier,
    };

    if (isProTier) {
      result.phone = hasMobilePhone
        ? MOBILE_PHONES[index % MOBILE_PHONES.length]
        : FIXED_PHONES[index % FIXED_PHONES.length];
      result.website = `https://www.${hotel.name.toLowerCase().replace(/\s+/g, '')}.com`;
      result.rating = 3.5 + Math.random() * 1.5;
      result.reviews_count = Math.floor(50 + Math.random() * 500);
    }

    return result;
  });

  return results.slice(0, Math.floor(5 + Math.random() * 10));
};

export const getApiQuotaUsage = async () => {
  const today = new Date().toISOString().split('T')[0];

  const { data: googleMapsUsage } = await supabase
    .from('api_usage')
    .select('quota_used')
    .eq('api_name', 'google_maps')
    .eq('date', today);

  const { data: airtableUsage } = await supabase
    .from('api_usage')
    .select('quota_used')
    .eq('api_name', 'airtable')
    .eq('date', today);

  const googleMapsTotal = googleMapsUsage?.reduce((sum, record) => sum + record.quota_used, 0) || 0;
  const airtableTotal = airtableUsage?.reduce((sum, record) => sum + record.quota_used, 0) || 0;

  return {
    google_maps: {
      used: googleMapsTotal,
      limit: 1000,
      remaining: Math.max(0, 1000 - googleMapsTotal),
      percentage: (googleMapsTotal / 1000) * 100,
    },
    airtable: {
      used: airtableTotal,
      limit: 5000,
      remaining: Math.max(0, 5000 - airtableTotal),
      percentage: (airtableTotal / 5000) * 100,
    },
  };
};
