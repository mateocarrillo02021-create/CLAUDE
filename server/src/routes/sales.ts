import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { sales, abonos, vehicles, users, notifications } from '../db/schema';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET all sales
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db
      .select({
        sale: sales,
        vehicle: {
          id: vehicles.id,
          placa: vehicles.placa,
          nombreCorto: vehicles.nombreCorto,
        },
        vendedor: {
          id: users.id,
          name: users.name,
        },
      })
      .from(sales)
      .leftJoin(vehicles, eq(sales.vehicleId, vehicles.id))
      .leftJoin(users, eq(sales.vendedorId, users.id));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET one sale with abonos
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [result] = await db
      .select({
        sale: sales,
        vehicle: {
          id: vehicles.id,
          placa: vehicles.placa,
          nombreCorto: vehicles.nombreCorto,
        },
      })
      .from(sales)
      .leftJoin(vehicles, eq(sales.vehicleId, vehicles.id))
      .where(eq(sales.id, id));

    if (!result) return res.status(404).json({ error: 'Venta no encontrada' });

    const saleAbonos = await db.select().from(abonos).where(eq(abonos.ventaId, id));
    res.json({ ...result, abonos: saleAbonos });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST create sale
router.post('/', authenticate, async (req, res) => {
  try {
    const { role, id: userId } = req.user!;
    if (!['admin', 'vendedor', 'papeles'].includes(role)) {
      return res.status(403).json({ error: 'Sin permisos para registrar ventas' });
    }

    const { vehicleId, clienteNombre, tipo, precioVenta, montoPagado, periodoPago } = req.body;
    if (!vehicleId || !tipo || !precioVenta) {
      return res.status(400).json({ error: 'Vehículo, tipo y precio de venta son requeridos' });
    }

    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId));
    if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });
    if (vehicle.status === 'vendido') {
      return res.status(409).json({ error: 'El vehículo ya está vendido' });
    }

    const [sale] = await db
      .insert(sales)
      .values({
        vehicleId,
        vendedorId: userId,
        clienteNombre: clienteNombre || null,
        tipo,
        precioVenta: String(precioVenta),
        montoPagado: String(montoPagado || 0),
        periodoPago: periodoPago || null,
      })
      .returning();

    // Update vehicle status
    await db
      .update(vehicles)
      .set({ status: 'vendido', updatedAt: new Date() })
      .where(eq(vehicles.id, vehicleId));

    // Notify admins
    const admins = await db.select().from(users).where(eq(users.role, 'admin'));
    for (const admin of admins) {
      await db.insert(notifications).values({
        tipo: 'nueva_venta',
        mensaje: `Nueva venta: ${vehicle.nombreCorto} (${vehicle.placa}) - $${precioVenta}`,
        usuarioId: admin.id,
        datos: JSON.stringify({ saleId: sale.id, vehicleId }),
      });
    }

    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST add abono
router.post('/:id/abonos', authenticate, async (req, res) => {
  try {
    const { role, id: userId } = req.user!;
    if (!['admin', 'vendedor', 'papeles'].includes(role)) {
      return res.status(403).json({ error: 'Sin permisos para registrar abonos' });
    }

    const ventaId = parseInt(req.params.id);
    const { monto, notas } = req.body;
    if (!monto || monto <= 0) {
      return res.status(400).json({ error: 'Monto válido requerido' });
    }

    const [sale] = await db.select().from(sales).where(eq(sales.id, ventaId));
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });

    const [abono] = await db
      .insert(abonos)
      .values({
        ventaId,
        monto: String(monto),
        registradoPorId: userId,
        notas: notas || null,
      })
      .returning();

    // Update montoPagado
    const newMontoPagado = parseFloat(sale.montoPagado || '0') + parseFloat(monto);
    await db
      .update(sales)
      .set({ montoPagado: String(newMontoPagado) })
      .where(eq(sales.id, ventaId));

    // Notify admins
    const admins = await db.select().from(users).where(eq(users.role, 'admin'));
    for (const admin of admins) {
      await db.insert(notifications).values({
        tipo: 'nuevo_abono',
        mensaje: `Nuevo abono de $${monto} registrado para venta #${ventaId}`,
        usuarioId: admin.id,
        datos: JSON.stringify({ saleId: ventaId, abonoId: abono.id }),
      });
    }

    res.status(201).json(abono);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
