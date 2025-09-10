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
  created_at: string;
  updated_at: string;
  screens?: Screen[];
}

// types/index.ts
export interface Screen {
  id: number;
  name: string;
  theater_id: number;
  capacity: number;
  seat_layout: SeatLayoutConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  theater?: Theater;
  seats?: Seat[];
}

// types/index.ts
export interface Seat {
  id: number;
  screen_id: number;
  seat_number: string;
  row: string;
  column: number;
  seat_type: 'normal' | 'premium' | 'disabled_access' | 'couple' | 'recliner' | 'walkway' | 'empty';
  status: 'available' | 'booked' | 'blocked';
  price: number;
  is_accessible: boolean; // For disabled accessibility seats
  custom_number?: string; // Optional custom seat number
  created_at: string;
  updated_at: string;
}

export interface SeatLayoutConfig {
  rows: number;
  columns: number;
  numbering_scheme: string;
  row_naming: string;
  custom_row_names?: string[]; // For custom row naming like "VIP", "Gold", etc.
  seat_types: Record<string, SeatType>;
  layout: SeatPosition[][];
  walkway_rows: number[];
  walkway_cols: number[];
  accessible_seats: string[]; // List of seat numbers marked as accessible
  pricing_tiers?: Record<string, number>; // Different price tiers for seat categories
}

export interface SeatType {
  name: string;
  color: string;
  price: number;
  available: boolean;
  is_accessible?: boolean; // Marks if seat type is for accessibility
  icon?: string; // Icon for UI rendering (emoji or icon class)
  description?: string; // Tooltip description
}

export interface SeatPosition {
  row: string;
  column: number;
  type: 'normal' | 'premium' | 'disabled_access' | 'couple' | 'recliner' | 'walkway' | 'empty';
  number: string;
  price: number;
  is_accessible: boolean;
  custom_number?: string; // For custom numbering schemes
}

// Additional interfaces for enhanced functionality
export interface ScreenLayout {
  id: number;
  screen_id: number;
  layout_config: SeatLayoutConfig;
  total_seats: number;
  accessible_seats_count: number;
  created_at: string;
  updated_at: string;
}

export interface SeatBooking {
  id: number;
  seat_id: number;
  booking_id: number;
  status: 'selected' | 'booked' | 'cancelled';
  booked_at?: string;
  cancelled_at?: string;
}

// For seat selection in booking process
export interface SelectedSeat extends Seat {
  selected?: boolean;
  booking_status?: 'selecting' | 'selected' | 'booking' | 'booked';
}

// Pricing configuration for different seat categories
export interface SeatPricing {
  seat_type: string;
  base_price: number;
  weekend_surcharge?: number;
  holiday_surcharge?: number;
  time_slot_modifiers?: Record<string, number>; // Different pricing for different showtimes
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