package models

import (
	"time"

	"gorm.io/gorm"
)

type Role struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"unique;not null"`
}

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Email     string `gorm:"unique;not null"`
	Password  string `gorm:"not null"`
	Name      string `gorm:"not null"`
	RoleID    uint   `gorm:"not null"`
	Role      Role   `gorm:"foreignKey:RoleID"`
	IsActive  bool   `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// Session model for Redis storage
type Session struct {
	SessionID string    `json:"session_id"`
	UserID    uint      `json:"user_id"`
	RoleID    uint      `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
}

type Movie struct {
	ID            uint           `json:"id" gorm:"primarykey"`
	OriginalTitle string         `json:"original_title" gorm:"not null"`
	Duration      int            `json:"duration_minutes" gorm:"not null"`
	ReleaseDate   time.Time      `json:"release_date" binding:"required" time_format:"2006-01-02"`
	Genre         string         `json:"genre"`
	Rating        string         `json:"rating"`
	Description   string         `json:"description"`
	PosterURL     string         `json:"poster_url"`
	Director      string         `json:"director"`
	Cast          string         `json:"cast"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	MovieLanguages []MovieLanguage `json:"movie_languages,omitempty"`
	Screenings     []Screening     `json:"screenings,omitempty"`
}

type Language struct {
	ID         uint      `json:"id" gorm:"primarykey"`
	Code       string    `json:"code" gorm:"uniqueIndex;not null"`
	Name       string    `json:"name" gorm:"not null"`
	NativeName string    `json:"native_name"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type MovieLanguage struct {
	ID          uint      `json:"id" gorm:"primarykey"`
	MovieID     uint      `json:"movie_id" gorm:"not null"`
	LanguageID  uint      `json:"language_id" gorm:"not null"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Movie    Movie    `json:"movie,omitempty"`
	Language Language `json:"language,omitempty"`
}

type Theater struct {
	ID        uint      `json:"id" gorm:"primarykey"`
	Name      string    `json:"name" gorm:"not null"`
	Address   string    `json:"address"`
	City      string    `json:"city"`
	State     string    `json:"state"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	Screens []Screen `json:"screens,omitempty"`
}

type Screen struct {
	ID         uint      `json:"id" gorm:"primarykey"`
	TheaterID  uint      `json:"theater_id" gorm:"not null"`
	Name       string    `json:"name" gorm:"not null"`
	TotalSeats int       `json:"total_seats" gorm:"not null"`
	ScreenType string    `json:"screen_type"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relationships
	Theater    Theater     `json:"theater,omitempty"`
	Screenings []Screening `json:"screenings,omitempty"`
}

type Screening struct {
	ID                 uint      `json:"id" gorm:"primarykey"`
	MovieID            uint      `json:"movie_id" gorm:"not null"`
	ScreenID           uint      `json:"screen_id" gorm:"not null"`
	LanguageID         uint      `json:"language_id" gorm:"not null"`
	SubtitleLanguageID *uint     `json:"subtitle_language_id"`
	ShowDate           time.Time `json:"show_date" gorm:"type:date;not null"`
	ShowTime           time.Time `json:"show_time" gorm:"type:time;not null"`
	EndTime            time.Time `json:"end_time" gorm:"type:time;not null"`
	BasePrice          float64   `json:"base_price" gorm:"not null"`
	PremiumPrice       *float64  `json:"premium_price"`
	AvailableSeats     int       `json:"available_seats" gorm:"not null"`
	AudioFormat        string    `json:"audio_format"`
	VideoFormat        string    `json:"video_format"`
	IsActive           bool      `json:"is_active" gorm:"default:true"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	// Relationships
	Movie            Movie     `json:"movie,omitempty"`
	Screen           Screen    `json:"screen,omitempty"`
	Language         Language  `json:"language,omitempty"`
	SubtitleLanguage *Language `json:"subtitle_language,omitempty"`
}
