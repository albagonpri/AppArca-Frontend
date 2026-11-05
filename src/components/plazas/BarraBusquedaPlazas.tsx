import React, { useState } from 'react';
import type { FiltrosPlazasConsulta } from '../../models/plaza.model';

export type OpcionTriEstado = 'SI' | 'NO' | 'INDIFERENTE';

export interface ValoresFiltrosForm {
  q: string;
  provincia: string;
  municipio: string;
  codigoPostal: string;
  cubierta: OpcionTriEstado;
  cargador: OpcionTriEstado;
  camaras: OpcionTriEstado;
  entradaDificil: OpcionTriEstado;
  largoMin: string;
  anchoMin: string;
  precioMin: string;
  precioMax: string;
}

export const VALORES_INICIALES_FILTROS: ValoresFiltrosForm = {
  q: '',
  provincia: '',
  municipio: '',
  codigoPostal: '',
  cubierta: 'INDIFERENTE',
  cargador: 'INDIFERENTE',
  camaras: 'INDIFERENTE',
  entradaDificil: 'INDIFERENTE',
  largoMin: '',
  anchoMin: '',
  precioMin: '',
  precioMax: '',
};

interface Props {
  filtrosAplicados: FiltrosPlazasConsulta;
  onBuscar: (filtrosNuevos: FiltrosPlazasConsulta) => void;
  onLimpiar: () => void;
  cargando?: boolean;
}

