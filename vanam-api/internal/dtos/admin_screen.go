package dtos

import "github.com/prabalesh/vanam/vanam-api/internal/models"

type ScreenRequest struct {
	Name       string                  `json:"name" binding:"required"`
	TheaterID  uint                    `json:"theater_id" binding:"required"`
	SeatLayout models.SeatLayoutConfig `json:"seat_layout" binding:"required"`
	IsActive   *bool                   `json:"is_active"`
}

type UpdateScreenRequest struct {
	Name       string                  `json:"name" binding:"required"`
	SeatLayout models.SeatLayoutConfig `json:"seat_layout" binding:"required"`
	IsActive   *bool                   `json:"is_active"`
	// TheaterID is not needed since we're updating an existing screen
}
