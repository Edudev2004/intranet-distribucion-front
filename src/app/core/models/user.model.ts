export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'WAREHOUSE';
  token?: string;
}
