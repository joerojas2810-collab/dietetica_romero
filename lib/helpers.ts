export const money = (v: number) =>
  `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v)}`;

export const compactMoney = (v: number) =>
  v >= 1000000
    ? `$ ${(v / 1000000).toFixed(1).replace('.', ',')}M`
    : money(v);

// Semáforo para Arqueos (Queremos que la diferencia sea CERO)
export const semaforo = (dif: number | null) => {
  if (dif === null) return 'sin-dato';
  if (dif === 0) return 'ok';
  if (Math.abs(dif) <= 1000) return 'warn';
  return 'error';
};

// Semáforo para Metas (Queremos superar la meta, valores positivos)
export const semaforoMeta = (brecha: number | null) => {
  if (brecha === null) return 'sin-dato';
  if (brecha >= 0) return 'ok'; // Superamos o igualamos la meta -> Verde
  if (brecha >= -5000) return 'warn'; // Nos faltó poquito (menos de 5 mil) -> Ámbar
  return 'error'; // Nos faltó bastante -> Rojo
};