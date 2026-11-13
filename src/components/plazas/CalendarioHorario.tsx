import { useState } from "react";
import {
  dias,
  horaTexto,
  type Franja,
  type Excepcion,
} from "../../models/horario";
import "./calendarioHorario.css";

const valida = (f: Franja) =>
  f.inicio >= 0 && f.fin > f.inicio && f.fin <= 1440;

export function BandaHoraria({
  franjas,
  bloqueada = false,
  seleccionar,
  insertar,
}: {
  franjas: Franja[];
  bloqueada?: boolean;
  insertar?: (franja: Franja) => void;
  seleccionar?: (indice: number) => void;
}) {
  const huecos: Franja[] = [];
  if (insertar) {
    let inicio = 0;
    for (const f of franjas
      .filter(valida)
      .sort((a, b) => a.inicio - b.inicio)) {
      if (inicio < f.inicio) huecos.push({ inicio, fin: f.inicio });
      inicio = Math.max(inicio, f.fin);
    }
    if (inicio < 1440) huecos.push({ inicio, fin: 1440 });
  }
  return (
    <div className="cal-banda">
      {huecos.map((h) => (
        <button
          type="button"
          key={h.inicio}
          className="cal-hueco"
          style={{
            left: (100 * h.inicio) / 1440 + "%",
            width: (100 * (h.fin - h.inicio)) / 1440 + "%",
          }}
          aria-label={
            "Añadir franja entre " +
            horaTexto(h.inicio) +
            " y " +
            horaTexto(h.fin)
          }
          onClick={(e) => {
            const caja = e.currentTarget.getBoundingClientRect();
            const minuto = e.detail
              ? h.inicio +
                ((e.clientX - caja.left) / caja.width) * (h.fin - h.inicio)
              : h.inicio;
            const inicio = Math.max(
              h.inicio,
              Math.min(h.fin - 1, Math.floor(minuto / 15) * 15),
            );
            insertar?.({ inicio, fin: Math.min(inicio + 60, h.fin) });
          }}
        />
      ))}
      {franjas.map((f, i) => {
        if (!valida(f)) return null;
        const rango = horaTexto(f.inicio) + "–" + horaTexto(f.fin);
        const props = {
          className: "cal-bloque" + (bloqueada ? " bloqueo" : ""),
          style: {
            left: (100 * f.inicio) / 1440 + "%",
            width: (100 * (f.fin - f.inicio)) / 1440 + "%",
          },
          title: rango,
        };
        return seleccionar ? (
          <button
            key={i}
            type="button"
            {...props}
            aria-label={"Editar " + rango}
            onClick={() => seleccionar(i)}
          />
        ) : (
          <span key={i} {...props} aria-label={rango} />
        );
      })}
    </div>
  );
}

export function Semana({
  semana,
  activo,
  elegir,
  insertar,
}: {
  insertar: (dia: number, franja: Franja) => void;
  semana: Franja[][];
  activo: number;
  elegir: (dia: number, franja?: number) => void;
}) {
  return (
    <div className="cal-semana">
      <div className="cal-escala" aria-hidden="true">
        {["00", "06", "12", "18", "24"].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {dias.map((dia, i) => (
        <div className="cal-fila" key={dia} role="group" aria-label={dia}>
          <button
            type="button"
            aria-pressed={activo === i}
            onClick={() => elegir(i)}
          >
            {dia}
          </button>
          <BandaHoraria
            insertar={(f) => insertar(i, f)}
            franjas={semana[i]}
            seleccionar={(j) => elegir(i, j)}
          />
        </div>
      ))}
      <div className="cal-leyenda">
        <span>Disponible</span>
        <span>Sin disponibilidad</span>
      </div>
    </div>
  );
}

const formatoMes = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const formatoDia = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function Mes({
  fechas,
  seleccionada,
  elegir,
}: {
  fechas: Excepcion[];
  seleccionada: string;
  elegir: (fecha: string) => void;
}) {
  const hoy = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
  }).format(new Date());
  const [mes, setMes] = useState(() => (seleccionada || hoy).slice(0, 7));
  const primero = new Date(mes + "-01T00:00:00Z");
  function desplazar(delta: number) {
    const fecha = new Date(primero);
    fecha.setUTCMonth(fecha.getUTCMonth() + delta);
    setMes(fecha.toISOString().slice(0, 7));
  }
  const huecos = (primero.getUTCDay() + 6) % 7;
  const ultimo = new Date(primero);
  ultimo.setUTCMonth(ultimo.getUTCMonth() + 1, 0);
  return (
    <div className="cal-mes">
      <div className="cal-nav">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => desplazar(-1)}
        >
          ‹
        </button>
        <strong aria-live="polite">{formatoMes.format(primero)}</strong>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => desplazar(1)}
        >
          ›
        </button>
      </div>
      <div className="cal-cuadricula">
        {dias.map((d) => (
          <abbr key={d} title={d}>
            {d.slice(0, 2)}
          </abbr>
        ))}
        {Array.from({ length: ultimo.getUTCDate() }, (_, i) => {
          const fecha = mes + "-" + String(i + 1).padStart(2, "0");
          const disponible = fechas.some(
            (e) => e.fecha === fecha && e.franjas.some(valida),
          );
          return (
            <button
              type="button"
              key={fecha}
              style={i === 0 ? { gridColumnStart: huecos + 1 } : undefined}
              className={disponible ? "ofrecida" : ""}
              aria-pressed={fecha === seleccionada}
              aria-label={
                formatoDia.format(new Date(fecha)) +
                (disponible ? ", disponible" : "")
              }
              onClick={() => elegir(fecha)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="cal-leyenda">
        <span>Disponible</span>
        <span>Sin disponibilidad</span>
      </div>
    </div>
  );
}
