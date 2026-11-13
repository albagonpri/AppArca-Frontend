import { EditorHorario } from './EditorHorario';
import { type TipoDisponibilidad, cubrePeriodo, horarioCompleto, validarHorario } from '../../models/horario';
import React, { useState, useCallback, useRef } from 'react';
import type {
  Plaza,
  FotoPlaza,
  CrearPlazaDto,
  ActualizarPlazaDto,
  DificultadEntrada,
} from '../../models/plaza.model';
import { MOTIVOS_ENTRADA_DIFICIL } from '../../models/plaza.model';
import {
  crearPlaza,
  actualizarPlaza,
  obtenerReservasPlaza,
  subirFotosPlaza,
  eliminarFotoPlaza,
  obtenerUrlFoto,
} from '../../services/plazas.service';
import {
  obtenerUsuarioSesion,
  obtenerPerfil,
  guardarUsuarioSesion,
} from '../../services/auth.service';
import {
  buscarDireccion,
  direccionDelPunto,
  consultarCodigoPostal,
  type CandidatoGeocodificacion,
} from '../../services/geocodificacion.service';
import { MapaUbicacion, type CoordenadasMapa } from './MapaUbicacion';

interface Props {
  plazaAEditar?: Plaza | null;
  onExito?: (mensaje: string) => void;
  onPlazaCreada?: () => void;
  onCancelar?: () => void;
}

