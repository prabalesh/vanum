package dtos

import "time"

type MovieRating string

const (
	RatingU  MovieRating = "U"
	RatingUA MovieRating = "U/A"
	RatingA  MovieRating = "A"
	RatingS  MovieRating = "S"
)

type CreateMovieRequest struct {
	OriginalTitle string      `json:"original_title" binding:"required,min=1,max=255"`
	Duration      int         `json:"duration_minutes" binding:"required,min=1"`
	ReleaseDate   time.Time   `json:"release_date" binding:"required"`
	Rating        MovieRating `json:"rating" binding:"required"`
	Description   string      `json:"description"`
	PosterURL     string      `json:"poster_url" binding:"max=500"`
	GenreIDs      []uint      `json:"genre_ids" binding:"required,min=1"`
	CastIDs       []uint      `json:"cast_ids"`
}

type UpdateMovieRequest struct {
	OriginalTitle *string      `json:"original_title,omitempty" binding:"omitempty,min=1,max=255"`
	Duration      *int         `json:"duration_minutes,omitempty" binding:"omitempty,min=1"`
	ReleaseDate   *time.Time   `json:"release_date,omitempty"`
	Rating        *MovieRating `json:"rating,omitempty"`
	Description   *string      `json:"description,omitempty"`
	PosterURL     *string      `json:"poster_url,omitempty" binding:"omitempty,max=500"`
	GenreIDs      []uint       `json:"genre_ids,omitempty"`
	CastIDs       []uint       `json:"cast_ids,omitempty"`
	IsActive      *bool        `json:"is_active,omitempty"`
}

type MovieLanguageRequest struct {
	LanguageID     uint   `json:"language_id" binding:"required"`
	Title          string `json:"title" binding:"required"`
	Description    string `json:"description"`
	HasAudio       bool   `json:"has_audio"`
	HasSubtitles   bool   `json:"has_subtitles"`
	AudioFormat    string `json:"audio_format"`
	SubtitleFormat string `json:"subtitle_format"`
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
