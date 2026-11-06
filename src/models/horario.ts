// Minutos desde medianoche en España peninsular. 1440 representa el final del día.
export type Franja = { inicio: number; fin: number };
export type Excepcion = {
  fecha: string;
  modo: "ofrecer" | "bloquear";
  franjas: Franja[];
};
export type TipoDisponibilidad = "HABITUAL" | "PUNTUAL";
export type Horario = { semana: Franja[][]; excepciones: Excepcion[] };

export function validarHorario(h: Horario, tipo: TipoDisponibilidad = "HABITUAL"): string | null {
  if (
    !h ||
    !Array.isArray(h.semana) ||
    h.semana.length !== 7 ||
    !Array.isArray(h.excepciones)
  )
    return "Configura los siete días de la semana.";
  if (tipo !== "HABITUAL" && tipo !== "PUNTUAL") return "Selecciona el tipo de disponibilidad.";
  if (tipo === "PUNTUAL" && (!h.excepciones.length || h.semana.some(dia => !Array.isArray(dia) || dia.length)))
    return "La disponibilidad puntual requiere fechas concretas y ningún horario semanal.";
  const fechas = new Set<string>();
  for (const e of h.excepciones) {
    if (
      !e ||
      !/^\d{4}-\d{2}-\d{2}$/.test(e.fecha) ||
      !Number.isFinite(Date.parse(e.fecha)) ||
      new Date(e.fecha).toISOString().slice(0, 10) !== e.fecha
    )
      return "Selecciona una fecha válida para cada día.";
    if (fechas.has(e.fecha)) return "Esa fecha ya está configurada.";
    if (tipo === "PUNTUAL" && (e.modo !== "ofrecer" || !Array.isArray(e.franjas) || !e.franjas.length))
      return "Añade al menos una franja disponible para cada fecha.";
    fechas.add(e.fecha);
    if (!["ofrecer", "bloquear"].includes(e.modo))
      return "Selecciona el tipo de excepción.";
  }
  for (const grupo of [...h.semana, ...h.excepciones.map((e) => e.franjas)]) {
    if (!Array.isArray(grupo)) return "Indica las franjas del día.";
    for (const f of grupo) {
      if (
        !f ||
        !Number.isInteger(f.inicio) ||
        !Number.isInteger(f.fin) ||
        f.inicio < 0 ||
        f.fin > 1440 ||
        f.fin <= f.inicio
      )
        return "La hora de fin debe ser posterior al inicio. Divide los horarios nocturnos entre los dos días.";
    }
    const ordenadas = [...grupo].sort((a, b) => a.inicio - b.inicio);
    if (ordenadas.some((f, i) => i > 0 && f.inicio < ordenadas[i - 1].fin))
      return "Hay franjas solapadas en el mismo día.";
  }
  return null;
}

export function franjasDelDia(h: Horario, fecha: string): Franja[] {
  const base = h.semana[(new Date(fecha).getUTCDay() + 6) % 7];
  const excepcion = h.excepciones.find((e) => e.fecha === fecha);
  if (!excepcion) return [...base];
  if (excepcion.modo === "ofrecer") return [...excepcion.franjas];
  if (!excepcion.franjas.length) return [];
  let disponibles = base;
  for (const bloqueo of excepcion.franjas) {
    disponibles = disponibles.flatMap((f) =>
      [
        { inicio: f.inicio, fin: Math.min(f.fin, bloqueo.inicio) },
        { inicio: Math.max(f.inicio, bloqueo.fin), fin: f.fin },
      ].filter((parte) => parte.inicio < parte.fin),
    );
  }
  return disponibles;
}

const madrid = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
});

export function cubrePeriodo(
  config: Horario | null | undefined,
  inicio: Date,
  fin: Date,
): boolean {
  if (!config) return true;
  const h = config;
  const semanaCompleta = h.semana.every(
    (dia) => dia.reduce((suma, f) => suma + f.fin - f.inicio, 0) === 1440,
  );
  if (semanaCompleta) {
    // Solo las fechas excepcionales pueden interrumpir una plaza abierta toda la semana.
    return h.excepciones.every((e) => {
      const medianocheUTC = Date.parse(e.fecha);
      const desde = Math.max(+inicio, medianocheUTC - 2 * 3600000);
      const hasta = Math.min(+fin, medianocheUTC + 24 * 3600000);
      return desde >= hasta || comprobarHoras(h, desde, hasta);
    });
  }
  return comprobarHoras(h, +inicio, +fin);
}

function comprobarHoras(h: Horario, inicio: number, fin: number): boolean {
  const hora = 3600000;
  // Cada segmento UTC conserva tanto el día como la hora civil, incluso al cambiar de huso.
  for (let t = inicio; t < +fin;) {
    const partes = madrid.formatToParts(t);
    const valor = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
    const fecha = [valor('year'), valor('month'), valor('day')].join('-');
    const siguiente = Math.min(+fin, t - (t % hora) + hora);
    let minuto = Number(valor('hour')) * 60 + (t % hora) / 60000;
    const hasta = minuto + (siguiente - t) / 60000;
    for (const f of franjasDelDia(h, fecha).sort(
      (a, b) => a.inicio - b.inicio,
    )) {
      if (f.inicio > minuto) break;
      minuto = Math.max(minuto, f.fin);
    }
    if (minuto < hasta) return false;
    t = siguiente;
  }
  return true;
}

export const dias = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
export const horarioCompleto = (): Horario => ({
  semana: dias.map(() => [{ inicio: 0, fin: 1440 }]),
  excepciones: [],
});
export const horaTexto = (m: number) =>
  m < 0
    ? ""
    : [Math.floor(m / 60), m % 60]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");