export const BarraBusquedaPlazas: React.FC<Props> = ({
  filtrosAplicados,
  onBuscar,
  onLimpiar,
  cargando = false,
}) => {
  const [panelAbierto, setPanelAbierto] = useState<boolean>(false);
  const [textoBusqueda, setTextoBusqueda] = useState<string>(filtrosAplicados.q || '');

  // Estado del formulario dentro del panel de filtros
  const [filtrosForm, setFiltrosForm] = useState<ValoresFiltrosForm>({
    q: filtrosAplicados.q || '',
    provincia: filtrosAplicados.provincia || '',
    municipio: filtrosAplicados.municipio || '',
    codigoPostal: filtrosAplicados.codigoPostal || '',
    cubierta:
      filtrosAplicados.estaCubierta === true
        ? 'SI'
        : filtrosAplicados.estaCubierta === false
          ? 'NO'
          : 'INDIFERENTE',
    cargador:
      filtrosAplicados.tieneCargadorElectrico === true
        ? 'SI'
        : filtrosAplicados.tieneCargadorElectrico === false
          ? 'NO'
          : 'INDIFERENTE',
    camaras:
      filtrosAplicados.tieneCamaras === true
        ? 'SI'
        : filtrosAplicados.tieneCamaras === false
          ? 'NO'
          : 'INDIFERENTE',
    entradaDificil:
      filtrosAplicados.entradaDificil === true
        ? 'SI'
        : filtrosAplicados.entradaDificil === false
          ? 'NO'
          : 'INDIFERENTE',
    largoMin: filtrosAplicados.largoMin != null ? String(filtrosAplicados.largoMin) : '',
    anchoMin: filtrosAplicados.anchoMin != null ? String(filtrosAplicados.anchoMin) : '',
    precioMin: filtrosAplicados.precioMin != null ? String(filtrosAplicados.precioMin) : '',
    precioMax: filtrosAplicados.precioMax != null ? String(filtrosAplicados.precioMax) : '',
  });

  // Cuenta de filtros activos avanzados (excluyendo q)
  const contarFiltrosActivos = (): number => {
    let cuenta = 0;
    if (filtrosAplicados.provincia) cuenta++;
    if (filtrosAplicados.municipio) cuenta++;
    if (filtrosAplicados.codigoPostal) cuenta++;
    if (filtrosAplicados.estaCubierta !== undefined) cuenta++;
    if (filtrosAplicados.tieneCargadorElectrico !== undefined) cuenta++;
    if (filtrosAplicados.tieneCamaras !== undefined) cuenta++;
    if (filtrosAplicados.entradaDificil !== undefined) cuenta++;
    if (filtrosAplicados.largoMin !== undefined) cuenta++;
    if (filtrosAplicados.anchoMin !== undefined) cuenta++;
    if (filtrosAplicados.precioMin !== undefined) cuenta++;
    if (filtrosAplicados.precioMax !== undefined) cuenta++;
    return cuenta;
  };

  const filtrosActivosTotal = contarFiltrosActivos();

  // Búsqueda rápida desde la barra principal
  const handleEjecutarBusquedaRapida = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nuevosFiltros: FiltrosPlazasConsulta = {
      ...filtrosAplicados,
      page: 1,
      q: textoBusqueda.trim() || undefined,
    };
    onBuscar(nuevosFiltros);
  };

  // Aplicar filtros avanzados desde el panel
  const handleAplicarFiltrosAvanzados = (e: React.FormEvent) => {
    e.preventDefault();

    const parsingPositivo = (val: string): number | undefined => {
      const limpio = val.trim().replace(',', '.');
      if (!limpio) return undefined;
      const num = parseFloat(limpio);
      return !isNaN(num) && num >= 0 ? num : undefined;
    };

    const nuevosFiltros: FiltrosPlazasConsulta = {
      page: 1,
      limit: filtrosAplicados.limit,
      q: textoBusqueda.trim() || undefined,
      provincia: filtrosForm.provincia.trim() || undefined,
      municipio: filtrosForm.municipio.trim() || undefined,
      codigoPostal: filtrosForm.codigoPostal.trim() || undefined,
      estaCubierta:
        filtrosForm.cubierta === 'SI'
          ? true
          : filtrosForm.cubierta === 'NO'
            ? false
            : undefined,
      tieneCargadorElectrico:
        filtrosForm.cargador === 'SI'
          ? true
          : filtrosForm.cargador === 'NO'
            ? false
            : undefined,
      tieneCamaras:
        filtrosForm.camaras === 'SI'
          ? true
          : filtrosForm.camaras === 'NO'
            ? false
            : undefined,
      entradaDificil:
        filtrosForm.entradaDificil === 'SI'
          ? true
          : filtrosForm.entradaDificil === 'NO'
            ? false
            : undefined,
      largoMin: parsingPositivo(filtrosForm.largoMin),
      anchoMin: parsingPositivo(filtrosForm.anchoMin),
      precioMin: parsingPositivo(filtrosForm.precioMin),
      precioMax: parsingPositivo(filtrosForm.precioMax),
    };

    onBuscar(nuevosFiltros);
    setPanelAbierto(false);
  };

  const handleLimpiarFiltros = () => {
    setTextoBusqueda('');
    setFiltrosForm(VALORES_INICIALES_FILTROS);
    onLimpiar();
  };

  return (
    <div className="busqueda-plazas-contenedor">
      {/* ── Barra de búsqueda visible ── */}
      <form onSubmit={handleEjecutarBusquedaRapida} className="barra-busqueda-plazas">
        <div className="barra-busqueda-input-wrapper">
          <span className="barra-busqueda-icono" aria-hidden="true">
            🔍
          </span>
          <input
            id="buscador-ubicacion-plazas"
            type="text"
            className="barra-busqueda-input"
            placeholder="¿Dónde quieres aparcar? (municipio, provincia, CP...)"
            value={textoBusqueda}
            onChange={(e) => setTextoBusqueda(e.target.value)}
            disabled={cargando}
            aria-label="¿Dónde quieres aparcar?"
          />
          {textoBusqueda && (
            <button
              type="button"
              className="barra-busqueda-limpiar-btn"
              onClick={() => {
                setTextoBusqueda('');
                onBuscar({ ...filtrosAplicados, page: 1, q: undefined });
              }}
              aria-label="Limpiar texto de búsqueda"
              title="Borrar texto"
            >
              ×
            </button>
          )}
        </div>

        <div className="barra-busqueda-botones">
          <button
            type="submit"
            className="btn btn-primary barra-btn-buscar"
            disabled={cargando}
          >
            <span>Buscar</span>
          </button>

          <button
            type="button"
            className={`btn btn-secondary barra-btn-filtros ${panelAbierto ? 'activo' : ''}`}
            onClick={() => setPanelAbierto(!panelAbierto)}
            aria-expanded={panelAbierto}
            aria-controls="panel-filtros-avanzados"
          >
            <span aria-hidden="true">⚙️</span>
            <span>Filtros</span>
            {filtrosActivosTotal > 0 && (
              <span className="badge-filtros-contador" title={`${filtrosActivosTotal} filtros activos`}>
                {filtrosActivosTotal}
              </span>
            )}
          </button>
        </div>
      </form>

      {/* ── Panel de filtros desplegable ── */}
      {panelAbierto && (
        <div id="panel-filtros-avanzados" className="panel-filtros-desplegable" role="region" aria-label="Filtros de búsqueda de plazas">
          <div className="panel-filtros-header">
            <h3 className="panel-filtros-titulo">Filtros avanzados</h3>
            <button
              type="button"
              className="panel-filtros-cerrar"
              onClick={() => setPanelAbierto(false)}
              aria-label="Cerrar panel de filtros"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleAplicarFiltrosAvanzados} className="panel-filtros-body">
            {/* Bloque 1: Ubicación */}
            <div className="panel-filtros-seccion">
              <h4 className="panel-seccion-subtitulo">Ubicación</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="filtro-provincia">Provincia</label>
                  <input
                    id="filtro-provincia"
                    type="text"
                    placeholder="Ej. Madrid, Asturias, Barcelona"
                    value={filtrosForm.provincia}
                    onChange={(e) =>
                      setFiltrosForm({ ...filtrosForm, provincia: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="filtro-municipio">Municipio / Localidad</label>
                  <input
                    id="filtro-municipio"
                    type="text"
                    placeholder="Ej. Gijón, Vigo, Ourense"
                    value={filtrosForm.municipio}
                    onChange={(e) =>
                      setFiltrosForm({ ...filtrosForm, municipio: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="filtro-cp">Código Postal</label>
                  <input
                    id="filtro-cp"
                    type="text"
                    placeholder="Ej. 28013, 33201"
                    maxLength={10}
                    value={filtrosForm.codigoPostal}
                    onChange={(e) =>
                      setFiltrosForm({ ...filtrosForm, codigoPostal: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Bloque 2: Características de la plaza */}
            <div className="panel-filtros-seccion">
              <h4 className="panel-seccion-subtitulo">Características de la plaza</h4>
              <div className="form-grid">
                {/* Plaza cubierta */}
                <div className="form-group">
                  <label>Plaza cubierta</label>
                  <div className="selector-triestado" role="radiogroup">
                    {(['INDIFERENTE', 'SI', 'NO'] as const).map((opc) => (
                      <button
                        key={opc}
                        type="button"
                        className={`triestado-btn ${filtrosForm.cubierta === opc ? 'activo' : ''}`}
                        onClick={() => setFiltrosForm({ ...filtrosForm, cubierta: opc })}
                      >
                        {opc === 'INDIFERENTE' ? 'Indiferente' : opc === 'SI' ? 'Sí' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cargador eléctrico */}
                <div className="form-group">
                  <label>Cargador eléctrico</label>
                  <div className="selector-triestado" role="radiogroup">
                    {(['INDIFERENTE', 'SI', 'NO'] as const).map((opc) => (
                      <button
                        key={opc}
                        type="button"
                        className={`triestado-btn ${filtrosForm.cargador === opc ? 'activo' : ''}`}
                        onClick={() => setFiltrosForm({ ...filtrosForm, cargador: opc })}
                      >
                        {opc === 'INDIFERENTE' ? 'Indiferente' : opc === 'SI' ? 'Sí' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cámaras de seguridad */}
                <div className="form-group">
                  <label>Cámaras de seguridad</label>
                  <div className="selector-triestado" role="radiogroup">
                    {(['INDIFERENTE', 'SI', 'NO'] as const).map((opc) => (
                      <button
                        key={opc}
                        type="button"
                        className={`triestado-btn ${filtrosForm.camaras === opc ? 'activo' : ''}`}
                        onClick={() => setFiltrosForm({ ...filtrosForm, camaras: opc })}
                      >
                        {opc === 'INDIFERENTE' ? 'Indiferente' : opc === 'SI' ? 'Sí' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entrada difícil */}
                <div className="form-group">
                  <label>Entrada difícil</label>
                  <div className="selector-triestado" role="radiogroup">
                    {(['INDIFERENTE', 'SI', 'NO'] as const).map((opc) => (
                      <button
                        key={opc}
                        type="button"
                        className={`triestado-btn ${filtrosForm.entradaDificil === opc ? 'activo' : ''}`}
                        onClick={() => setFiltrosForm({ ...filtrosForm, entradaDificil: opc })}
                      >
                        {opc === 'INDIFERENTE' ? 'Indiferente' : opc === 'SI' ? 'Sí' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 3: Dimensiones y Precio */}
            <div className="panel-filtros-seccion">
              <div className="form-grid">
                {/* Dimensiones */}
                <div className="form-group">
                  <label htmlFor="filtro-largo-min">Largo mínimo (m)</label>
                  <input
                    id="filtro-largo-min"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ej. 4.5"
                    value={filtrosForm.largoMin}
                    onChange={(e) =>
                      setFiltrosForm({ ...filtrosForm, largoMin: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="filtro-ancho-min">Ancho mínimo (m)</label>
                  <input
                    id="filtro-ancho-min"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ej. 2.2"
                    value={filtrosForm.anchoMin}
                    onChange={(e) =>
                      setFiltrosForm({ ...filtrosForm, anchoMin: e.target.value })
                    }
                  />
                </div>

                {/* Precio */}
                <div className="form-group">
                  <label htmlFor="filtro-precio-min">Precio mín. (€/h)</label>
                  <input
                    id="filtro-precio-min"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Ej. 1.0"
                    value={filtrosForm.precioMin}
                    onChange={(e) =>
                      setFiltrosForm({ ...filtrosForm, precioMin: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="filtro-precio-max">Precio máx. (€/h)</label>
                  <input
                    id="filtro-precio-max"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Ej. 5.0"
                    value={filtrosForm.precioMax}
                    onChange={(e) =>
                      setFiltrosForm({ ...filtrosForm, precioMax: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción del panel */}
            <div className="panel-filtros-acciones">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLimpiarFiltros}
                disabled={cargando}
              >
                Limpiar filtros
              </button>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPanelAbierto(false)}
                  disabled={cargando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={cargando}
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
