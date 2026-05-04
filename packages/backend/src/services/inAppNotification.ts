/**
 * In-App Notification Service
 * Creates, fetches, and manages in-app notification records stored in the
 * `notifications` table. Works alongside the email notification service
 * to provide dual-channel notifications.
 */

import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import { AppNotification, NotificationType } from '../types';

// ============================================================
// Create notification
// ============================================================

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'info',
  metadata: Record<string, unknown> = {},
): Promise<AppNotification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      metadata,
    })
    .select('*')
    .single();

  if (error) {
    logger.error('createNotification: insert failed', {
      error: error.message,
      userId,
      title,
    });
    return null;
  }

  return mapRow(data as Record<string, unknown>);
}

// ============================================================
// Fetch notifications for a user
// ============================================================

export async function getNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {},
): Promise<AppNotification[]> {
  const { unreadOnly = false, limit = 50 } = options;

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('getNotifications: query failed', {
      error: error.message,
      userId,
    });
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapRow(row));
}

// ============================================================
// Get unread count
// ============================================================

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    logger.error('getUnreadCount: query failed', {
      error: error.message,
      userId,
    });
    return 0;
  }

  return count ?? 0;
}

// ============================================================
// Mark as read
// ============================================================

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    logger.error('markAsRead: update failed', {
      error: error.message,
      notificationId,
      userId,
    });
    return false;
  }

  return true;
}

// ============================================================
// Mark all as read
// ============================================================

export async function markAllAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    logger.error('markAllAsRead: update failed', {
      error: error.message,
      userId,
    });
    return false;
  }

  return true;
}

// ============================================================
// Row mapper
// ============================================================

function mapRow(row: Record<string, unknown>): AppNotification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    message: row.message as string,
    type: row.type as NotificationType,
    read: row.read as boolean,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
  };
}
