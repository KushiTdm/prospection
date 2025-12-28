import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, TrendingUp, Phone, MapPin, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getApiQuotaUsage } from '../services/googleMapsApi';
import type { AnalyticsData } from '../types';

const COLORS = {
  mobile: '#10b981',
  fixedLine: '#6b7280',
  unknown: '#ef4444',
};

export const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [quotaData, setQuotaData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    const { data: prospects } = await supabase.from('prospects').select('*');

    if (!prospects) {
      setLoading(false);
      return;
    }

    const mobileCount = prospects.filter((p) => p.phone_type === 'MOBILE').length;
    const fixedLineCount = prospects.filter((p) => p.phone_type === 'FIXED_LINE').length;
    const unknownCount = prospects.filter(
      (p) => !p.phone_type || p.phone_type === 'UNKNOWN'
    ).length;

    const regionCounts = prospects.reduce((acc, p) => {
      acc[p.region] = (acc[p.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const geographicDensity = Object.entries(regionCounts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const typeCounts = prospects.reduce((acc, p) => {
      acc[p.business_type] = (acc[p.business_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leadsByType = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
    }));

    setAnalytics({
      qualificationRate: {
        mobile: mobileCount,
        fixedLine: fixedLineCount,
        unknown: unknownCount,
      },
      geographicDensity,
      leadsByType,
    });

    const quota = await getApiQuotaUsage();
    setQuotaData(quota);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No analytics data available
      </div>
    );
  }

  const total =
    analytics.qualificationRate.mobile +
    analytics.qualificationRate.fixedLine +
    analytics.qualificationRate.unknown;

  const pieData = [
    {
      name: 'Mobile',
      value: analytics.qualificationRate.mobile,
      percentage: total > 0 ? (analytics.qualificationRate.mobile / total) * 100 : 0,
    },
    {
      name: 'Fixed Line',
      value: analytics.qualificationRate.fixedLine,
      percentage: total > 0 ? (analytics.qualificationRate.fixedLine / total) * 100 : 0,
    },
    {
      name: 'Unknown',
      value: analytics.qualificationRate.unknown,
      percentage: total > 0 ? (analytics.qualificationRate.unknown / total) * 100 : 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Insights into your prospecting performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mobile Numbers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics.qualificationRate.mobile}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {total > 0
                  ? ((analytics.qualificationRate.mobile / total) * 100).toFixed(1)
                  : 0}
                % of total
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Regions Covered</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {analytics.geographicDensity.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            Phone Number Qualification Rate
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'Mobile'
                          ? COLORS.mobile
                          : entry.name === 'Fixed Line'
                          ? COLORS.fixedLine
                          : COLORS.unknown
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            Geographic Density
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.geographicDensity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="region"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            Leads by Business Type
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.leadsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="type"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            API Quota Tracker
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Google Maps API
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {quotaData?.google_maps.used || 0} / {quotaData?.google_maps.limit || 1000}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(quotaData?.google_maps.percentage || 0, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {quotaData?.google_maps.remaining || 0} requests remaining
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Airtable API
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {quotaData?.airtable.used || 0} / {quotaData?.airtable.limit || 5000}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(quotaData?.airtable.percentage || 0, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {quotaData?.airtable.remaining || 0} operations remaining
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Quota resets daily at midnight UTC
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
