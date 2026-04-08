import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { repairs, vehicles, maestros, notifications, users } from '../db/schema';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET all repairs with vehicle and maestro info
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db
      .select({
        repair: repairs,
        vehicle: {
          id: vehicles.id,
          placa: vehicles.placa,
          nombreCorto: vehicles.nombreCorto,
          ubicacion: vehicles.ubicacion,
        },
        maestro: {
          id: maestros.id,
          nombre: maestros.nombre,
          especialidad: maestros.especialidad,
        },
      })
      .from(repairs)
      .leftJoin(vehicles, eq(repairs.vehicleId, vehicles.id))
      .leftJoin(maestros, eq(repairs.maestroId, maestros.id));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET one repair
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [result] = await db
      .select({
        repair: repairs,
        vehicle: {
          id: vehicles.id,
          placa: vehicles.placa,
          nombreCorto: vehicles.nombreCorto,
          ubicacion: vehicles.ubicacion,
        },
        maestro: {
          id: maestros.id,
          nombre: maestros.nombre,
        },
      })
      .from(repairs)
      .leftJoin(vehicles, eq(repairs.vehicleId, vehicles.id))
      .leftJoin(maestros, eq(repairs.maestroId, maestros.id))
      .where(eq(repairs.id, parseInt(req.params.id)));

    if (!result) return res.status(404).json({ error: 'Arreglo no encontrado' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST create repair
router.post('/', authenticate, async (req, res) => {
  try {
    const { role } = req.user!;
    if (!['admin', 'avaluador'].includes(role)) {
      return res.status(403).json({ error: 'Sin permisos para registrar arreglos' });
    }

    const { vehicleId, maestroId, descripcion, pendientesSeleccionados } = req.body;
    if (!vehicleId || !maestroId) {
      return res.status(400).json({ error: 'Vehículo y maestro son requeridos' });
    }

    // Save previous location and update vehicle status
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId));
    if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });

    const [repair] = await db
      .insert(repairs)
      .values({
        vehicleId,
        maestroId,
        descripcion: descripcion || null,
        pendientesSeleccionados: pendientesSeleccionados || null,
        ubicacionAnterior: vehicle.ubicacion,
        assignedAt: new Date(),
      })
      .returning();

    // Update vehicle status
    await db
      .update(vehicles)
      .set({ status: 'en_arreglo', updatedAt: new Date() })
      .where(eq(vehicles.id, vehicleId));

    res.status(201).json(repair);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT update repair status
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { role } = req.user!;
    if (!['admin', 'avaluador'].includes(role)) {
      return res.status(403).json({ error: 'Sin permisos para actualizar arreglos' });
    }

    const id = parseInt(req.params.id);
    const { status, descripcion, pendientesSeleccionados } = req.body;

    const updateData: any = {};
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (pendientesSeleccionados !== undefined)
      updateData.pendientesSeleccionados = pendientesSeleccionados;
    if (status) {
      updateData.status = status;
      if (status === 'completado') {
        updateData.completedAt = new Date();

        // Get repair to restore vehicle status and notify admins
        const [repair] = await db.select().from(repairs).where(eq(repairs.id, id));
        if (repair) {
          const [vehicle] = await db
            .select()
            .from(vehicles)
            .where(eq(vehicles.id, repair.vehicleId));

          await db
            .update(vehicles)
            .set({
              status: 'disponible',
              ubicacion: repair.ubicacionAnterior,
              updatedAt: new Date(),
            })
            .where(eq(vehicles.id, repair.vehicleId));

          // Notify all admins
          const admins = await db
            .select()
            .from(users)
            .where(eq(users.role, 'admin'));

          for (const admin of admins) {
            await db.insert(notifications).values({
              tipo: 'arreglo_completado',
              mensaje: `Arreglo completado: ${vehicle?.nombreCorto || 'Vehículo'} (${vehicle?.placa || ''})`,
              usuarioId: admin.id,
              datos: JSON.stringify({ repairId: id, vehicleId: repair.vehicleId }),
            });
          }
        }
      }
    }

    const [updated] = await db
      .update(repairs)
      .set(updateData)
      .where(eq(repairs.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Arreglo no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE repair
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar arreglos' });
    }

    const [deleted] = await db
      .delete(repairs)
      .where(eq(repairs.id, parseInt(req.params.id)))
      .returning();

    if (!deleted) return res.status(404).json({ error: 'Arreglo no encontrado' });
    res.json({ message: 'Arreglo eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