export const FormularioPlaza: React.FC<Props> = ({
  plazaAEditar,
  onExito,
  onPlazaCreada,
  onCancelar,
}) => {
  const esEdicion = Boolean(plazaAEditar);

  const [tipo, setTipo] = useState<TipoDisponibilidad | null>(
    plazaAEditar ? plazaAEditar.tipoDisponibilidad ?? 'HABITUAL' : null
  );
  const [horario, setHorario] = useState(() => plazaAEditar?.horario ?? horarioCompleto());

  // ─── Datos básicos ────────────────────────────────────────
  const [titulo, setTitulo] = useState<string>(plazaAEditar?.titulo || '');
  const [descripcion, setDescripcion] = useState<string>(
    plazaAEditar?.descripcion || '',
  );
  const [precioHora, setPrecioHora] = useState<string>(
    plazaAEditar?.precioHora != null ? String(plazaAEditar.precioHora) : '',
  );

  // ─── Dirección ───────────────────────────────────────────
  const [calle, setCalle] = useState<string>('');
  const [numero, setNumero] = useState<string>('');
  const [codigoPostal, setCodigoPostal] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('');
  const [poblacion, setPoblacion] = useState<string>(plazaAEditar?.poblacion || '');
  const [provincia, setProvincia] = useState<string>('');
  const [modificarDireccion, setModificarDireccion] = useState<boolean>(false);

  // Control de concurrencia y cancelación de peticiones de código postal (anti race condition)
  const peticionCPIdRef = useRef<number>(0);
  const abortCtrlCPRef = useRef<AbortController | null>(null);
  const ciudadModificadaManualmenteRef = useRef<boolean>(false);
  const poblacionModificadaManualmenteRef = useRef<boolean>(false);
  const provinciaModificadaManualmenteRef = useRef<boolean>(false);

  // ─── Geocodificación y mapa ───────────────────────────────
  /**
   * Coordenadas seleccionadas actualmente para la plaza.
   * En edición sin modificar dirección, se inicializan con las de la plaza.
   */
  const [coordenadasMapa, setCoordenadasMapa] = useState<CoordenadasMapa | null>(
    esEdicion && plazaAEditar
      ? { latitud: plazaAEditar.latitud, longitud: plazaAEditar.longitud }
      : null,
  );

  /** true = el usuario ha confirmado explícitamente la ubicación del marcador */
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState<boolean>(
    esEdicion && !modificarDireccion,
  );

  const [candidatos, setCandidatos] = useState<CandidatoGeocodificacion[]>([]);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState<string | null>(null);
  const [buscandoGeo, setBuscandoGeo] = useState<boolean>(false);
  const [errorGeo, setErrorGeo] = useState<string | null>(null);
  const [mensajeGeoExito, setMensajeGeoExito] = useState<string | null>(null);
  const [mostrarCandidatos, setMostrarCandidatos] = useState<boolean>(false);

  // ─── Autocompletado de código postal ─────────────────────
  const [buscandoCP, setBuscandoCP] = useState<boolean>(false);
  const [errorCP, setErrorCP] = useState<string | null>(null);
  const [mensajeCPExito, setMensajeCPExito] = useState<string | null>(null);
  const [poblacionesDisponibles, setPoblacionesDisponibles] = useState<string[]>([]);

  // Referencia para evitar búsquedas automáticas repetidas de la misma dirección al perder foco
  const revisionGeo = useRef(0);
  const puntoConsultado = useRef('');
  const [leyendoDireccion, setLeyendoDireccion] = useState(false);
  const cancelarConsulta = useCallback(() => {
    revisionGeo.current++;
    setLeyendoDireccion(false);
    setBuscandoGeo(false);
  }, []);
  const ultimaDireccionBuscadaRef = useRef<string>('');

  // ─── Dimensiones ──────────────────────────────────────────
  const [largo, setLargo] = useState<string>(
    plazaAEditar?.largo != null ? String(plazaAEditar.largo) : '',
  );
  const [ancho, setAncho] = useState<string>(
    plazaAEditar?.ancho != null ? String(plazaAEditar.ancho) : '',
  );

  // ─── Identificación e indicaciones de acceso ─────────────
  const [numeroPlaza, setNumeroPlaza] = useState<string>(
    plazaAEditar?.numeroPlaza || '',
  );
  const [planta, setPlanta] = useState<string>(
    plazaAEditar?.planta || '',
  );
  const [indicacionesAcceso, setIndicacionesAcceso] = useState<string>(
    plazaAEditar?.indicacionesAcceso || '',
  );

  // ─── Características ──────────────────────────────────────
  const [estaCubierta, setEstaCubierta] = useState<boolean | null>(
    plazaAEditar?.estaCubierta !== undefined ? plazaAEditar.estaCubierta : null,
  );
  const [tieneCargadorElectrico, setTieneCargadorElectrico] = useState<boolean | null>(
    plazaAEditar?.tieneCargadorElectrico !== undefined ? plazaAEditar.tieneCargadorElectrico : null,
  );
  const [tieneCamaras, setTieneCamaras] = useState<boolean | null>(
    plazaAEditar?.tieneCamaras !== undefined ? plazaAEditar.tieneCamaras : null,
  );
  const [entradaDificil, setEntradaDificil] = useState<boolean | null>(
    plazaAEditar?.entradaDificil !== undefined ? plazaAEditar.entradaDificil : null,
  );
  const [dificultadesEntrada, setDificultadesEntrada] = useState<DificultadEntrada[]>(
    plazaAEditar?.dificultadesEntrada ? [...plazaAEditar.dificultadesEntrada] : [],
  );
  const [descripcionEntrada, setDescripcionEntrada] = useState<string>(
    plazaAEditar?.descripcionEntrada || '',
  );
  const [disponible, setDisponible] = useState<boolean>(
    plazaAEditar?.disponible !== undefined ? plazaAEditar.disponible : true,
  );

  // ─── Fotografías de la plaza ───────────────────────────────
  const [fotosExistentes] = useState<FotoPlaza[]>(
    plazaAEditar?.fotos ? [...plazaAEditar.fotos] : [],
  );
  const [fotosNuevas, setFotosNuevas] = useState<File[]>([]);
  const [previewsNuevas, setPreviewsNuevas] = useState<string[]>([]);
  const [fotosAEliminar, setFotosAEliminar] = useState<number[]>([]);
  const [errorFotos, setErrorFotos] = useState<string | null>(null);

  const handleSeleccionarFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorFotos(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const fotosVivasExistentes = fotosExistentes.filter(
      (f) => !fotosAEliminar.includes(f.id),
    ).length;
    const totalFuturo = fotosVivasExistentes + fotosNuevas.length + files.length;

    if (totalFuturo > 5) {
      setErrorFotos(
        `Solo puedes subir un máximo de 5 fotografías por plaza. Actualmente tendrías ${totalFuturo}.`,
      );
      return;
    }

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorFotos(`La imagen "${file.name}" supera el tamaño máximo de 5 MB.`);
        return;
      }
      if (!formatosPermitidos.includes(file.type)) {
        setErrorFotos(
          `El archivo "${file.name}" no es compatible. Formatos admitidos: JPEG, PNG y WebP.`,
        );
        return;
      }
    }

    const nuevosPreviews = files.map((file) => URL.createObjectURL(file));
    setFotosNuevas((prev) => [...prev, ...files]);
    setPreviewsNuevas((prev) => [...prev, ...nuevosPreviews]);

    e.target.value = '';
  };

  const handleQuitarFotoNueva = (index: number) => {
    URL.revokeObjectURL(previewsNuevas[index]);
    setFotosNuevas((prev) => prev.filter((_, i) => i !== index));
    setPreviewsNuevas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMarcarEliminarFotoExistente = (fotoId: number) => {
    setFotosAEliminar((prev) =>
      prev.includes(fotoId) ? prev.filter((id) => id !== fotoId) : [...prev, fotoId],
    );
  };

  // ─── Estado general ───────────────────────────────────────
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────
  const validarNumeroPositivoObligatorio = (
    valorStr: string,
    nombreCampo: string,
  ): { valido: boolean; numero?: number; errorMsg?: string } => {
    const valorLimpio = valorStr.trim().replace(',', '.');
    if (!valorLimpio) {
      return { valido: false, errorMsg: `${nombreCampo} es obligatorio.` };
    }
    const num = parseFloat(valorLimpio);
    if (isNaN(num) || num <= 0) {
      return {
        valido: false,
        errorMsg: `${nombreCampo} debe ser un número positivo (por ejemplo, 5 o 2.4).`,
      };
    }
    return { valido: true, numero: num };
  };

  const handleEntradaDificilChange = (valor: boolean) => {
    setEntradaDificil(valor);
    if (!valor) {
      setDificultadesEntrada([]);
      setDescripcionEntrada('');
    }
  };

  const handleToggleMotivo = (motivoId: DificultadEntrada) => {
    setDificultadesEntrada((prev) => {
      if (prev.includes(motivoId)) {
        if (motivoId === 'OTRA') {
          setDescripcionEntrada('');
        }
        return prev.filter((item) => item !== motivoId);
      } else {
        return [...prev, motivoId];
      }
    });
  };

  /** Invalida la confirmación cuando el usuario modifica cualquier campo de dirección. */
  const invalidarConfirmacion = useCallback(() => {
    cancelarConsulta();
    setUbicacionConfirmada(false);
    setCandidatos([]);
    setMostrarCandidatos(false);
    setCandidatoSeleccionado(null);
    setErrorGeo(null);
    setMensajeGeoExito(null);
  }, [cancelarConsulta]);

  const handleCambioCalle = (v: string) => { setCalle(v); invalidarConfirmacion(); };
  const handleCambioNumero = (v: string) => { setNumero(v); invalidarConfirmacion(); };
  const handleCambioCiudad = (v: string) => {
    setCiudad(v);
    ciudadModificadaManualmenteRef.current = true;
    invalidarConfirmacion();
  };
  const handleCambioPoblacion = (v: string) => {
    setPoblacion(v);
    poblacionModificadaManualmenteRef.current = true;
    invalidarConfirmacion();
  };
  const handleCambioProvincia = (v: string) => {
    setProvincia(v);
    provinciaModificadaManualmenteRef.current = true;
    invalidarConfirmacion();
  };

  /**
   * Autocompletado automático al introducir 5 dígitos de código postal.
   * Evita condiciones de carrera: si el usuario cambia el CP mientras hay una petición en curso,
   * la respuesta desfasada nunca sobrescribe los datos nuevos ni ediciones manuales.
   */
  const ejecutarAutocompletadoCP = async (cp: string) => {
    // Abortar petición en vuelo anterior si existe
    if (abortCtrlCPRef.current) {
      abortCtrlCPRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortCtrlCPRef.current = abortCtrl;
    const idActual = ++peticionCPIdRef.current;

    try {
      setBuscandoCP(true);
      setErrorCP(null);
      setMensajeCPExito(null);
      setPoblacionesDisponibles([]);

      const res = await consultarCodigoPostal(cp, abortCtrl.signal);

      // Si se lanzó una petición posterior mientras esta respondía, descartar
      if (idActual !== peticionCPIdRef.current) {
        return;
      }

      // Requisito 1: Autocompletar provincia y municipio (respetando si el usuario editó manualmente)
      if (res.provincia && !provinciaModificadaManualmenteRef.current) {
        setProvincia(res.provincia);
      }
      if (res.municipio && !ciudadModificadaManualmenteRef.current) {
        setCiudad(res.municipio);
      }

      // Requisito 2, 3, 4, 5: Autocompletar población/localidad sin sustituir el municipio
      if (res.poblaciones && res.poblaciones.length > 1) {
        setPoblacionesDisponibles(res.poblaciones);
        // Si hay varias localidades, sugerimos la principal pero permitimos selector
        if (!poblacionModificadaManualmenteRef.current) {
          const sugerida = res.poblacionSugerida || res.poblaciones[0];
          setPoblacion(sugerida);
        }
        setMensajeCPExito(
          `CP ${cp} (${res.provincia}): Municipio "${res.municipio}". Se encontraron ${res.poblaciones.length} localidades. Selecciona la correcta o edítala libremente.`,
        );
      } else {
        setPoblacionesDisponibles([]);
        // Si coincide municipio y población, ambos campos tienen ese valor
        if (!poblacionModificadaManualmenteRef.current) {
          const sugerida = res.poblacionSugerida || res.municipio;
          setPoblacion(sugerida);
        }
        setMensajeCPExito(
          `Localidad completada: ${res.poblacionSugerida || res.municipio} (Municipio de ${res.municipio}, ${res.provincia}).`,
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (idActual !== peticionCPIdRef.current) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Código postal no encontrado.';
      setErrorCP(`${msg} Puedes introducir el municipio, población y provincia manualmente.`);
    } finally {
      if (idActual === peticionCPIdRef.current) {
        setBuscandoCP(false);
      }
    }
  };

  const handleCambioCP = (v: string) => {
    setCodigoPostal(v);
    // Cambiar el código postal después de haber confirmado una ubicación requiere re-confirmación
    invalidarConfirmacion();
    setErrorCP(null);
    setMensajeCPExito(null);
    setPoblacionesDisponibles([]);

    // Abortar y desfasar inmediatamente cualquier petición en vuelo anterior si el usuario altera el CP
    if (abortCtrlCPRef.current) {
      abortCtrlCPRef.current.abort();
    }
    peticionCPIdRef.current++;

    const cpLimpio = v.trim();
    if (cpLimpio.length === 5 && /^\d{5}$/.test(cpLimpio)) {
      ciudadModificadaManualmenteRef.current = false;
      poblacionModificadaManualmenteRef.current = false;
      provinciaModificadaManualmenteRef.current = false;
      ejecutarAutocompletadoCP(cpLimpio);
    } else {
      setBuscandoCP(false);
    }
  };

  const handleModificarDireccionChange = (checked: boolean) => {
    cancelarConsulta();
    puntoConsultado.current = '';
    setModificarDireccion(checked);
    if (checked) {
      // Al modificar la dirección, conservamos las coordenadas previas en el mapa para no perder la referencia
      if (plazaAEditar) {
        setCoordenadasMapa({ latitud: plazaAEditar.latitud, longitud: plazaAEditar.longitud });
      }
      setUbicacionConfirmada(false);
      setCandidatos([]);
      setMostrarCandidatos(false);
      setCandidatoSeleccionado(null);
      setErrorGeo(null);
      setMensajeGeoExito(null);
      setErrorCP(null);
      setMensajeCPExito(null);
      setPoblacionesDisponibles([]);
      ultimaDireccionBuscadaRef.current = '';
    } else {
      // Restaura las coordenadas originales de la plaza
      if (plazaAEditar) {
        setCoordenadasMapa({ latitud: plazaAEditar.latitud, longitud: plazaAEditar.longitud });
        setUbicacionConfirmada(true);
      }
    }
  };

  // ─── Geocodificación ─────────────────────────────────────
  const ejecutarBusquedaDireccion = async (direccionActual: {
    calle: string;
    numero?: string;
    codigoPostal?: string;
    ciudad?: string;
    poblacion?: string;
    provincia?: string;
  }) => {
    setErrorGeo(null);
    setMensajeGeoExito(null);
    setCandidatos([]);
    setMostrarCandidatos(false);
    setUbicacionConfirmada(false);
    setCandidatoSeleccionado(null);

    if (!direccionActual.calle.trim()) {
      setErrorGeo('Introduce al menos la calle para localizar la plaza.');
      return;
    }

    const claveBusqueda = `${direccionActual.calle.trim()}|${direccionActual.numero?.trim() || ''}|${direccionActual.codigoPostal?.trim() || ''}|${direccionActual.ciudad?.trim() || ''}|${direccionActual.poblacion?.trim() || ''}|${direccionActual.provincia?.trim() || ''}`;
    cancelarConsulta();
    puntoConsultado.current = '';
    const revision = revisionGeo.current;
    ultimaDireccionBuscadaRef.current = claveBusqueda;

    try {
      setBuscandoGeo(true);
      const resultados = await buscarDireccion({
        calle: direccionActual.calle.trim(),
        numero: direccionActual.numero?.trim() || undefined,
        codigoPostal: direccionActual.codigoPostal?.trim() || undefined,
        ciudad: direccionActual.ciudad?.trim() || undefined,
        poblacion: direccionActual.poblacion?.trim() || undefined,
        provincia: direccionActual.provincia?.trim() || undefined,
      });

      if (revision !== revisionGeo.current) return;
      if (resultados.length === 0) {
        setErrorGeo(
          'CartoCiudad no encontró la dirección exacta. Puedes situar el marcador manualmente en el mapa sobre la entrada del garaje.',
        );
        // Si no había coordenadas, colocamos el mapa en el centro de España
        setCoordenadasMapa((prev) => prev ?? { latitud: 40.416775, longitud: -3.70379 });
      } else if (resultados.length === 1) {
        const unico = resultados[0];
        setCoordenadasMapa({ latitud: unico.latitud, longitud: unico.longitud });
        setCandidatoSeleccionado(unico.id);
        setMensajeGeoExito(
          `Dirección localizada: "${unico.direccionCompleta}". Revisa el punto en el mapa y confírmalo.`,
        );
      } else {
        setCandidatos(resultados);
        setMostrarCandidatos(true);
        const primero = resultados[0];
        setCoordenadasMapa({ latitud: primero.latitud, longitud: primero.longitud });
        setCandidatoSeleccionado(primero.id);
        setMensajeGeoExito(
          `Se han encontrado ${resultados.length} coincidencias. Selecciona la correcta en la lista y confirma la ubicación.`,
        );
      }
    } catch (err: unknown) {
      if (revision !== revisionGeo.current) return;
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servicio de geocodificación.';
      setErrorGeo(`${msg} Puedes situar el marcador manualmente en el mapa.`);
      setCoordenadasMapa((prev) => prev ?? { latitud: 40.416775, longitud: -3.70379 });
    } finally {
      if (revision === revisionGeo.current) setBuscandoGeo(false);
    }
  };

  /** Búsqueda manual pulsando el botón */
  const handleBuscarUbicacion = () => {
    ejecutarBusquedaDireccion({
      calle,
      numero: numero.trim() || undefined,
      codigoPostal: codigoPostal.trim() || undefined,
      ciudad: ciudad.trim() || undefined,
      poblacion: poblacion.trim() || undefined,
      provincia: provincia.trim() || undefined,
    });
  };

  /** Búsqueda automática al perder el foco si los campos obligatorios están completos */
  const handleBlurCampoDireccion = () => {
    if (
      calle.trim() &&
      numero.trim() &&
      codigoPostal.trim() &&
      ciudad.trim() &&
      !buscandoGeo && !puntoConsultado.current && !leyendoDireccion
    ) {
      const claveActual = `${calle.trim()}|${numero.trim()}|${codigoPostal.trim()}|${ciudad.trim()}|${poblacion.trim()}|${provincia.trim()}`;
      if (claveActual !== ultimaDireccionBuscadaRef.current) {
        handleBuscarUbicacion();
      }
    }
  };

  const seleccionarCandidato = (candidato: CandidatoGeocodificacion) => {
    cancelarConsulta();
    puntoConsultado.current = '';
    setCoordenadasMapa({ latitud: candidato.latitud, longitud: candidato.longitud });
    setCandidatoSeleccionado(candidato.id);
    setUbicacionConfirmada(false);
    setMensajeGeoExito(
      `Seleccionado: "${candidato.direccionCompleta}". Pulsa "Confirmar ubicación" para fijarla.`,
    );
  };

  const handleCambioMapa = (coords: CoordenadasMapa) => {
    puntoConsultado.current = '';
    setCoordenadasMapa(coords);
    setCandidatoSeleccionado(null);
    setUbicacionConfirmada(false);
    void consultarPunto(coords, false);
  };

  const handleConfirmarUbicacion = () => {
    if (coordenadasMapa) void consultarPunto(coordenadasMapa, true);
  };

  const consultarPunto = async ({ latitud, longitud }: CoordenadasMapa, confirmar: boolean) => {
    const clave = latitud + ',' + longitud;
    cancelarConsulta();
    abortCtrlCPRef.current?.abort();
    peticionCPIdRef.current++;
    setBuscandoCP(false);
    setErrorCP(null);
    setMensajeCPExito(null);
    setPoblacionesDisponibles([]);
    setMostrarCandidatos(false);
    setErrorGeo(null);
    if (puntoConsultado.current === clave) {
      setUbicacionConfirmada(true);
      setMensajeGeoExito('Ubicación confirmada.');
      return;
    }
    const revision = revisionGeo.current;
    setLeyendoDireccion(true);
    setMensajeGeoExito(null);
    try {
      const d = await direccionDelPunto(latitud, longitud);
      if (revision !== revisionGeo.current) return;
      // Al buscar por texto, conserva los datos escritos que el proveedor no devuelve.
      const desdeBusqueda = confirmar && candidatoSeleccionado !== null;
      setCalle(d.calle || (desdeBusqueda ? calle : ''));
      setNumero(d.numero || (desdeBusqueda ? numero : ''));
      setCodigoPostal(d.codigoPostal || (desdeBusqueda ? codigoPostal : ''));
      setCiudad(d.municipio || (desdeBusqueda ? ciudad : ''));
      setPoblacion(d.poblacion || (desdeBusqueda ? poblacion : ''));
      setProvincia(d.provincia || (desdeBusqueda ? provincia : ''));
      puntoConsultado.current = clave;
      setMensajeGeoExito(!confirmar ? 'Revisa la dirección y confirma la ubicación.' : Object.values(d).every(Boolean)
        ? 'Ubicación confirmada. Revisa la dirección y el portal.'
        : 'Ubicación confirmada. Completa los datos de dirección que falten.');
    } catch {
      if (revision !== revisionGeo.current) return;
      setErrorGeo(confirmar ? 'Punto confirmado. Revisa o completa la dirección manualmente.' : 'No se pudo recuperar la dirección. Al confirmar se volverá a intentar.');
    } finally {
      if (revision === revisionGeo.current) {
        setUbicacionConfirmada(confirmar);
        setLeyendoDireccion(false);
      }
    }
  };

  // ─── Submit ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!tipo) { setError('Selecciona la modalidad de disponibilidad.'); return; }
    const errorHorario = validarHorario(horario, tipo);
    if (errorHorario) { setError(errorHorario); return; }

    // Validación de usuario activo
    let idUsuario = obtenerUsuarioSesion()?.id;
    if (!idUsuario) {
      try {
        const perfil = await obtenerPerfil();
        if (perfil?.id) {
          idUsuario = perfil.id;
          guardarUsuarioSesion(perfil);
        }
      } catch {
        // fallback
      }
    }

    if (!idUsuario) {
      setError('Debes iniciar sesión para poder publicar o modificar una plaza.');
      return;
    }

    // Validación básica
    const tituloTrim = titulo.trim();
    const descripcionTrim = descripcion.trim();

    if (!tituloTrim) { setError('El título de la plaza es obligatorio.'); return; }
    if (!descripcionTrim) { setError('La descripción de la plaza es obligatoria.'); return; }

    const valPrecio = validarNumeroPositivoObligatorio(precioHora, 'El precio por hora');
    if (!valPrecio.valido) { setError(valPrecio.errorMsg || 'Precio inválido.'); return; }

    const valLargo = validarNumeroPositivoObligatorio(largo, 'El largo');
    if (!valLargo.valido) { setError(valLargo.errorMsg || 'Largo inválido.'); return; }

    const valAncho = validarNumeroPositivoObligatorio(ancho, 'El ancho');
    if (!valAncho.valido) { setError(valAncho.errorMsg || 'Ancho inválido.'); return; }

    // Validación de dirección y ubicación
    const debeValidarDireccion = !esEdicion || modificarDireccion;
    if (debeValidarDireccion) {
      if (!calle.trim()) { setError('La calle de la plaza es obligatoria.'); return; }
      if (!numero.trim()) { setError('El portal de la plaza es obligatorio (o indica s/n).'); return; }
      if (!codigoPostal.trim()) { setError('El código postal es obligatorio.'); return; }
      if (!ciudad.trim()) { setError('El municipio o ciudad es obligatorio.'); return; }
      if (!poblacion.trim()) { setError('La población o localidad es obligatoria.'); return; }

      // Obligatorio confirmar ubicación en mapa
      if (!ubicacionConfirmada || !coordenadasMapa) {
        setError(
          'Debes localizar la plaza y confirmar su ubicación en el mapa antes de publicarla.',
        );
        return;
      }
    }

    // Validación de preguntas de características (las cuatro son requeridas con Sí/No)
    if (estaCubierta === null) {
      setError('Debes responder a la pregunta: ¿La plaza está cubierta?');
      return;
    }

    if (tieneCargadorElectrico === null) {
      setError('Debes responder a la pregunta: ¿Dispone de cargador para vehículos eléctricos?');
      return;
    }

    if (tieneCamaras === null) {
      setError('Debes responder a la pregunta: ¿Dispone de cámaras de seguridad?');
      return;
    }

    if (entradaDificil === null) {
      setError('Debes responder a la pregunta: ¿Tiene una entrada difícil?');
      return;
    }

    // Si tiene entrada difícil, es obligatorio indicar al menos un motivo
    if (entradaDificil === true) {
      if (dificultadesEntrada.length === 0) {
        setError('Has indicado que la entrada es difícil. Debes seleccionar al menos un motivo.');
        return;
      }
      if (dificultadesEntrada.includes('OTRA') && !descripcionEntrada.trim()) {
        setError('Has seleccionado la opción "Otro". Debes especificar el motivo en el campo de texto.');
        return;
      }
    }

    const dificultadesFinales: DificultadEntrada[] = entradaDificil === true
      ? [...new Set(dificultadesEntrada)]
      : [];
    const descEntradaFinal =
      entradaDificil === true && dificultadesFinales.includes('OTRA')
        ? descripcionEntrada.trim() || null
        : null;

    try {
      setCargando(true);

      if (esEdicion && plazaAEditar) {
        const cambiaHorario = tipo !== (plazaAEditar.tipoDisponibilidad ?? 'HABITUAL') || JSON.stringify(horario) !== JSON.stringify(plazaAEditar.horario ?? horarioCompleto());
        if (cambiaHorario || (plazaAEditar.disponible && !disponible)) {
          let page = 1;
          let hayMas = true;
          while (hayMas) {
            const {data, meta} = await obtenerReservasPlaza(plazaAEditar.id, {page, limit:100});
            const conflicto = data.find(r => {
              const fin = new Date(r.fechaFin);
              return (r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE') && +fin > Date.now()
                && (!disponible || !cubrePeriodo(horario, new Date(r.fechaInicio), fin));
            });
            if (conflicto) {
              const inicio = new Date(conflicto.fechaInicio).toLocaleString('es-ES', {timeZone:'Europe/Madrid'});
              throw new Error('El cambio afectaría a la reserva del ' + inicio + ' (hora peninsular).');
            }
            hayMas = meta.hasNextPage;
            page++;
          }
        }
        const dtoActualizar: ActualizarPlazaDto = {
          ...(cambiaHorario && { horario, tipoDisponibilidad: tipo }),
          titulo: tituloTrim,
          descripcion: descripcionTrim,
          precioHora: valPrecio.numero!,
          largo: valLargo.numero!,
          ancho: valAncho.numero!,
          numeroPlaza: numeroPlaza.trim(),
          planta: planta.trim(),
          indicacionesAcceso: indicacionesAcceso.trim(),
          entradaDificil: Boolean(entradaDificil),
          dificultadesEntrada: dificultadesFinales,
          descripcionEntrada: descEntradaFinal,
          tieneCamaras: Boolean(tieneCamaras),
          estaCubierta: Boolean(estaCubierta),
          tieneCargadorElectrico: Boolean(tieneCargadorElectrico),
          disponible,
          ...(modificarDireccion && {
            calle: calle.trim(),
            numero: numero.trim(),
            codigoPostal: codigoPostal.trim(),
            ciudad: ciudad.trim(),
            poblacion: poblacion.trim() || undefined,
            provincia: provincia.trim() || undefined,
            ...(coordenadasMapa && {
              latitud: coordenadasMapa.latitud,
              longitud: coordenadasMapa.longitud,
            }),
          }),
        };

        await actualizarPlaza(plazaAEditar.id, dtoActualizar);

        // Eliminar fotografías marcadas por el usuario
        for (const fotoId of fotosAEliminar) {
          try {
            await eliminarFotoPlaza(plazaAEditar.id, fotoId);
          } catch {
            // Continuar con las demás
          }
        }

        // Subir nuevas fotografías seleccionadas
        if (fotosNuevas.length > 0) {
          await subirFotosPlaza(plazaAEditar.id, fotosNuevas);
        }

        previewsNuevas.forEach((p) => URL.revokeObjectURL(p));
        setFotosNuevas([]);
        setPreviewsNuevas([]);
        setFotosAEliminar([]);

        const mensaje = `Plaza "${tituloTrim}" actualizada con éxito.`;
        setExito(mensaje);
        if (onExito) onExito(mensaje);
        else if (onPlazaCreada) onPlazaCreada();
      } else {
        const dtoCrear: CrearPlazaDto = {
          tipoDisponibilidad: tipo,
          horario,
          titulo: tituloTrim,
          descripcion: descripcionTrim,
          calle: calle.trim(),
          numero: numero.trim(),
          codigoPostal: codigoPostal.trim(),
          ciudad: ciudad.trim(),
          poblacion: poblacion.trim() || undefined,
          provincia: provincia.trim() || undefined,
          numeroPlaza: numeroPlaza.trim() || undefined,
          planta: planta.trim() || undefined,
          indicacionesAcceso: indicacionesAcceso.trim() || undefined,
          latitud: coordenadasMapa!.latitud,
          longitud: coordenadasMapa!.longitud,
          precioHora: valPrecio.numero!,
          largo: valLargo.numero!,
          ancho: valAncho.numero!,
          entradaDificil: Boolean(entradaDificil),
          dificultadesEntrada: dificultadesFinales,
          descripcionEntrada: descEntradaFinal,
          tieneCamaras: Boolean(tieneCamaras),
          estaCubierta: Boolean(estaCubierta),
          tieneCargadorElectrico: Boolean(tieneCargadorElectrico),
        };

        const plazaCreada = await crearPlaza(dtoCrear);

        // Subir fotografías seleccionadas para la nueva plaza
        if (fotosNuevas.length > 0 && plazaCreada?.id) {
          await subirFotosPlaza(plazaCreada.id, fotosNuevas);
        }

        const mensaje = `Plaza "${tituloTrim}" registrada con éxito.`;
        setExito(mensaje);

        // Limpiar formulario
        previewsNuevas.forEach((p) => URL.revokeObjectURL(p));
        setFotosNuevas([]);
        setPreviewsNuevas([]);
        setFotosAEliminar([]);
        setErrorFotos(null);
        setTipo(null);
        setHorario(horarioCompleto());
        setTitulo(''); setDescripcion(''); setCalle(''); setNumero('');
        setCodigoPostal(''); setCiudad(''); setPoblacion(''); setProvincia(''); setPrecioHora('');
        setNumeroPlaza(''); setPlanta(''); setIndicacionesAcceso('');
        setLargo(''); setAncho(''); setEntradaDificil(null);
        setDificultadesEntrada([]); setDescripcionEntrada(''); setTieneCamaras(null);
        setEstaCubierta(null); setTieneCargadorElectrico(null);
        setDisponible(true); setCoordenadasMapa(null); setUbicacionConfirmada(false);
        setCandidatos([]); setMostrarCandidatos(false); setErrorGeo(null);
        setMensajeGeoExito(null);
        ultimaDireccionBuscadaRef.current = '';

        if (onExito) onExito(mensaje);
        else if (onPlazaCreada) onPlazaCreada();
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Ha ocurrido un error inesperado al procesar la plaza.');
    } finally {
      setCargando(false);
    }
  };

  const debeVerDireccion = !esEdicion || modificarDireccion;

  return (
    <form onSubmit={handleSubmit} className="plaza-form">
      {error && (
        <div className="mensaje-alerta mensaje-error" role="alert">
          {error}
        </div>
      )}
      {exito && (
        <div className="mensaje-alerta mensaje-exito" role="status">
          {exito}
        </div>
      )}

      {/* ── Sección 1: Datos básicos ── */}
      <div className="form-seccion">
        <h3 className="form-seccion-titulo">Datos de la plaza</h3>

        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="plaza-titulo">
              Título de la plaza <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-titulo"
              type="text"
              placeholder="Ej. Amplia plaza en garaje céntrico"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={cargando}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="plaza-precio-hora">
              Precio por hora (€) <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-precio-hora"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej. 1.50"
              value={precioHora}
              onChange={(e) => setPrecioHora(e.target.value)}
              disabled={cargando}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--spacing-sm)' }}>
          <label htmlFor="plaza-descripcion">
            Descripción <span className="campo-requerido">*</span>
          </label>
          <textarea
            id="plaza-descripcion"
            rows={3}
            placeholder="Ej. Plaza cubierta, fácil maniobra, portón automático."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={cargando}
            required
          />
        </div>
      </div>

      {/* ── Sección 2: Ubicación ── */}
      <div className="form-seccion" style={{ marginTop: 'var(--spacing-md)' }}>
        <h3 className="form-seccion-titulo">Ubicación de la plaza</h3>

        {/* Dirección actual en modo edición */}
        {esEdicion && plazaAEditar && (
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--color-surface, #f8f9fa)',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Dirección actual registrada:
            </span>
            <strong
              style={{
                display: 'block',
                marginTop: '0.2rem',
                color: 'var(--color-text-main)',
              }}
            >
              📍 {plazaAEditar.direccion}
            </strong>
          </div>
        )}

        {/* Checkbox "Modificar dirección" en edición */}
        {esEdicion && (
          <div
            className="form-group form-group-checkbox"
            style={{ marginBottom: 'var(--spacing-sm)' }}
          >
            <label htmlFor="plaza-modificar-direccion" className="checkbox-label">
              <input
                id="plaza-modificar-direccion"
                type="checkbox"
                checked={modificarDireccion}
                onChange={(e) => handleModificarDireccionChange(e.target.checked)}
                disabled={cargando}
              />
              <span>Modificar la dirección de la plaza</span>
            </label>
          </div>
        )}

        {/* Campos de dirección (creación siempre, edición solo si modificarDireccion) */}
        {debeVerDireccion && (
          <>
            {esEdicion && <p className="form-hint" style={{ marginBottom: 'var(--spacing-sm)' }}>
              Introduce la dirección postal para localizarla automáticamente con CartoCiudad o
              sitúa el marcador directamente en el mapa sobre la entrada del garaje.
            </p>}

            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="plaza-calle">
                  Calle <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-calle"
                  type="text"
                  placeholder="Ej. Gran Vía, Calle Uría, Calle Mayor..."
                  value={calle}
                  onChange={(e) => handleCambioCalle(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
                  disabled={cargando}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="plaza-numero">
                  Portal <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-numero"
                  type="text"
                  placeholder="Ej. 28 o s/n"
                  value={numero}
                  onChange={(e) => handleCambioNumero(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
                  disabled={cargando}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="plaza-codigo-postal">
                  Código postal <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-codigo-postal"
                  type="text"
                  placeholder="Ej. 28013"
                  maxLength={5}
                  value={codigoPostal}
                  onChange={(e) => handleCambioCP(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
                  disabled={cargando}
                  required
                />
                {esEdicion && <span className="form-hint">
                  Introduce 5 dígitos para autocompletar municipio y provincia
                </span>}
                {buscandoCP && (
                  <span className="form-hint" style={{ color: 'var(--color-primary)' }}>
                    ⏳ Consultando código postal...
                  </span>
                )}
                {errorCP && !buscandoCP && (
                  <span className="form-hint" style={{ color: 'var(--color-danger)' }}>
                    ⚠️ {errorCP}
                  </span>
                )}
                {mensajeCPExito && !errorCP && !buscandoCP && (
                  <span className="form-hint" style={{ color: '#16a34a' }}>
                    ✔ {mensajeCPExito}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="plaza-ciudad">
                  Municipio / Ciudad <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-ciudad"
                  type="text"
                  placeholder="Ej. Madrid, Cangas de Onís, Jávea..."
                  value={ciudad}
                  onChange={(e) => handleCambioCiudad(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
                  disabled={cargando}
                  required
                />
                {esEdicion && <span className="form-hint">Municipio oficial (autocompletado por CP)</span>}
              </div>

              <div className="form-group">
                <label htmlFor="plaza-poblacion">
                  Población / Localidad <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-poblacion"
                  type="text"
                  placeholder="Ej. Madrid, Biamón, Aduanas de Mar..."
                  value={poblacion}
                  onChange={(e) => handleCambioPoblacion(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
                  disabled={cargando}
                  required
                />
                {poblacionesDisponibles.length > 1 && (
                  <div style={{ marginTop: '0.35rem' }}>
                    <label
                      htmlFor="plaza-selector-poblacion"
                      className="form-hint"
                      style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}
                    >
                      Seleccionar localidad asociada al CP:
                    </label>
                    <select
                      id="plaza-selector-poblacion"
                      value={poblacionesDisponibles.includes(poblacion) ? poblacion : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setPoblacion(e.target.value);
                          poblacionModificadaManualmenteRef.current = true;
                          invalidarConfirmacion();
                        }
                      }}
                      disabled={cargando || buscandoCP}
                      style={{ width: '100%', fontSize: 'var(--font-size-sm)' }}
                    >
                      <option value="">-- Seleccionar de la lista ({poblacionesDisponibles.length} localidades) --</option>
                      {poblacionesDisponibles.map((pob) => (
                        <option key={pob} value={pob}>
                          {pob}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {esEdicion && <span className="form-hint">Núcleo urbano, pedanía o localidad</span>}
              </div>

              <div className="form-group">
                <label htmlFor="plaza-provincia">
                  Provincia{' '}
                  <span className="form-hint" style={{ fontWeight: 'normal' }}>
                    (opcional)
                  </span>
                </label>
                <input
                  id="plaza-provincia"
                  type="text"
                  placeholder="Ej. Madrid, Asturias, Alicante..."
                  value={provincia}
                  onChange={(e) => handleCambioProvincia(e.target.value)}
                  disabled={cargando}
                />
              </div>
            </div>

            {/* Botón de búsqueda explícita */}
            <div className="plaza-geo-acciones">
              <button
                id="plaza-buscar-ubicacion"
                type="button"
                className="btn btn-secondary"
                onClick={handleBuscarUbicacion}
                disabled={buscandoGeo || cargando || !calle.trim()}
              >
                {buscandoGeo ? '⏳ Buscando con CartoCiudad...' : '🔍 Localizar en el mapa'}
              </button>
            </div>

            {/* Feedback durante la búsqueda */}
            {buscandoGeo && (
              <div
                className="mensaje-alerta mensaje-info"
                role="status"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                ⏳ Localizando dirección con el servicio oficial CartoCiudad (IGN)...
              </div>
            )}

            {/* Aviso o error de geocodificación */}
            {errorGeo && !buscandoGeo && (
              <div
                className="mensaje-alerta mensaje-aviso"
                role="status"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                ⚠️ {errorGeo}
              </div>
            )}

            {/* Mensaje de éxito de geocodificación o ajuste */}
            {mensajeGeoExito && !errorGeo && !buscandoGeo && (
              <div
                className="mensaje-alerta mensaje-exito"
                role="status"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                ✅ {mensajeGeoExito}
              </div>
            )}

            {/* Lista de candidatos múltiples si CartoCiudad devuelve varios */}
            {mostrarCandidatos && candidatos.length > 1 && (
              <div style={{ marginTop: 'var(--spacing-sm)' }}>
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Se encontraron {candidatos.length} coincidencias. Selecciona la correcta:
                </p>
                <ul className="plaza-candidatos-lista">
                  {candidatos.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`plaza-candidato-btn${candidatoSeleccionado === c.id ? ' seleccionado' : ''}`}
                        onClick={() => seleccionarCandidato(c)}
                      >
                        {c.direccionCompleta}
                        <span className="plaza-candidato-fuente">({c.fuente})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* ── Mapa interactivo para creación o edición de dirección ── */}
        {debeVerDireccion && (
          <div className="plaza-mapa-seccion">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-xs)',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span className="plaza-mapa-label">
                Ubicación de la plaza en el mapa
              </span>
              <div
                className={`plaza-ubicacion-estado ${
                  ubicacionConfirmada
                    ? 'confirmada'
                    : coordenadasMapa
                      ? 'pendiente'
                      : 'sin-ubicacion'
                }`}
              >
                {ubicacionConfirmada
                  ? '✔ Ubicación confirmada'
                  : coordenadasMapa
                    ? '⏳ Pendiente de confirmar'
                    : '📍 Sin ubicación'}
              </div>
            </div>

            <p className="plaza-mapa-hint">
              {coordenadasMapa
                ? 'Puedes hacer clic en el mapa o arrastrar el marcador para afinar la ubicación exacta de la entrada del garaje.'
                : 'Introduce la dirección arriba para localizarla, o haz clic directamente en el mapa para situar el marcador.'}
            </p>

            <MapaUbicacion
              coordenadas={coordenadasMapa}
              onChange={handleCambioMapa}
              interactivo={true}
              altura="340px"
            />

            {/* Coordenadas actuales */}
            {coordenadasMapa && (
              <div className="plaza-coords-display">
                <span>Lat: {coordenadasMapa.latitud}</span>
                <span>Lon: {coordenadasMapa.longitud}</span>
              </div>
            )}

            {/* Botón Confirmar ubicación */}
            {coordenadasMapa && !ubicacionConfirmada && (
              <div className="plaza-geo-acciones" style={{ marginTop: 'var(--spacing-sm)' }}>
                <button
                  id="plaza-confirmar-ubicacion"
                  type="button"
                  className="btn btn-primary"
                  disabled={leyendoDireccion || cargando}
                  onClick={handleConfirmarUbicacion}
                >
                  {leyendoDireccion ? 'Buscando dirección…' : '✅ Confirmar ubicación en el mapa'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Mapa de solo lectura para edición sin modificar dirección ── */}
        {esEdicion && !modificarDireccion && plazaAEditar && (
          <div className="plaza-mapa-seccion">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              <span className="plaza-mapa-label">Ubicación registrada</span>
              <div className="plaza-ubicacion-estado confirmada">
                ✔ Ubicación conservada
              </div>
            </div>
            <MapaUbicacion
              coordenadas={{ latitud: plazaAEditar.latitud, longitud: plazaAEditar.longitud }}
              onChange={() => {}}
              interactivo={false}
              altura="260px"
            />
            <div className="plaza-coords-display">
              <span>Lat: {plazaAEditar.latitud}</span>
              <span>Lon: {plazaAEditar.longitud}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Sección: Identificación e indicaciones de acceso ── */}
      <div className="form-seccion" style={{ marginTop: 'var(--spacing-md)' }}>
        <h3 className="form-seccion-titulo">Acceso e identificación de la plaza</h3>
        <p className="form-hint" style={{ marginBottom: 'var(--spacing-sm)' }}>
          Datos opcionales para facilitar la localización y el acceso al aparcamiento.
        </p>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="plaza-numero-plaza">
              Número de plaza <span className="form-hint" style={{ fontWeight: 'normal' }}>(opcional)</span>
            </label>
            <input
              id="plaza-numero-plaza"
              type="text"
              placeholder="Ej. 42, B-12..."
              maxLength={50}
              value={numeroPlaza}
              onChange={(e) => setNumeroPlaza(e.target.value)}
              disabled={cargando}
            />
            <span className="form-hint">Identificador de la plaza dentro del garaje</span>
          </div>

          <div className="form-group">
            <label htmlFor="plaza-planta">
              Planta <span className="form-hint" style={{ fontWeight: 'normal' }}>(opcional)</span>
            </label>
            <input
              id="plaza-planta"
              type="text"
              placeholder="Ej. -1, Planta baja, Sótano 2..."
              maxLength={50}
              value={planta}
              onChange={(e) => setPlanta(e.target.value)}
              disabled={cargando}
            />
            <span className="form-hint">Nivel o planta en la que se encuentra</span>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--spacing-sm)' }}>
          <label htmlFor="plaza-indicaciones-acceso">
            Indicaciones de acceso <span className="form-hint" style={{ fontWeight: 'normal' }}>(opcional)</span>
          </label>
          <textarea
            id="plaza-indicaciones-acceso"
            rows={3}
            maxLength={1000}
            placeholder="Instrucciones para acceder a la plaza: entrada al garaje, referencias, apertura de portón, giros..."
            value={indicacionesAcceso}
            onChange={(e) => setIndicacionesAcceso(e.target.value)}
            disabled={cargando}
          />
          <span className="form-hint">
            Información detallada para acceder a la plaza ({indicacionesAcceso.length}/1000 caracteres)
          </span>
        </div>
      </div>

      {/* ── Sección 3: Dimensiones ── */}
      <div className="form-seccion" style={{ marginTop: 'var(--spacing-md)' }}>
        <h3 className="form-seccion-titulo">Dimensiones</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="plaza-largo">
              Largo (m) <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-largo"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej. 5.0"
              value={largo}
              onChange={(e) => setLargo(e.target.value)}
              disabled={cargando}
              required
            />
            <span className="form-hint">Largo de la plaza en metros</span>
          </div>

          <div className="form-group">
            <label htmlFor="plaza-ancho">
              Ancho (m) <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-ancho"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej. 2.4"
              value={ancho}
              onChange={(e) => setAncho(e.target.value)}
              disabled={cargando}
              required
            />
            <span className="form-hint">Ancho de la plaza en metros</span>
          </div>
        </div>
      </div>

      {/* ── Sección 4: Características ── */}
      <div className="form-seccion" style={{ marginTop: 'var(--spacing-md)' }}>
        <h3 className="form-seccion-titulo">Características</h3>

        {/* ¿La plaza está cubierta? */}
        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label id="plaza-label-cubierta" style={{ fontWeight: 600 }}>
            ¿La plaza está cubierta? <span className="campo-requerido">*</span>
          </label>
          <div className="form-sino-selector" role="radiogroup" aria-labelledby="plaza-label-cubierta">
            <label className={`sino-option ${estaCubierta === true ? 'activo' : ''}`}>
              <input
                id="plaza-cubierta-si"
                type="radio"
                name="plaza-esta-cubierta"
                checked={estaCubierta === true}
                onChange={() => setEstaCubierta(true)}
                disabled={cargando}
              />
              <span>Sí</span>
            </label>
            <label className={`sino-option ${estaCubierta === false ? 'activo' : ''}`}>
              <input
                id="plaza-cubierta-no"
                type="radio"
                name="plaza-esta-cubierta"
                checked={estaCubierta === false}
                onChange={() => setEstaCubierta(false)}
                disabled={cargando}
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* ¿Dispone de cargador para vehículos eléctricos? */}
        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label id="plaza-label-cargador" style={{ fontWeight: 600 }}>
            ¿Dispone de cargador eléctrico? <span className="campo-requerido">*</span>
          </label>
          <div className="form-sino-selector" role="radiogroup" aria-labelledby="plaza-label-cargador">
            <label className={`sino-option ${tieneCargadorElectrico === true ? 'activo' : ''}`}>
              <input
                id="plaza-cargador-si"
                type="radio"
                name="plaza-cargador-electrico"
                checked={tieneCargadorElectrico === true}
                onChange={() => setTieneCargadorElectrico(true)}
                disabled={cargando}
              />
              <span>Sí</span>
            </label>
            <label className={`sino-option ${tieneCargadorElectrico === false ? 'activo' : ''}`}>
              <input
                id="plaza-cargador-no"
                type="radio"
                name="plaza-cargador-electrico"
                checked={tieneCargadorElectrico === false}
                onChange={() => setTieneCargadorElectrico(false)}
                disabled={cargando}
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* ¿Dispone de cámaras de seguridad? */}
        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label id="plaza-label-camaras" style={{ fontWeight: 600 }}>
            ¿Dispone de cámaras de seguridad? <span className="campo-requerido">*</span>
          </label>
          <div className="form-sino-selector" role="radiogroup" aria-labelledby="plaza-label-camaras">
            <label className={`sino-option ${tieneCamaras === true ? 'activo' : ''}`}>
              <input
                id="plaza-camaras-si"
                type="radio"
                name="plaza-tiene-camaras"
                checked={tieneCamaras === true}
                onChange={() => setTieneCamaras(true)}
                disabled={cargando}
              />
              <span>Sí</span>
            </label>
            <label className={`sino-option ${tieneCamaras === false ? 'activo' : ''}`}>
              <input
                id="plaza-camaras-no"
                type="radio"
                name="plaza-tiene-camaras"
                checked={tieneCamaras === false}
                onChange={() => setTieneCamaras(false)}
                disabled={cargando}
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* ¿Tiene una entrada difícil? */}
        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label id="plaza-label-entrada-dificil" style={{ fontWeight: 600 }}>
            ¿Tiene una entrada difícil? <span className="campo-requerido">*</span>
          </label>
          <div className="form-sino-selector" role="radiogroup" aria-labelledby="plaza-label-entrada-dificil">
            <label className={`sino-option ${entradaDificil === true ? 'activo' : ''}`}>
              <input
                id="plaza-entrada-dificil-si"
                type="radio"
                name="plaza-entrada-dificil"
                checked={entradaDificil === true}
                onChange={() => handleEntradaDificilChange(true)}
                disabled={cargando}
              />
              <span>Sí</span>
            </label>
            <label className={`sino-option ${entradaDificil === false ? 'activo' : ''}`}>
              <input
                id="plaza-entrada-dificil-no"
                type="radio"
                name="plaza-entrada-dificil"
                checked={entradaDificil === false}
                onChange={() => handleEntradaDificilChange(false)}
                disabled={cargando}
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* Apartado adicional con los motivos de entrada difícil */}
        {entradaDificil === true && (
          <div className="plaza-dificultades-bloque" style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, color: '#92400E' }}>
                Indica los motivos de la entrada difícil: <span className="campo-requerido">*</span>
              </label>
              <span className="form-hint" style={{ color: '#B45309' }}>
                Selecciona uno o varios motivos que puedan complicar el acceso a la plaza.
              </span>

              <div className="motivos-entrada-grid">
                {MOTIVOS_ENTRADA_DIFICIL.map((motivo) => {
                  const seleccionado = dificultadesEntrada.includes(motivo.id);
                  return (
                    <label
                      key={motivo.id}
                      className={`motivo-checkbox-label ${seleccionado ? 'seleccionado' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() => handleToggleMotivo(motivo.id)}
                        disabled={cargando}
                      />
                      <span>{motivo.nombre}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {dificultadesEntrada.includes('OTRA') && (
              <div className="form-group" style={{ marginTop: 'var(--spacing-sm)' }}>
                <label htmlFor="plaza-descripcion-entrada">
                  Especifica el motivo <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-descripcion-entrada"
                  type="text"
                  placeholder="Detalla qué dificulta la entrada (máx. 300 caracteres)..."
                  maxLength={300}
                  value={descripcionEntrada}
                  onChange={(e) => setDescripcionEntrada(e.target.value)}
                  disabled={cargando}
                  required
                />
                <span className="form-hint">
                  Campo obligatorio para especificar el motivo adicional.
                </span>
              </div>
            )}
          </div>
        )}

        {esEdicion && (
          <div
            className="form-group form-group-checkbox"
            style={{ marginTop: 'var(--spacing-sm)' }}
          >
            <label htmlFor="plaza-disponible" className="checkbox-label">
              <input
                id="plaza-disponible"
                type="checkbox"
                checked={disponible}
                onChange={(e) => setDisponible(e.target.checked)}
                disabled={cargando}
              />
              <span>Plaza disponible para reservas</span>
            </label>
          </div>
        )}
      </div>

      <EditorHorario tipo={tipo} seleccionar={setTipo} horario={horario} cambiar={setHorario} disabled={cargando} />

      {/* ── Sección: Fotografías de la plaza ── */}
      <div className="form-seccion" style={{ marginTop: 'var(--spacing-md)' }}>
        <h3 className="form-seccion-titulo">Fotografías de la plaza (máx. 5)</h3>
        <p className="form-hint" style={{ marginTop: '0.2rem', marginBottom: 'var(--spacing-sm)' }}>
          Añade hasta 5 fotografías desde tu galería o cámara para que los usuarios puedan ver tu plaza (formatos JPEG, PNG y WebP, máx. 5 MB por foto).
        </p>

        {errorFotos && (
          <div className="mensaje-alerta mensaje-error" style={{ marginBottom: 'var(--spacing-sm)' }}>
            {errorFotos}
          </div>
        )}

        {/* Galería de fotos existentes (en edición) */}
        {fotosExistentes.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-sm)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text)' }}>
              Fotografías actuales:
            </h4>
            <div className="plaza-fotos-subida-grid">
              {fotosExistentes.map((foto) => {
                const eliminada = fotosAEliminar.includes(foto.id);
                return (
                  <div
                    key={foto.id}
                    className={`plaza-foto-subida-item ${eliminada ? 'marcada-eliminar' : ''}`}
                  >
                    <img
                      src={obtenerUrlFoto(foto.url)}
                      alt="Fotografía de la plaza"
                      className="plaza-foto-subida-preview"
                    />
                    <button
                      type="button"
                      className={`btn-foto-accion ${eliminada ? 'btn-foto-recuperar' : 'btn-foto-eliminar'}`}
                      onClick={() => handleMarcarEliminarFotoExistente(foto.id)}
                      title={eliminada ? 'Deshacer eliminación' : 'Eliminar foto'}
                    >
                      {eliminada ? 'Deshacer' : '✕'}
                    </button>
                    {eliminada && (
                      <div className="plaza-foto-aviso-eliminada">Se eliminará</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Galería de fotos nuevas seleccionadas */}
        {previewsNuevas.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-sm)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text)' }}>
              Nuevas fotografías para subir:
            </h4>
            <div className="plaza-fotos-subida-grid">
              {previewsNuevas.map((previewUrl, index) => (
                <div key={previewUrl} className="plaza-foto-subida-item">
                  <img
                    src={previewUrl}
                    alt={`Nueva foto ${index + 1}`}
                    className="plaza-foto-subida-preview"
                  />
                  <button
                    type="button"
                    className="btn-foto-accion btn-foto-eliminar"
                    onClick={() => handleQuitarFotoNueva(index)}
                    title="Quitar foto"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selector de archivos */}
        {fotosExistentes.filter((f) => !fotosAEliminar.includes(f.id)).length + fotosNuevas.length < 5 && (
          <div className="form-group-subir-fotos" style={{ marginTop: 'var(--spacing-xs)' }}>
            <label
              htmlFor="plaza-input-fotos"
              className="btn btn-secondary btn-sm"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Hacer o seleccionar fotos
            </label>
            <input
              id="plaza-input-fotos"
              type="file"
              accept="image/*"
              multiple
              onChange={handleSeleccionarFotos}
              disabled={cargando}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
              ({fotosExistentes.filter((f) => !fotosAEliminar.includes(f.id)).length + fotosNuevas.length} de 5)
            </span>
          </div>
        )}
      </div>

      <div className="btn-group" style={{ marginTop: 'var(--spacing-lg)' }}>
        <button type="submit" className="btn btn-primary" disabled={cargando}>
          {cargando
            ? 'Guardando...'
            : esEdicion
              ? 'Guardar cambios'
              : 'Publicar plaza'}
        </button>
        {onCancelar && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
