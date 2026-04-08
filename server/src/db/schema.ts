import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  pgEnum,
  varchar,
  serial,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'papeles', 'avaluador', 'vendedor']);
export const prendasEnum = pgEnum('prendas_status', ['no', 'si_pendiente']);
export const segundaLlaveEnum = pgEnum('segunda_llave_status', ['si', 'no', 'pendiente']);
export const revisionEnum = pgEnum('revision_status', ['si', 'no', 'pendiente']);
export const matriculacionEnum = pgEnum('matriculacion_status', ['por_matricular', 'matriculado']);
export const vehicleStatusEnum = pgEnum('vehicle_status', [
  'disponible',
  'en_arreglo',
  'vendido',
  'reservado',
]);
export const repairStatusEnum = pgEnum('repair_status', [
  'en_proceso',
  'completado',
  'cancelado',
]);
export const saleTypeEnum = pgEnum('sale_type', ['contado', 'credito']);
export const paymentPeriodEnum = pgEnum('payment_period', ['semanal', 'quincenal', 'mensual']);
export const notifTypeEnum = pgEnum('notif_type', [
  'nueva_venta',
  'arreglo_completado',
  'nuevo_abono',
  'alerta',
]);

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('vendedor'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Maestros
export const maestros = pgTable('maestros', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  especialidad: text('especialidad'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Vehicles
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  placa: varchar('placa', { length: 20 }).notNull().unique(),
  nombreCorto: text('nombre_corto').notNull(),
  precio: numeric('precio', { precision: 12, scale: 2 }).notNull(),
  prendas: prendasEnum('prendas').notNull().default('no'),
  segundaLlave: segundaLlaveEnum('segunda_llave').notNull().default('pendiente'),
  revisionVehicular: revisionEnum('revision_vehicular').notNull().default('pendiente'),
  matriculacion: matriculacionEnum('matriculacion').notNull().default('por_matricular'),
  anioMatriculacion: integer('anio_matriculacion'),
  arreglosNecesarios: text('arreglos_necesarios'),
  repuestosPorComprar: text('repuestos_por_comprar'),
  ubicacion: text('ubicacion'),
  observaciones: text('observaciones'),
  status: vehicleStatusEnum('status').notNull().default('disponible'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Repairs
export const repairs = pgTable('repairs', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  maestroId: integer('maestro_id')
    .notNull()
    .references(() => maestros.id),
  descripcion: text('descripcion'),
  pendientesSeleccionados: text('pendientes_seleccionados'),
  status: repairStatusEnum('status').notNull().default('en_proceso'),
  ubicacionAnterior: text('ubicacion_anterior'),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Sales
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id')
    .notNull()
    .references(() => vehicles.id),
  vendedorId: integer('vendedor_id').references(() => users.id),
  clienteNombre: text('cliente_nombre'),
  tipo: saleTypeEnum('tipo').notNull(),
  precioVenta: numeric('precio_venta', { precision: 12, scale: 2 }).notNull(),
  montoPagado: numeric('monto_pagado', { precision: 12, scale: 2 }).notNull().default('0'),
  periodoPago: paymentPeriodEnum('periodo_pago'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Abonos
export const abonos = pgTable('abonos', {
  id: serial('id').primaryKey(),
  ventaId: integer('venta_id')
    .notNull()
    .references(() => sales.id, { onDelete: 'cascade' }),
  monto: numeric('monto', { precision: 12, scale: 2 }).notNull(),
  registradoPorId: integer('registrado_por_id').references(() => users.id),
  notas: text('notas'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  tipo: notifTypeEnum('tipo').notNull(),
  mensaje: text('mensaje').notNull(),
  usuarioId: integer('usuario_id').references(() => users.id),
  leida: boolean('leida').notNull().default(false),
  datos: text('datos'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
