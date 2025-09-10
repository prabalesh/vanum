package models

import (
	"time"

	"gorm.io/gorm"
)

type MovieRating string

const (
	RatingU  MovieRating = "U"
	RatingUA MovieRating = "U/A"
	RatingA  MovieRating = "A"
	RatingS  MovieRating = "S"
)

type Genre struct {
	ID     uint    `json:"id" gorm:"primaryKey"`
	Name   string  `json:"name" gorm:"unique;not null"`
	Movies []Movie `json:"movies" gorm:"many2many:movie_genres;"`
}

type Person struct {
	ID     uint    `json:"id" gorm:"primaryKey"`
	Name   string  `json:"name" gorm:"not null"`
	Bio    string  `json:"bio"`
	Movies []Movie `json:"movies" gorm:"many2many:movie_cast;"`
}

type MovieCast struct {
	MovieID       uint   `gorm:"primaryKey"`
	PersonID      uint   `gorm:"primaryKey"`
	Role          string // "Actor", "Director", "Producer"
	CharacterName string // For actors
	Movie         Movie
	Person        Person
}

type Language struct {
	ID         uint      `json:"id" gorm:"primarykey"`
	Code       string    `json:"code" gorm:"uniqueIndex;not null"`
	Name       string    `json:"name" gorm:"not null"`
	NativeName string    `json:"native_name"`
	IsActive   bool      `json:"is_active" gorm:"default:true"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Movie struct {
	ID            uint           `json:"id" gorm:"primarykey"`
	OriginalTitle string         `json:"original_title" gorm:"not null"`
	Duration      int            `json:"duration_minutes" gorm:"not null"`
	ReleaseDate   time.Time      `json:"release_date"`
	Rating        MovieRating    `json:"rating"` // Use enum/constants
	Description   string         `json:"description"`
	PosterURL     string         `json:"poster_url"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Proper relationships
	Genres     []Genre     `gorm:"many2many:movie_genres;" json:"genres,omitempty"`
	Cast       []Person    `gorm:"many2many:movie_cast;" json:"cast,omitempty"`
	Screenings []Screening `json:"screenings,omitempty"`

	MovieLanguages     []MovieLanguage `json:"movie_languages,omitempty"`
	AvailableLanguages []Language      `json:"available_languages,omitempty" gorm:"many2many:movie_languages;"`
}

type MovieLanguage struct {
	ID          uint   `json:"id" gorm:"primarykey"`
	MovieID     uint   `json:"movie_id" gorm:"not null"`
	LanguageID  uint   `json:"language_id" gorm:"not null"`
	Title       string `json:"title" gorm:"not null"`
	Description string `json:"description"`

	HasAudio       bool   `json:"has_audio" gorm:"default:false"`     // Audio track available
	HasSubtitles   bool   `json:"has_subtitles" gorm:"default:false"` // Subtitles available
	AudioFormat    string `json:"audio_format"`                       // "Dolby Atmos", "Stereo"
	SubtitleFormat string `json:"subtitle_format"`                    // "SRT", "VTT"

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	Movie    Movie    `json:"movie,omitempty"`
	Language Language `json:"language,omitempty"`
}
