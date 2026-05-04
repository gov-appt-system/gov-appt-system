import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/inAppNotification';
import { logger } from '../config/logger';

const router: RouterType = Router();

// All notification routes require authentication
router.use(authenticateToken);

/**
 * GET /api/notifications — List notifications for the current user.
 *
 * Query params:
 *   unreadOnly — "true" to return only unread notifications
 *   limit      — max number of notifications to return (default 50)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

    const notifications = await getNotifications(userId, { unreadOnly, limit });
    res.json(notifications);
  } catch (err) {
    logger.error('GET /api/notifications failed', { error: (err as Error).message });
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/unread-count — Get unread notification count.
 */
router.get('/unread-count', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch (err) {
    logger.error('GET /api/notifications/unread-count failed', {
      error: (err as Error).message,
    });
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * PUT /api/notifications/read-all — Mark all notifications as read.
 */
router.put('/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const success = await markAllAsRead(userId);
    if (!success) {
      res.status(500).json({ error: 'Failed to mark all as read' });
      return;
    }
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    logger.error('PUT /api/notifications/read-all failed', {
      error: (err as Error).message,
    });
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * PUT /api/notifications/:id/read — Mark a single notification as read.
 */
router.put('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const success = await markAsRead(id, userId);
    if (!success) {
      res.status(500).json({ error: 'Failed to mark notification as read' });
      return;
    }
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    logger.error('PUT /api/notifications/:id/read failed', {
      error: (err as Error).message,
    });
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
