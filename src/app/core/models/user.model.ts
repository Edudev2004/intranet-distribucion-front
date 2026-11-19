export type UserRole =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'ALMACENERO'
  | 'CONDUCTOR'
  | 'CLIENTE'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'WAREHOUSE'
  | string;

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  token?: string;
}
