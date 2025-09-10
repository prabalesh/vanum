package models

import "time"

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
	Name       string    `json:"name" gorm:"not null"`
	TheaterID  uint      `json:"theater_id" gorm:"not null"`
	Capacity   int       `json:"capacity" gorm:"default:0"`
	SeatLayout string    `json:"seat_layout" gorm:"type:text"` // JSON string of seat configuration
	IsActive   bool      `json:"is_active" gorm:"default:true"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relationships
	Theater Theater `json:"theater,omitempty"`
	Seats   []Seat  `json:"seats,omitempty"`
}

// models/seat.go
type Seat struct {
	ID           uint      `json:"id" gorm:"primarykey"`
	ScreenID     uint      `json:"screen_id" gorm:"not null"`
	SeatNumber   string    `json:"seat_number" gorm:"not null"`       // A1, B2, 1, 2, etc.
	Row          string    `json:"row" gorm:"not null"`               // A, B, C, Row1, etc.
	Column       int       `json:"column" gorm:"not null"`            // 1, 2, 3, etc.
	SeatType     string    `json:"seat_type" gorm:"default:'normal'"` // normal, premium, disabled_access, couple, recliner
	Status       string    `json:"status" gorm:"default:'available'"` // available, booked, blocked
	Price        float64   `json:"price" gorm:"default:0"`
	IsAccessible bool      `json:"is_accessible" gorm:"default:false"` // For disabled accessibility
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Relationships
	Screen Screen `json:"screen,omitempty"`
}

type SeatLayoutConfig struct {
	Rows            int                 `json:"rows"`
	Columns         int                 `json:"columns"`
	NumberingScheme string              `json:"numbering_scheme"` // "alphabetic", "numeric", "custom"
	RowNaming       string              `json:"row_naming"`       // "alphabetic" (A,B,C), "numeric" (1,2,3), "custom"
	CustomRowNames  []string            `json:"custom_row_names"` // For custom row naming
	SeatTypes       map[string]SeatType `json:"seat_types"`
	Layout          [][]SeatPosition    `json:"layout"`
	WalkwayRows     []int               `json:"walkway_rows"`
	WalkwayCols     []int               `json:"walkway_cols"`
	AccessibleSeats []string            `json:"accessible_seats"` // List of seat numbers marked for disabled access
	PricingTiers    map[string]float64  `json:"pricing_tiers"`
}

type SeatType struct {
	Name         string  `json:"name"`
	Color        string  `json:"color"`
	Price        float64 `json:"price"`
	Available    bool    `json:"available"`
	IsAccessible bool    `json:"is_accessible"`
	Icon         string  `json:"icon"`
	Description  string  `json:"description"`
}

type SeatPosition struct {
	Row          string  `json:"row"`
	Column       int     `json:"column"`
	Type         string  `json:"type"`
	Number       string  `json:"number"`
	Price        float64 `json:"price"`
	IsAccessible bool    `json:"is_accessible"`
	CustomNumber string  `json:"custom_number"` // For custom numbering
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
