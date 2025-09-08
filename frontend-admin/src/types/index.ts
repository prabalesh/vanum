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

export interface Movie {
  id: number;
  original_title: string;
  duration_minutes: number;
  release_date: string;
  genre: string;
  rating: string;
  description: string;
  poster_url: string;
  director: string;
  cast: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  movie_languages?: MovieLanguage[];
  screenings?: Screening[];
}

export interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
}

export interface MovieLanguage {
  id: number;
  movie_id: number;
  language_id: number;
  title: string;
  description: string;
  language: Language;
}

export interface Theater {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  is_active: boolean;
  screens?: Screen[];
}

export interface Screen {
  id: number;
  theater_id: number;
  name: string;
  total_seats: number;
  screen_type: string;
  theater?: Theater;
}

export interface Screening {
  id: number;
  movie_id: number;
  screen_id: number;
  language_id: number;
  subtitle_language_id?: number;
  show_date: string;
  show_time: string;
  end_time: string;
  base_price: number;
  premium_price?: number;
  available_seats: number;
  audio_format: string;
  video_format: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  movie: Movie;
  screen: Screen;
  language: Language;
  subtitle_language?: Language;
}

export interface MovieFormData {
  original_title: string;
  duration_minutes: number;
  release_date: string;
  genre: string;
  rating: string;
  description: string;
  poster_url: string;
  director: string;
  cast: string;
}

export interface ScreeningFormData {
  movie_id: number;
  screen_id: number;
  language_id: number;
  subtitle_language_id?: number;
  show_date: string;
  show_time: string;
  end_time: string;
  base_price: number;
  premium_price?: number;
  available_seats: number;
  audio_format: string;
  video_format: string;
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