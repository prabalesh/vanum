import axios from "axios";
import toast from "react-hot-toast";
import type {
    ApiResponse,
  CreateUserFormData,
  GeneralUser,
  PaginatedResponse,
  Role,
  RoleFormData,
  UpdateUserFormData,
  User,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api/admin/v1";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    const message = error.response?.data?.message || "Something went wrong";
    toast.error(message);
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  login: async (
    email: string,
    password: string,
  ): Promise<{ token: string; admin: User }> => {
    const response = await api.post<
      ApiResponse<{ token: string; admin: User }>
    >("/auth/login", {
      email,
      password,
    });
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/logout");
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{user: User}>>("/profile");
    return response.data.data.user;
  },
};

export const rolesApi = {
  getAll: async (page=1, limit=20): Promise<PaginatedResponse<Role[]>> => {
    const response = await api.get<PaginatedResponse<Role[]>>(`/roles?page=${page}&limit=${limit}`);
    return response.data;
  },
  getById: async (id: number): Promise<{ success: boolean; data: Role }> => {
      const response = await api.get(`/roles/${id}`);
      return response.data;
  },
  create: async (data: RoleFormData): Promise<{ success: boolean; data: Role }> => {
    const response = await api.post('/roles', data);
    return response.data;
  },
  update: async (id: number, data: RoleFormData): Promise<{ success: boolean; data: Role }> => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },
}

export const usersApi = {
  getAll: async (page = 1, limit = 20): Promise<PaginatedResponse<GeneralUser[]>> => {
    const response = await api.get(`/users/?page=${page}&limit=${limit}`);
    return response.data;
  },
  getById: async (id: number): Promise<{ success: boolean; data: GeneralUser }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: CreateUserFormData): Promise<{ success: boolean; data: GeneralUser }> => {
    const response = await api.post('/users/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<UpdateUserFormData>): Promise<{ success: boolean; data: GeneralUser }> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};