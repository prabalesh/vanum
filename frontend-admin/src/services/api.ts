import axios from "axios";
import toast from "react-hot-toast";
import type {
    ApiResponse,
  CreateUserFormData,
  GeneralUser,
  Genre,
  Language,
  LanguageFormData,
  Movie,
  MovieFormData,
  PaginatedResponse,
  Role,
  RoleFormData,
  Screen,
  Screening,
  ScreeningFormData,
  SeatLayoutConfig,
  Theater,
  UpdateUserFormData,
  User,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/admin/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

const public_api = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  headers: {
    "Content-Type": "application/json"
  }
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    console.log("yes")
    const token = localStorage.getItem("token");
    if (token) {
      console.log("double yes")
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
    const response = await api.get(`/users?page=${page}&limit=${limit}`);
    return response.data;
  },
  getById: async (id: number): Promise<{ success: boolean; data: GeneralUser }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: CreateUserFormData): Promise<{ success: boolean; data: GeneralUser }> => {
    const response = await api.post('/users', data);
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

// Movies API
export const moviesApi = {
  // Public endpoints
  getAll: async (page = 1, limit = 20, search?: string, genre?: string): Promise<PaginatedResponse<Movie[]>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (genre) params.append('genre', genre);
    
    const response = await public_api.get(`/movies?${params}`);
    return response.data;
  },
  
  getById: async (id: number): Promise<{ success: boolean; data: Movie }> => {
    const response = await public_api.get(`/movies/${id}`);
    return response.data;
  },

  // Admin endpoints
  create: async (data: MovieFormData): Promise<{ success: boolean; data: Movie }> => {
    const response = await api.post('/movies', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<MovieFormData>): Promise<{ success: boolean; data: Movie }> => {
    const response = await api.put(`/movies/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/movies/${id}`);
    return response.data;
  },
};

// Screenings API
export const screeningsApi = {
  // Public endpoints
  getAll: async (
    page = 1, 
    limit = 20, 
    filters?: {
      movie_id?: number;
      language_id?: number;
      date?: string;
      theater_id?: number;
    }
  ): Promise<PaginatedResponse<Screening[]>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters?.movie_id) params.append('movie_id', filters.movie_id.toString());
    if (filters?.language_id) params.append('language_id', filters.language_id.toString());
    if (filters?.date) params.append('date', filters.date);
    if (filters?.theater_id) params.append('theater_id', filters.theater_id.toString());
    
    const response = await public_api.get(`/screenings?${params}`);
    return response.data;
  },

  getById: async (id: number): Promise<{ success: boolean; data: Screening }> => {
    const response = await public_api.get(`/screenings/${id}`);
    return response.data;
  },

  // Admin endpoints
  create: async (data: ScreeningFormData): Promise<{ success: boolean; data: Screening }> => {
    const response = await api.post('/screenings/', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<ScreeningFormData>): Promise<{ success: boolean; data: Screening }> => {
    const response = await api.put(`/screenings/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/screenings/${id}`);
    return response.data;
  },
};

// Languages API
export const languagesApi = {
  getAll: async (): Promise<{ success: boolean; data: Language[] }> => {
    const response = await public_api.get('/languages');
    return response.data;
  },
  create: async(movie_id: number, data: LanguageFormData): Promise<{success: boolean}> => {
    const response = await api.post(`/movies/${movie_id}/languages`, data);
    return response.data;
  },
  update: async(movie_id: number, language_id: number, data: LanguageFormData): Promise<{success: boolean}> => {
    const response = await api.put(`/movies/${movie_id}/languages/${language_id}`, data);
    return response.data;
  },
  delete: async(movie_id: number, language_id: number): Promise<{success: boolean}> => {
    const response = await api.delete(`/movies/${movie_id}/languages/${language_id}`);
    return response.data;
  }
};

export const genreApi = {
  getAll: async (): Promise<ApiResponse<Genre[]>> => {
    const response = await public_api.get('/genres');
    return response.data;
  },
}

export const theatersApi = {
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    city?: string; 
    state?: string; 
    is_active?: boolean 
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.city) searchParams.append('city', params.city);
    if (params?.state) searchParams.append('state', params.state);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    const response = await public_api.get(`/theaters?${searchParams.toString()}`);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await public_api.get(`/theaters/${id}`);
    return response.data;
  },

  create: async (data: Omit<Theater, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post('/theaters', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Theater>) => {
    const response = await api.put(`/theaters/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/theaters/${id}`);
    return response.data;
  },

  toggleStatus: async (id: number) => {
    const response = await api.patch(`/theaters/${id}/toggle`);
    return response.data;
  }
};

// services/api.ts
export const screensApi = {
  getByTheater: async (theaterId: number) => {
    const response = await public_api.get(`/theaters/${theaterId}/screens`);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await public_api.get(`/screens/${id}`);
    return response.data;
  },

  create: async (theaterId: number, data: {
    name: string;
    seat_layout: SeatLayoutConfig;
    is_active?: boolean;
  }) => {
    const response = await api.post(`/theaters/${theaterId}/screens`, {
      ...data,
      theater_id: theaterId
    });
    return response.data;
  },

  update: async (id: number, data: Partial<Screen>) => {
    const response = await api.put(`/screens/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/screens/${id}`);
    return response.data;
  }
};
