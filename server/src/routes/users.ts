import { Router } from 'express';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db/index';
import { users } from '../db/schema';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET all users (admin only)
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
      })
      .from(users);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST create user (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({ username, password: hashed, name, role })
      .returning({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
      });

    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT update user (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { username, password, name, role, active } = req.body;

    const updateData: any = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
      });

    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE (deactivate) user (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    const [updated] = await db
      .update(users)
      .set({ active: false })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
