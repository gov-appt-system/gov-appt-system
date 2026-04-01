import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import type { AuditLog, AuditFilters } from '../types';

// ============================================================
// AuditLogger
// Inserts immutable rows into audit_logs; no update/delete paths.
// ============================================================

async function insertAuditLog(
  userId: string | undefined,
  action: string,
  resource: string,
  details: Record<string, unknown> | undefined,
  ipAddress: string | undefined,
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId ?? null,
    action,
    resource,
    details: details ?? null,
    ip_address: ipAddress ?? null,
  });

  if (error) {
    // Log to Winston but do not throw — audit failures must not break the caller
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
  /**
   * Record an action performed by an authenticated user.
   * Requirements: 3.7, 6.8, 7.6, 9.2, 9.3
   */
  async logUserAction(
    userId: string,
    action: string,
    resource: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
  ): Promise<void> {
    await insertAuditLog(userId, action, resource, details, ipAddress);
  },

  /**
   * Record a system-generated event (no human actor).
   * Requirements: 9.2, 9.3
   */
  async logSystemEvent(
    event: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    await insertAuditLog(undefined, event, 'system', details, undefined);
  },

  /**
   * Record an application error with context for troubleshooting.
   * Requirements: 9.4
   */
  async logError(error: Error, context: Record<string, unknown>): Promise<void> {
    await insertAuditLog(undefined, 'error', 'system', {
      message: error.message,
      stack: error.stack,
      ...context,
    }, undefined);
  },

  /**
   * Query audit logs with optional filters.
   * Requirements: 9.5
   */
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

  /**
   * Export audit logs for a date range as a CSV string.
   * Requirements: 9.5
   */
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
