export interface PaginacionMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface RespuestaPaginada<T> {
  data: T[];
  meta: PaginacionMeta;
}

export interface ParametrosPaginacion {
  page?: number;
  limit?: number;
}
