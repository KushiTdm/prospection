import { useState, useEffect } from 'react';
import {
  Filter,
  ArrowUpDown,
  Phone,
  Globe,
  Star,
  CheckCircle,
  Loader2,
  Upload,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { syncProspectsToAirtable } from '../services/airtableSync';
import type { Prospect, BusinessType, LeadStatus } from '../types';

export const LeadsTable = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<BusinessType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    fetchProspects();
  }, [filterType, filterStatus, sortBy, sortOrder]);

  const fetchProspects = async () => {
    setLoading(true);

    let query = supabase.from('prospects').select('*');

    if (filterType !== 'All') {
      query = query.eq('business_type', filterType);
    }
    if (filterStatus !== 'All') {
      query = query.eq('status', filterStatus);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch prospects:', error);
    } else {
      setProspects(data || []);
    }

    setLoading(false);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === prospects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prospects.map((p) => p.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    await supabase.from('prospects').update({ status: newStatus }).eq('id', id);
    fetchProspects();
  };

  const handleSync = async () => {
    if (selectedIds.size === 0) return;

    setSyncing(true);
    setSyncProgress({ current: 0, total: selectedIds.size });

    const result = await syncProspectsToAirtable(
      Array.from(selectedIds),
      (current, total, batchNumber) => {
        setSyncProgress({ current, total });
      }
    );

    if (result.success) {
      setSelectedIds(new Set());
      fetchProspects();
    }

    setSyncing(false);
  };

  const toggleSort = (field: 'name' | 'rating' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lead Management
            </h2>
            {selectedIds.size > 0 && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing {syncProgress.current}/{syncProgress.total}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sync {selectedIds.size} to Airtable
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as BusinessType | 'All')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="All">All Types</option>
                <option value="Hotel">Hotel</option>
                <option value="Hostel">Hostel</option>
                <option value="Resort">Resort</option>
                <option value="Tour Operator">Tour Operator</option>
                <option value="Travel Agency">Travel Agency</option>
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'All')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
              <option value="Converted">Converted</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No prospects found. Start by searching for hotels.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === prospects.length && prospects.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Name
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => toggleSort('rating')}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Rating
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sync
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {prospects.map((prospect) => (
                  <tr
                    key={prospect.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(prospect.id)}
                        onChange={() => handleSelectOne(prospect.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {prospect.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {prospect.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {prospect.business_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {prospect.city}, {prospect.region}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {prospect.phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-3 h-3 mr-1" />
                            {prospect.phone}
                            {prospect.phone_type === 'MOBILE' && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                                Mobile
                              </span>
                            )}
                          </div>
                        )}
                        {prospect.website && (
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            <Globe className="w-3 h-3 mr-1" />
                            Website
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {prospect.rating ? (
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Star className="w-4 h-4 text-yellow-500 mr-1 fill-current" />
                          {prospect.rating.toFixed(1)}
                          <span className="text-gray-500 dark:text-gray-400 ml-1">
                            ({prospect.reviews_count})
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={prospect.status}
                        onChange={(e) =>
                          handleStatusChange(prospect.id, e.target.value as LeadStatus)
                        }
                        className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Unqualified">Unqualified</option>
                        <option value="Converted">Converted</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {prospect.synced_to_airtable ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <span className="text-sm text-gray-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
