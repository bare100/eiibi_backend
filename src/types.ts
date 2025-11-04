export interface PaginatedQueryParams {
  page: number
  perPage: number
  query?: string
  orderDirection?: 'ASC' | 'DESC'
  orderBy?: string
}
