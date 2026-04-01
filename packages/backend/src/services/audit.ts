import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import type { AuditLog, AuditFilters } from '../types';

interface InsertOpts {
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

async function insertAuditLog(opts: InsertOpts): Promise<void> {
  const { userId, action, resource, details, ipAddress } = opts;
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId ?? null,
    action,
    resource,
    details: details ?? null,
    ip_address: ipAddress ?? null,
  });
  if (error) {
    logger.error('Failed to write audit log', { error, action, resource, userId });
  }
}

function mapRow(row: Record<string, unknown>): AuditLog {
  return {
    id: row.id as string,
    timestamp: new Date(row.timestamp as string),
    userId: (row.user_id as string | null) ?? undefined,
    action: row.action as string,
    resource: row.resource as string,
    details: (row.details as Record<string, unknown>) ?? {},
    ipAddress: (row.ip_address as string | null) ?? undefined,
  };
}

export const AuditLogger = {
  async logUserAction(
    userId: string,
    action: string,
    resource: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
  ): Promise<void> {
    await insertAuditLog({ userId, action, resource, details, ipAddress });
  },

  async logSystemEvent(event: string, details: Record<string, unknown>): Promise<void> {
    await insertAuditLog({ action: event, resource: 'system', details });
  },

  async logError(error: Error, context: Record<string, unknown>): Promise<void> {
    await insertAuditLog({
      action: 'error',
      resource: 'system',
      details: { message: error.message, stack: error.stack, ...context },
    });
  },

  async getAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters.userId)    query = query.eq('user_id', filters.userId);
    if (filters.action)    query = query.eq('action', filters.action);
    if (filters.resource)  query = query.eq('resource', filters.resource);
    if (filters.startDate) query = query.gte('timestamp', filters.startDate.toISOString());
    if (filters.endDate)   query = query.lte('timestamp', filters.endDate.toISOString());

    const { data, error } = await query;
    if (error) {
      logger.error('Failed to retrieve audit logs', { error, filters });
      throw new Error(`Failed to retrieve audit logs: ${error.message}`);
    }
    return (data ?? []).map(mapRow);
  },

  async exportAuditLogs(startDate: Date, endDate: Date): Promise<string> {
    const logs = await AuditLogger.getAuditLogs({ startDate, endDate });
    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v).replace(/"/g, '""');
      return `"${s}"`;
    };
    const header = 'id,timestamp,user_id,action,resource,details,ip_address';
    if (logs.length === 0) return header + '\n';
    const rows = logs.map((l) =>
      [
        escape(l.id),
        escape(l.timestamp.toISOString()),
        escape(l.userId ?? ''),
        escape(l.action),
        escape(l.resource),
        escape(JSON.stringify(l.details)),
        escape(l.ipAddress ?? ''),
      ].join(','),
    );
    return [header, ...rows].join('\n') + '\n';
  },
};
