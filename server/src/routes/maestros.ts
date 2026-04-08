import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { maestros } from '../db/schema';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET all maestros
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.select().from(maestros).where(eq(maestros.activo, true));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET all maestros (including inactive) - admin only
router.get('/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.select().from(maestros);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST create maestro
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, especialidad } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    const [maestro] = await db
      .insert(maestros)
      .values({ nombre, especialidad: especialidad || null })
      .returning();

    res.status(201).json(maestro);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT update maestro
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, especialidad, activo } = req.body;

    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (especialidad !== undefined) updateData.especialidad = especialidad;
    if (activo !== undefined) updateData.activo = activo;

    const [updated] = await db
      .update(maestros)
      .set(updateData)
      .where(eq(maestros.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Maestro no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
