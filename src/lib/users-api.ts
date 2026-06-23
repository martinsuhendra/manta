export interface UsersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersListResponse<T> {
  data: T[];
  pagination: UsersPagination;
}

export function unwrapUsersListResponse<T>(body: T[] | UsersListResponse<T>): T[] {
  return Array.isArray(body) ? body : body.data;
}
