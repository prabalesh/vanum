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
  role: Role
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

export interface Genre {
  id: number;
  name: string;
}

export interface Person {
  id: number;
  name: string;
  bio: string;
  movies: Movie[]
}

export interface Movie {
  id: number;
  original_title: string;
  duration_minutes: number;
  release_date: string;
  rating: string;
  description?: string;
  poster_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  genres?: Genre[];
  cast?: Person[];
  movie_languages: MovieLanguage[];
}

export interface MovieFormData {
  original_title: string;
  duration_minutes: number;
  release_date: string;
  rating: string;
  description: string;
  poster_url: string;
  genre_ids: number[];
  cast_ids: number[];
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

  has_audio: boolean;
  has_subtitles: boolean;
  audio_format: string;
  subtitle_format: string;
}

export interface LanguageFormData {
  language_id: number;
  title: string;
  description: string;
  has_audio: boolean;
  has_subtitles: boolean;
  audio_format: string;
  subtitle_format: string;
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