import React, { useState } from "react";
import type {
  Vehiculo,
  CrearVehiculoDto,
  ActualizarVehiculoDto,
  EtiquetaAmbiental,
  TipoPropulsion,
  VehiculoCatalogo,
} from "../../models/vehiculo.model";
import {
  OPCIONES_ETIQUETA_AMBIENTAL,
  OPCIONES_TIPO_PROPULSION,
} from "../../models/vehiculo.model";
import { crearVehiculo, actualizarVehiculo } from "../../services/vehiculos.service";
import { BuscadorCatalogoVehiculo } from "./BuscadorCatalogoVehiculo";

interface Props {
  vehiculoAEditar?: Vehiculo | null;
  onExito: (mensaje: string) => void;
  onCancelar: () => void;
}

export const FormularioVehiculo: React.FC<Props> = ({
  vehiculoAEditar,
  onExito,
  onCancelar,
}) => {
  const esEdicion = Boolean(vehiculoAEditar);

  // Campos de identificación
  const [matricula, setMatricula] = useState<string>(vehiculoAEditar?.matricula || "");
  const [marca, setMarca] = useState<string>(vehiculoAEditar?.marca || "");
  const [modelo, setModelo] = useState<string>(vehiculoAEditar?.modelo || "");
  const [anyo, setAnyo] = useState<string>(
    vehiculoAEditar?.anyo != null ? String(vehiculoAEditar.anyo) : "",
  );
  const [version, setVersion] = useState<string>(vehiculoAEditar?.version || "");

  // Dimensiones
  const [longitud, setLongitud] = useState<string>(
    vehiculoAEditar?.longitud != null ? String(vehiculoAEditar.longitud) : "",
  );
  const [anchura, setAnchura] = useState<string>(
    vehiculoAEditar?.anchura != null ? String(vehiculoAEditar.anchura) : "",
  );
  const [altura, setAltura] = useState<string>(
    vehiculoAEditar?.altura != null ? String(vehiculoAEditar.altura) : "",
  );

  // Características ambientales y técnicas
  const [tipoPropulsion, setTipoPropulsion] = useState<string>(
    vehiculoAEditar?.tipoPropulsion || "",
  );
  const [esEnchufable, setEsEnchufable] = useState<boolean>(
    Boolean(vehiculoAEditar?.esEnchufable),
  );
  const [etiquetaAmbiental, setEtiquetaAmbiental] = useState<string>(
    vehiculoAEditar?.etiquetaAmbiental || "",
  );
  const [suspensionBaja, setSuspensionBaja] = useState<boolean>(
    Boolean(vehiculoAEditar?.suspensionBaja),
  );

  // Referencia a catálogo y mensajes
  const [catalogoVehiculoId, setCatalogoVehiculoId] = useState<number | undefined>(
    vehiculoAEditar?.catalogoVehiculoId || undefined,
  );
  const [vehiculoCatalogoSeleccionado, setVehiculoCatalogoSeleccionado] =
    useState<VehiculoCatalogo | null>(
      vehiculoAEditar?.catalogoVehiculo || null,
    );
  const [avisoAutocompletado, setAvisoAutocompletado] = useState<string | null>(null);
  const [avisoEtiqueta, setAvisoEtiqueta] = useState<string | null>(null);

  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const validarNumeroOpcional = (
    valorStr: string,
    nombreCampo: string,
  ): { valido: boolean; numero?: number; errorMsg?: string } => {
    const valorLimpio = valorStr.trim().replace(",", ".");
    if (!valorLimpio) {
      return { valido: true, numero: undefined };
    }
    const num = parseFloat(valorLimpio);
    if (isNaN(num) || num <= 0) {
      return {
        valido: false,
        errorMsg: `${nombreCampo} debe ser un número positivo en metros (por ejemplo, 4.5).`,
      };
    }
    return { valido: true, numero: num };
  };

  const handleSeleccionarCatalogo = (cat: VehiculoCatalogo) => {
    setVehiculoCatalogoSeleccionado(cat);
    setCatalogoVehiculoId(cat.id);

    // Autocompletar datos disponibles
    setMarca(cat.marca || "");
    setModelo(cat.modelo || "");
    if (cat.anyoInicio) setAnyo(String(cat.anyoInicio));
    if (cat.version) setVersion(cat.version);
    if (cat.longitud != null) setLongitud(String(cat.longitud));
    if (cat.anchura != null) setAnchura(String(cat.anchura));
    if (cat.altura != null) setAltura(String(cat.altura));

    setTipoPropulsion(cat.tipoPropulsion || "");
    setEsEnchufable(Boolean(cat.esEnchufable));

    // Tratamiento de etiqueta DGT
    if (cat.etiquetaDgtSugerida) {
      setEtiquetaAmbiental(cat.etiquetaDgtSugerida);
      if (cat.etiquetaDgtFiable) {
        setAvisoEtiqueta(
          `Etiqueta DGT ${cat.etiquetaDgtSugerida} asignada automáticamente. Puedes confirmarla o cambiarla.`,
        );
      } else {
        setAvisoEtiqueta(
          `Sugerencia DGT: ${cat.etiquetaDgtSugerida} (estimada según propulsión y año). Por favor, confirma el distintivo oficial de tu vehículo.`,
        );
      }
    } else {
      setAvisoEtiqueta(
        "No se pudo determinar la etiqueta DGT automáticamente. Por favor, selecciona la tuya.",
      );
    }

    setAvisoAutocompletado(
      `Características de ${cat.marca} ${cat.modelo} autocompletadas con éxito. Puedes revisar o modificar cualquier dato.`,
    );
  };

  const handleLimpiarCatalogo = () => {
    setVehiculoCatalogoSeleccionado(null);
    setCatalogoVehiculoId(undefined);
    setAvisoAutocompletado(null);
    setAvisoEtiqueta(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const matriculaTrim = matricula.trim().toUpperCase();
    const marcaTrim = marca.trim();
    const modeloTrim = modelo.trim();
    const versionTrim = version.trim();

    // Matrícula obligatoria
    if (!matriculaTrim) {
      setError("La matrícula del vehículo es obligatoria.");
      return;
    }

    // Etiqueta ambiental obligatoria
    if (!etiquetaAmbiental) {
      setError("La etiqueta ambiental es obligatoria.");
      return;
    }

    const etiquetaValida = etiquetaAmbiental as EtiquetaAmbiental;

    // Validación de año opcional
    let anyoNum: number | undefined = undefined;
    if (anyo.trim()) {
      const a = parseInt(anyo.trim(), 10);
      if (isNaN(a) || a < 1900 || a > new Date().getFullYear() + 2) {
        setError("El año debe ser un año válido (por ejemplo, 2021).");
        return;
      }
      anyoNum = a;
    }

    // Validación de dimensiones en metros
    const valLongitud = validarNumeroOpcional(longitud, "La longitud");
    if (!valLongitud.valido) {
      setError(valLongitud.errorMsg || "Longitud inválida");
      return;
    }

    const valAnchura = validarNumeroOpcional(anchura, "La anchura");
    if (!valAnchura.valido) {
      setError(valAnchura.errorMsg || "Anchura inválida");
      return;
    }

    const valAltura = validarNumeroOpcional(altura, "La altura");
    if (!valAltura.valido) {
      setError(valAltura.errorMsg || "Altura inválida");
      return;
    }

    const tipoPropulsionValido = (tipoPropulsion as TipoPropulsion) || undefined;
    const identificador =
      [marcaTrim, modeloTrim].filter(Boolean).join(" ") || matriculaTrim;

    try {
      setCargando(true);

      if (esEdicion && vehiculoAEditar) {
        const dtoActualizar: ActualizarVehiculoDto = {
          matricula: matriculaTrim || undefined,
          etiquetaAmbiental: etiquetaValida,
          marca: marcaTrim || undefined,
          modelo: modeloTrim || undefined,
          anyo: anyoNum,
          version: versionTrim || undefined,
          tipoPropulsion: tipoPropulsionValido,
          esEnchufable,
          longitud: valLongitud.numero,
          anchura: valAnchura.numero,
          altura: valAltura.numero,
          suspensionBaja,
          catalogoVehiculoId,
        };

        await actualizarVehiculo(vehiculoAEditar.id, dtoActualizar);
        onExito(`Vehículo ${identificador} actualizado correctamente.`);
      } else {
        const dtoCrear: CrearVehiculoDto = {
          matricula: matriculaTrim,
          etiquetaAmbiental: etiquetaValida,
          marca: marcaTrim || undefined,
          modelo: modeloTrim || undefined,
          anyo: anyoNum,
          version: versionTrim || undefined,
          tipoPropulsion: tipoPropulsionValido,
          esEnchufable,
          longitud: valLongitud.numero,
          anchura: valAnchura.numero,
          altura: valAltura.numero,
          suspensionBaja,
          catalogoVehiculoId,
        };

        await crearVehiculo(dtoCrear);
        onExito(`Vehículo ${identificador} registrado con éxito.`);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ha ocurrido un error inesperado al procesar el vehículo.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="mensaje-alerta mensaje-error" role="alert">
          {error}
        </div>
      )}

      {/* Buscador de autocompletado desde el catálogo */}
      <BuscadorCatalogoVehiculo
        onSeleccionar={handleSeleccionarCatalogo}
        vehiculoSeleccionado={vehiculoCatalogoSeleccionado}
        onLimpiarSeleccion={handleLimpiarCatalogo}
        deshabilitado={cargando}
      />

      {avisoAutocompletado && (
        <div className="mensaje-alerta mensaje-info" role="status">
          {avisoAutocompletado}
        </div>
      )}

      {avisoEtiqueta && (
        <div className="mensaje-alerta mensaje-aviso-dgt" role="status">
          ℹ️ {avisoEtiqueta}
        </div>
      )}

      {/* Bloque 1: Identificación básica */}
      <div className="formulario-subseccion">
        <h4 className="formulario-subtitulo">Identificación del vehículo</h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="vehiculo-matricula">
              Matrícula <span className="campo-requerido">*</span>
            </label>
            <input
              id="vehiculo-matricula"
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.toUpperCase())}
              placeholder="Ej. 1234ABC"
              required
              disabled={cargando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehiculo-marca">Marca (opcional)</label>
            <input
              id="vehiculo-marca"
              type="text"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Ej. Toyota, Seat, Volkswagen"
              disabled={cargando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehiculo-modelo">Modelo (opcional)</label>
            <input
              id="vehiculo-modelo"
              type="text"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Ej. Corolla, Ibiza, Golf"
              disabled={cargando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehiculo-anyo">Año de fabricación (opcional)</label>
            <input
              id="vehiculo-anyo"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 2}
              value={anyo}
              onChange={(e) => setAnyo(e.target.value)}
              placeholder="Ej. 2021"
              disabled={cargando}
            />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="vehiculo-version">Versión o motorización (opcional)</label>
            <input
              id="vehiculo-version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Ej. 1.8L 122H Active Tech, 1.0 TSI 110 CV, Dual Motor..."
              disabled={cargando}
            />
          </div>
        </div>
      </div>

      {/* Bloque 2: Dimensiones técnicas */}
      <div className="formulario-subseccion">
        <h4 className="formulario-subtitulo">
          Dimensiones técnicas (para comprobación con plazas)
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="vehiculo-longitud">Longitud (m)</label>
            <input
              id="vehiculo-longitud"
              type="number"
              step="0.01"
              min="0"
              value={longitud}
              onChange={(e) => setLongitud(e.target.value)}
              placeholder="Ej. 4.63"
              disabled={cargando}
            />
            <span className="form-hint">En metros. Ej. 4.63</span>
          </div>

          <div className="form-group">
            <label htmlFor="vehiculo-anchura">Anchura (m)</label>
            <input
              id="vehiculo-anchura"
              type="number"
              step="0.01"
              min="0"
              value={anchura}
              onChange={(e) => setAnchura(e.target.value)}
              placeholder="Ej. 1.78"
              disabled={cargando}
            />
            <span className="form-hint">En metros. Ej. 1.78</span>
          </div>

          <div className="form-group">
            <label htmlFor="vehiculo-altura">Altura (m)</label>
            <input
              id="vehiculo-altura"
              type="number"
              step="0.01"
              min="0"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="Ej. 1.45"
              disabled={cargando}
            />
            <span className="form-hint">En metros. Ej. 1.45</span>
          </div>
        </div>
      </div>

      {/* Bloque 3: Propulsión y etiqueta ambiental */}
      <div className="formulario-subseccion">
        <h4 className="formulario-subtitulo">Características ambientales y propulsión</h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="vehiculo-propulsion">Tipo de combustible o propulsión</label>
            <select
              id="vehiculo-propulsion"
              value={tipoPropulsion}
              onChange={(e) => setTipoPropulsion(e.target.value)}
              disabled={cargando}
            >
              <option value="">-- No especificado --</option>
              {OPCIONES_TIPO_PROPULSION.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.texto}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="vehiculo-etiqueta">
              Etiqueta ambiental DGT <span className="campo-requerido">*</span>
            </label>
            <select
              id="vehiculo-etiqueta"
              value={etiquetaAmbiental}
              onChange={(e) => setEtiquetaAmbiental(e.target.value)}
              required
              disabled={cargando}
            >
              <option value="">-- Selecciona una etiqueta --</option>
              {OPCIONES_ETIQUETA_AMBIENTAL.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.texto}
                </option>
              ))}
            </select>
            <span className="form-hint">
              Siempre confirmable y editable por el usuario.
            </span>
          </div>

          <div className="form-group form-group-checkbox">
            <label htmlFor="vehiculo-enchufable" className="checkbox-label">
              <input
                id="vehiculo-enchufable"
                type="checkbox"
                checked={esEnchufable}
                onChange={(e) => setEsEnchufable(e.target.checked)}
                disabled={cargando}
              />
              <span>¿Es vehículo enchufable? (PHEV o 100% eléctrico)</span>
            </label>
            <span className="form-hint">
              Permite identificar necesidad de puntos de recarga en plazas.
            </span>
          </div>

          <div className="form-group form-group-checkbox">
            <label htmlFor="vehiculo-suspension" className="checkbox-label">
              <input
                id="vehiculo-suspension"
                type="checkbox"
                checked={suspensionBaja}
                onChange={(e) => setSuspensionBaja(e.target.checked)}
                disabled={cargando}
              />
              <span>¿Tiene suspensión baja?</span>
            </label>
            <span className="form-hint">
              Permite avisar de rampas pronunciadas o badenes al reservar.
            </span>
          </div>
        </div>
      </div>

      <div className="btn-group" style={{ marginTop: "var(--spacing-md)" }}>
        <button type="submit" className="btn btn-accent" disabled={cargando}>
          {cargando
            ? "Guardando..."
            : esEdicion
              ? "Guardar cambios"
              : "Registrar vehículo"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancelar}
          disabled={cargando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
