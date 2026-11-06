import type { Franja, Horario } from "../../models/horario";

import { dias, horaTexto } from "../../models/horario";
const minutos = (valor: string) =>
  valor ? Number(valor.slice(0, 2)) * 60 + Number(valor.slice(3)) : -1;

function Franjas({
  grupo,
  cambiar,
  nombre,
}: {
  grupo: Franja[];
  cambiar: (g: Franja[]) => void;
  nombre: string;
}) {
  function modificar(i: number, parte: Partial<Franja>) {
    cambiar(grupo.map((f, j) => (j === i ? { ...f, ...parte } : f)));
  }
  return (
    <div>
      {grupo.map((f, i) => (
        <div className="horario-franja" key={i}>
          <label>
            Desde{" "}
            <input
              type="time"
              aria-label={nombre + " inicio " + (i + 1)}
              value={horaTexto(f.inicio)}
              onChange={(e) =>
                modificar(i, { inicio: minutos(e.target.value) })
              }
            />
          </label>
          <label>
            Hasta{" "}
            <input
              type="time"
              aria-label={nombre + " fin " + (i + 1)}
              value={horaTexto(f.fin === 1440 ? 0 : f.fin)}
              onChange={(e) => {
                const m = minutos(e.target.value);
                modificar(i, { fin: m === 0 ? 1440 : m });
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => cambiar(grupo.filter((_, j) => j !== i))}
          >
            Eliminar franja
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => cambiar([...grupo, { inicio: -1, fin: -1 }])}
      >
        Añadir franja
      </button>
    </div>
  );
}

export function EditorHorario({
  horario,
  cambiar,
  disabled,
}: {
  horario: Horario;
  cambiar: (h: Horario) => void;
  disabled: boolean;
}) {
  function dia(i: number, grupo: Franja[]) {
    cambiar({
      ...horario,
      semana: horario.semana.map((g, j) => (j === i ? grupo : g)),
    });
  }
  function excepcion(
    i: number,
    parte: Partial<Horario["excepciones"][number]>,
  ) {
    cambiar({
      ...horario,
      excepciones: horario.excepciones.map((e, j) =>
        j === i ? { ...e, ...parte } : e,
      ),
    });
  }
  return (
    <details className="form-seccion horario-editor">
      <summary className="form-seccion-titulo">Disponibilidad</summary>
      <fieldset disabled={disabled}>
        <legend>Horario semanal · hora peninsular</legend>
        <p className="form-hint">
          Las franjas se repiten cada semana. Una hora de fin de 00:00 indica el
          final del día.
        </p>
        {dias.map((nombre, i) => (
          <div key={nombre} className="horario-dia">
            <label>
              <input
                type="checkbox"
                checked={!!horario.semana[i].length}
                onChange={(e) =>
                  dia(i, e.target.checked ? [{ inicio: 480, fin: 1200 }] : [])
                }
              />{" "}
              {nombre}
            </label>
            {!!horario.semana[i].length && (
              <Franjas
                nombre={nombre}
                grupo={horario.semana[i]}
                cambiar={(g) => dia(i, g)}
              />
            )}
          </div>
        ))}
      </fieldset>
      <fieldset disabled={disabled}>
        <legend>Excepciones por fecha</legend>
        {horario.excepciones.map((e, i) => (
          <div key={i} className="horario-dia">
            <label>
              Fecha{" "}
              <input
                type="date"
                value={e.fecha}
                onChange={(ev) => excepcion(i, { fecha: ev.target.value })}
              />
            </label>
            <select
              aria-label="Tipo de excepción"
              value={e.modo}
              onChange={(ev) =>
                excepcion(i, { modo: ev.target.value as typeof e.modo })
              }
            >
              <option value="bloquear">Bloquear disponibilidad</option>
              <option value="ofrecer">Sustituir horario del día</option>
            </select>
            {!e.franjas.length && <p>Día completo sin disponibilidad</p>}
            <Franjas
              nombre={e.fecha}
              grupo={e.franjas}
              cambiar={(franjas) => excepcion(i, { franjas })}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                cambiar({
                  ...horario,
                  excepciones: horario.excepciones.filter((_, j) => j !== i),
                })
              }
            >
              Eliminar excepción
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() =>
            cambiar({
              ...horario,
              excepciones: [
                ...horario.excepciones,
                { fecha: "", modo: "bloquear", franjas: [] },
              ],
            })
          }
        >
          Añadir excepción
        </button>
      </fieldset>
    </details>
  );
}
