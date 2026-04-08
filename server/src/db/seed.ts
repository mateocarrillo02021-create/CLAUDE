import { db } from './index';
import { users, maestros } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await db
    .insert(users)
    .values([
      {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin',
        active: true,
      },
      {
        username: 'papeles',
        password: await bcrypt.hash('papeles123', 10),
        name: 'Encargado Papeles',
        role: 'papeles',
        active: true,
      },
      {
        username: 'avaluador',
        password: await bcrypt.hash('avaluador123', 10),
        name: 'Avaluador',
        role: 'avaluador',
        active: true,
      },
      {
        username: 'vendedor',
        password: await bcrypt.hash('vendedor123', 10),
        name: 'Vendedor',
        role: 'vendedor',
        active: true,
      },
    ])
    .onConflictDoNothing();

  // Create default maestros
  await db
    .insert(maestros)
    .values([
      { nombre: 'Maestro Aníbal', especialidad: 'Pintura y Enderezado', activo: true },
      { nombre: 'Maestro Carlos', especialidad: 'Mecánica General', activo: true },
      { nombre: 'Maestro Luis', especialidad: 'Electricidad', activo: true },
    ])
    .onConflictDoNothing();

  console.log('Seed complete!');
  console.log('Usuarios creados:');
  console.log('  admin / admin123');
  console.log('  papeles / papeles123');
  console.log('  avaluador / avaluador123');
  console.log('  vendedor / vendedor123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
