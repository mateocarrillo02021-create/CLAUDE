import { Router } from 'express';
import { eq, or, ilike, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { vehicles } from '../db/schema';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET all vehicles
router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    let query = db.select().from(vehicles);

    if (search && typeof search === 'string') {
      const like = `%${search}%`;
      const results = await db
        .select()
        .from(vehicles)
        .where(or(ilike(vehicles.placa, like), ilike(vehicles.nombreCorto, like)));
      return res.json(results);
    }

    const all = await query;
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET one vehicle
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, parseInt(req.params.id)));
    if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST create vehicle
router.post('/', authenticate, async (req, res) => {
  try {
    const { role } = req.user!;
    if (!['admin', 'avaluador'].includes(role)) {
      return res.status(403).json({ error: 'Sin permisos para crear vehículos' });
    }

    const {
      placa,
      nombreCorto,
      precio,
      prendas,
      segundaLlave,
      revisionVehicular,
      matriculacion,
      anioMatriculacion,
      arreglosNecesarios,
      repuestosPorComprar,
      ubicacion,
      observaciones,
    } = req.body;

    if (!placa || !nombreCorto || !precio) {
      return res.status(400).json({ error: 'Placa, nombre corto y precio son obligatorios' });
    }

    const [vehicle] = await db
      .insert(vehicles)
      .values({
        placa: placa.toUpperCase(),
        nombreCorto,
        precio: String(precio),
        prendas: prendas || 'no',
        segundaLlave: segundaLlave || 'pendiente',
        revisionVehicular: revisionVehicular || 'pendiente',
        matriculacion: matriculacion || 'por_matricular',
        anioMatriculacion: anioMatriculacion || null,
        arreglosNecesarios: arreglosNecesarios || null,
        repuestosPorComprar: repuestosPorComprar || null,
        ubicacion: ubicacion || null,
        observaciones: observaciones || null,
      })
      .returning();

    res.status(201).json(vehicle);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'La placa ya está registrada' });
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT update vehicle
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { role } = req.user!;
    if (!['admin', 'avaluador'].includes(role)) {
      return res.status(403).json({ error: 'Sin permisos para editar vehículos' });
    }

    const id = parseInt(req.params.id);
    const updateData: any = { ...req.body, updatedAt: new Date() };

    if (updateData.placa) updateData.placa = updateData.placa.toUpperCase();
    if (updateData.precio) updateData.precio = String(updateData.precio);

    const [updated] = await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE vehicle
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar vehículos' });
    }

    const [deleted] = await db
      .delete(vehicles)
      .where(eq(vehicles.id, parseInt(req.params.id)))
      .returning();

    if (!deleted) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json({ message: 'Vehículo eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
