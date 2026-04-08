import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index';
import { notifications } from '../db/schema';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET notifications for current user (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.json([]);
    }

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.usuarioId, req.user!.id))
      .orderBy(notifications.createdAt);

    res.json(result.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.json({ count: 0 });
    }

    const result = await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.usuarioId, req.user!.id), eq(notifications.leida, false))
      );

    res.json({ count: result.length });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT mark one as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const [updated] = await db
      .update(notifications)
      .set({ leida: true })
      .where(
        and(
          eq(notifications.id, parseInt(req.params.id)),
          eq(notifications.usuarioId, req.user!.id)
        )
      )
      .returning();

    if (!updated) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await db
      .update(notifications)
      .set({ leida: true })
      .where(
        and(eq(notifications.usuarioId, req.user!.id), eq(notifications.leida, false))
      );

    res.json({ message: 'Todas marcadas como leídas' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
