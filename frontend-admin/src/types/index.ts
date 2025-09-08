export interface Role {
  id: number;
  name: string;
}

export interface RoleFormData {
  name: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export interface GeneralUser {
  id: number;
  name: string;
  is_active: boolean;
  email: string;
  role: {ID: number; Name: String;}
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  role_id: number;
}

export interface UpdateUserFormData {
  name?: string;
  email?: string;
  password?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T,
  pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  
}