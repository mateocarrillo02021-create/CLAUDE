export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '$0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatElapsedTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
  return `${diffMins}m`;
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    papeles: 'Papeles',
    avaluador: 'Avaluador',
    vendedor: 'Vendedor',
  };
  return labels[role] || role;
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    disponible: 'Disponible',
    en_arreglo: 'En Arreglo',
    vendido: 'Vendido',
    reservado: 'Reservado',
    en_proceso: 'En Proceso',
    completado: 'Completado',
    cancelado: 'Cancelado',
  };
  return labels[status] || status;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    disponible: 'bg-green-100 text-green-800',
    en_arreglo: 'bg-yellow-100 text-yellow-800',
    vendido: 'bg-blue-100 text-blue-800',
    reservado: 'bg-purple-100 text-purple-800',
    en_proceso: 'bg-orange-100 text-orange-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
    si: 'bg-green-100 text-green-800',
    no: 'bg-red-100 text-red-800',
    pendiente: 'bg-yellow-100 text-yellow-800',
    si_pendiente: 'bg-orange-100 text-orange-800',
    por_matricular: 'bg-gray-100 text-gray-800',
    matriculado: 'bg-green-100 text-green-800',
    contado: 'bg-blue-100 text-blue-800',
    credito: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function prendasLabel(v: string): string {
  return v === 'no' ? 'No' : 'Sí, pendiente';
}

export function matriculacionLabel(v: string, anio?: number | null): string {
  if (v === 'matriculado') return anio ? `Matriculado ${anio}` : 'Matriculado';
  return 'Por matricular';
}
