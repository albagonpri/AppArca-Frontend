import React, { useState, useEffect, useRef } from "react";
import type { VehiculoCatalogo } from "../../models/vehiculo.model";
import { buscarVehiculosCatalogo } from "../../services/catalogo-vehiculos.service";
import { obtenerTextoPropulsion } from "../../models/vehiculo.model";

interface Props {
  onSeleccionar: (vehiculo: VehiculoCatalogo) => void;
  vehiculoSeleccionado?: VehiculoCatalogo | null;
  onLimpiarSeleccion?: () => void;
  deshabilitado?: boolean;
}

export const BuscadorCatalogoVehiculo: React.FC<Props> = ({
  onSeleccionar,
  vehiculoSeleccionado,
  onLimpiarSeleccion,
  deshabilitado = false,
}) => {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<VehiculoCatalogo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [desplegableAbierto, setDesplegableAbierto] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Cerrar desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setDesplegableAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    const terminoLimpio = termino.trim();
    if (terminoLimpio.length < 2) {
      return;
    }

    const temporizador = setTimeout(async () => {
      setCargando(true);
      try {
        const datos = await buscarVehiculosCatalogo(terminoLimpio, 12);
        setResultados(datos);
        setBusquedaRealizada(true);
        setDesplegableAbierto(true);
      } catch (err) {
        console.error("Error al buscar en el catálogo:", err);
        setResultados([]);
      } finally {
        setCargando(false);
      }
    }, 280);

    return () => clearTimeout(temporizador);
  }, [termino]);

  const handleSeleccionarItem = (item: VehiculoCatalogo) => {
    onSeleccionar(item);
    setDesplegableAbierto(false);
    setTermino("");
  };

  const handleLimpiar = () => {
    setTermino("");
    setResultados([]);
    setDesplegableAbierto(false);
    setBusquedaRealizada(false);
    if (onLimpiarSeleccion) {
      onLimpiarSeleccion();
    }
  };

  return (
    <div className="buscador-catalogo-wrapper" ref={contenedorRef}>
      <div className="buscador-catalogo-header">
        <label htmlFor="input-buscador-catalogo" className="buscador-catalogo-label">
          🔍 Autocompletar con catálogo de vehículos
        </label>
        <span className="buscador-catalogo-ayuda">
          Escribe tu modelo para rellenar automáticamente dimensiones y datos técnicos
        </span>
      </div>

      {vehiculoSeleccionado ? (
        <div className="catalogo-seleccionado-card">
          <div className="catalogo-seleccionado-info">
            <span className="badge-exito-catalogo">✓ Modelo seleccionado</span>
            <div className="catalogo-seleccionado-nombre">
              <strong>
                {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
              </strong>{" "}
              {vehiculoSeleccionado.anyoInicio && (
                <span className="catalogo-anyo">({vehiculoSeleccionado.anyoInicio})</span>
              )}
              {vehiculoSeleccionado.version && (
                <span className="catalogo-version"> — {vehiculoSeleccionado.version}</span>
              )}
            </div>
            <div className="catalogo-seleccionado-detalles">
              {vehiculoSeleccionado.tipoPropulsion && (
                <span className="pill-propulsion">
                  {obtenerTextoPropulsion(vehiculoSeleccionado.tipoPropulsion)}
                </span>
              )}
              {vehiculoSeleccionado.esEnchufable && (
                <span className="pill-enchufable">⚡ Enchufable</span>
              )}
              {vehiculoSeleccionado.longitud && (
                <span className="pill-dimension">
                  {vehiculoSeleccionado.longitud}m × {vehiculoSeleccionado.anchura}m ×{" "}
                  {vehiculoSeleccionado.altura}m
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLimpiar}
            disabled={deshabilitado}
            title="Buscar otro modelo en el catálogo"
          >
            Cambiar modelo
          </button>
        </div>
      ) : (
        <div className="buscador-input-container">
          <div className="input-con-icono">
            <input
              id="input-buscador-catalogo"
              type="text"
              className="buscador-catalogo-input"
              placeholder="Ej. Seat Leon, Toyota Corolla, Golf, Peugeot 208, Model 3..."
              value={termino}
              onChange={(e) => {
                const nuevoValor = e.target.value;
                setTermino(nuevoValor);
                if (nuevoValor.trim().length < 2) {
                  setResultados([]);
                  setBusquedaRealizada(false);
                  setDesplegableAbierto(false);
                } else {
                  setDesplegableAbierto(true);
                }
              }}
              onFocus={() => {
                if (resultados.length > 0) setDesplegableAbierto(true);
              }}
              disabled={deshabilitado}
              autoComplete="off"
            />
            {cargando && <span className="buscador-spinner" aria-label="Buscando..." />}
            {termino.length > 0 && !cargando && (
              <button
                type="button"
                className="buscador-btn-limpiar"
                onClick={handleLimpiar}
                aria-label="Borrar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {desplegableAbierto && termino.trim().length >= 2 && (
            <div className="catalogo-dropdown-resultados" role="listbox">
              {cargando && resultados.length === 0 && (
                <div className="catalogo-dropdown-mensaje">
                  <span>Buscando en el catálogo...</span>
                </div>
              )}

              {!cargando && resultados.length === 0 && busquedaRealizada && (
                <div className="catalogo-dropdown-vacio">
                  <p>
                    No se encontraron coincidencias para &ldquo;<strong>{termino}</strong>&rdquo;.
                  </p>
                  <p className="catalogo-dropdown-vacio-sub">
                    Puedes escribir los datos de tu vehículo manualmente a continuación.
                  </p>
                </div>
              )}

              {resultados.map((item) => {
                const tieneDims = item.longitud && item.anchura && item.altura;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="catalogo-dropdown-item"
                    onClick={() => handleSeleccionarItem(item)}
                  >
                    <div className="dropdown-item-header">
                      <span className="dropdown-item-titulo">
                        <strong>{item.marca}</strong> {item.modelo}
                      </span>
                      {item.anyoInicio && (
                        <span className="dropdown-item-anyo">
                          {item.anyoInicio}
                          {item.anyoFin && item.anyoFin !== item.anyoInicio
                            ? ` - ${item.anyoFin}`
                            : ""}
                        </span>
                      )}
                    </div>

                    <div className="dropdown-item-version">
                      {item.version}
                      {item.carroceria ? ` (${item.carroceria})` : ""}
                    </div>

                    <div className="dropdown-item-tags">
                      <span className="tag-propulsion">
                        {obtenerTextoPropulsion(item.tipoPropulsion)}
                      </span>
                      {item.esEnchufable && (
                        <span className="tag-enchufable">⚡ Enchufable</span>
                      )}
                      {item.etiquetaDgtSugerida && (
                        <span className="tag-etiqueta">
                          DGT: {item.etiquetaDgtSugerida}
                          {item.etiquetaDgtFiable ? "" : " (sugerida)"}
                        </span>
                      )}
                      {tieneDims && (
                        <span className="tag-dimensiones">
                          {item.longitud}m × {item.anchura}m × {item.altura}m
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
