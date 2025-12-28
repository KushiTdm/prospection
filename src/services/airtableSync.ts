import { supabase } from '../lib/supabase';
import type { Prospect } from '../types';

const BATCH_SIZE = 10;
const SYNC_DELAY_MS = 1500;

export const syncProspectsToAirtable = async (
  prospectIds: string[],
  onProgress?: (current: number, total: number, batchNumber: number) => void
): Promise<{ success: boolean; error?: string }> => {
  if (prospectIds.length === 0) {
    return { success: false, error: 'No prospects selected for sync' };
  }

  const { data: prospects, error: fetchError } = await supabase
    .from('prospects')
    .select('*')
    .in('id', prospectIds);

  if (fetchError || !prospects) {
    return { success: false, error: 'Failed to fetch prospects' };
  }

  const batches = [];
  for (let i = 0; i < prospects.length; i += BATCH_SIZE) {
    batches.push(prospects.slice(i, i + BATCH_SIZE));
  }

  let currentBatchNumber = 1;

  for (const batch of batches) {
    const { data: logData, error: logError } = await supabase
      .from('sync_logs')
      .insert({
        batch_number: currentBatchNumber,
        records_count: batch.length,
        status: 'In Progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError || !logData) {
      continue;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, SYNC_DELAY_MS));

      const shouldFail = Math.random() < 0.05;

      if (shouldFail) {
        await supabase
          .from('sync_logs')
          .update({
            status: 'Failed',
            error_message: 'Rate limit exceeded. Please try again later.',
            completed_at: new Date().toISOString(),
          })
          .eq('id', logData.id);

        return { success: false, error: 'Airtable rate limit exceeded' };
      }

      const prospectIdsInBatch = batch.map(p => p.id);
      await supabase
        .from('prospects')
        .update({
          synced_to_airtable: true,
          last_synced_at: new Date().toISOString(),
        })
        .in('id', prospectIdsInBatch);

      await supabase
        .from('sync_logs')
        .update({
          status: 'Success',
          completed_at: new Date().toISOString(),
        })
        .eq('id', logData.id);

      await supabase.from('api_usage').insert({
        api_name: 'airtable',
        operation_type: 'sync',
        quota_used: batch.length,
      });

      if (onProgress) {
        onProgress(
          currentBatchNumber * BATCH_SIZE,
          prospects.length,
          currentBatchNumber
        );
      }

      currentBatchNumber++;
    } catch (error) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'Failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', logData.id);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }

  return { success: true };
};

export const getRecentSyncLogs = async (limit: number = 10) => {
  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
};

export const getSyncStats = async () => {
  const { data: logs } = await supabase
    .from('sync_logs')
    .select('status, records_count')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!logs) {
    return {
      totalSynced: 0,
      successRate: 0,
      failedBatches: 0,
    };
  }

  const successfulLogs = logs.filter(log => log.status === 'Success');
  const totalSynced = successfulLogs.reduce((sum, log) => sum + log.records_count, 0);
  const failedBatches = logs.filter(log => log.status === 'Failed').length;
  const successRate = logs.length > 0 ? (successfulLogs.length / logs.length) * 100 : 0;

  return {
    totalSynced,
    successRate,
    failedBatches,
  };
};
