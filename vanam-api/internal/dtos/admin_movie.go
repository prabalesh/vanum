package dtos

import "time"

type CreateMovieRequest struct {
	OriginalTitle string    `json:"original_title" binding:"required,min=1,max=255"`
	Duration      int       `json:"duration_minutes" binding:"required,min=1"`
	ReleaseDate   time.Time `json:"release_date" binding:"required"`
	Genre         string    `json:"genre" binding:"max=100"`
	Rating        string    `json:"rating" binding:"max=10"`
	Description   string    `json:"description"`
	PosterURL     string    `json:"poster_url" binding:"max=500"`
	Director      string    `json:"director" binding:"max=255"`
	Cast          string    `json:"cast"`
}

type UpdateMovieRequest struct {
	OriginalTitle string     `json:"original_title,omitempty" binding:"omitempty,min=1,max=255"`
	Duration      int        `json:"duration_minutes,omitempty" binding:"omitempty,min=1"`
	ReleaseDate   *time.Time `json:"release_date,omitempty"`
	Genre         string     `json:"genre,omitempty" binding:"omitempty,max=100"`
	Rating        string     `json:"rating,omitempty" binding:"omitempty,max=10"`
	Description   string     `json:"description,omitempty"`
	PosterURL     string     `json:"poster_url,omitempty" binding:"omitempty,max=500"`
	Director      string     `json:"director,omitempty" binding:"omitempty,max=255"`
	Cast          string     `json:"cast,omitempty"`
	IsActive      *bool      `json:"is_active,omitempty"`
}

type CreateScreeningRequest struct {
	MovieID            uint      `json:"movie_id" binding:"required"`
	ScreenID           uint      `json:"screen_id" binding:"required"`
	LanguageID         uint      `json:"language_id" binding:"required"`
	SubtitleLanguageID *uint     `json:"subtitle_language_id"`
	ShowDate           time.Time `json:"show_date" binding:"required"`
	ShowTime           time.Time `json:"show_time" binding:"required"`
	EndTime            time.Time `json:"end_time" binding:"required"`
	BasePrice          float64   `json:"base_price" binding:"required,min=0"`
	PremiumPrice       *float64  `json:"premium_price" binding:"omitempty,min=0"`
	AvailableSeats     int       `json:"available_seats" binding:"required,min=1"`
	AudioFormat        string    `json:"audio_format" binding:"max=20"`
	VideoFormat        string    `json:"video_format" binding:"max=20"`
}

type UpdateScreeningRequest struct {
	MovieID            uint       `json:"movie_id,omitempty"`
	ScreenID           uint       `json:"screen_id,omitempty"`
	LanguageID         uint       `json:"language_id,omitempty"`
	SubtitleLanguageID *uint      `json:"subtitle_language_id,omitempty"`
	ShowDate           *time.Time `json:"show_date,omitempty"`
	ShowTime           *time.Time `json:"show_time,omitempty"`
	EndTime            *time.Time `json:"end_time,omitempty"`
	BasePrice          *float64   `json:"base_price,omitempty" binding:"omitempty,min=0"`
	PremiumPrice       *float64   `json:"premium_price,omitempty" binding:"omitempty,min=0"`
	AvailableSeats     *int       `json:"available_seats,omitempty" binding:"omitempty,min=0"`
	AudioFormat        string     `json:"audio_format,omitempty" binding:"omitempty,max=20"`
	VideoFormat        string     `json:"video_format,omitempty" binding:"omitempty,max=20"`
	IsActive           *bool      `json:"is_active,omitempty"`
}

type ScreeningFilters struct {
	MovieID    *uint  `form:"movie_id"`
	LanguageID *uint  `form:"language_id"`
	Date       string `form:"date"`
	TheaterID  *uint  `form:"theater_id"`
	ScreenID   *uint  `form:"screen_id"`
}
