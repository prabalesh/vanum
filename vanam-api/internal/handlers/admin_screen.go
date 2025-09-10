package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/database"
	"github.com/prabalesh/vanam/vanam-api/internal/dtos"
	"github.com/prabalesh/vanam/vanam-api/internal/models"
	"github.com/prabalesh/vanam/vanam-api/internal/utils"
	"gorm.io/gorm"
)

// GetScreensByTheater - Get all screens for a theater
func GetScreensByTheater(c *gin.Context) {
	theaterID := c.Param("id")
	id, err := strconv.Atoi(theaterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid theater ID"))
		return
	}

	var screens []models.Screen
	if err := database.DB.Where("theater_id = ?", id).
		Preload("Seats").
		Find(&screens).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch screens"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Screens retrieved successfully", screens))
}

// GetScreenByID - Get single screen with seat layout
func GetScreenByID(c *gin.Context) {
	screenID := c.Param("id")
	id, err := strconv.Atoi(screenID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid screen ID"))
		return
	}

	var screen models.Screen
	if err := database.DB.Preload("Theater").
		Preload("Seats").
		First(&screen, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Screen not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Screen retrieved successfully", screen))
}

// CreateScreen - Create new screen with seat layout
func CreateScreen(c *gin.Context) {
	var req dtos.ScreenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Verify theater exists
	var theater models.Theater
	if err := database.DB.First(&theater, req.TheaterID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Theater not found"))
		return
	}

	// Convert seat layout to JSON string
	layoutJSON, err := json.Marshal(req.SeatLayout)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid seat layout"))
		return
	}

	// Calculate total capacity from layout
	capacity := 0
	for _, row := range req.SeatLayout.Layout {
		for _, seat := range row {
			if seat.Type != "walkway" && seat.Type != "empty" {
				capacity++
			}
		}
	}

	screen := models.Screen{
		Name:       req.Name,
		TheaterID:  req.TheaterID,
		Capacity:   capacity,
		SeatLayout: string(layoutJSON),
		IsActive:   true,
	}

	if req.IsActive != nil {
		screen.IsActive = *req.IsActive
	}

	// Start transaction
	tx := database.DB.Begin()

	if err := tx.Create(&screen).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create screen"))
		return
	}

	// Create individual seats
	var seats []models.Seat
	for _, row := range req.SeatLayout.Layout {
		for _, seatPos := range row {
			if seatPos.Type != "walkway" && seatPos.Type != "empty" {
				seat := models.Seat{
					ScreenID:   screen.ID,
					SeatNumber: seatPos.Number,
					Row:        seatPos.Row,
					Column:     seatPos.Column,
					SeatType:   seatPos.Type,
					Status:     "available",
					Price:      seatPos.Price,
				}
				seats = append(seats, seat)
			}
		}
	}

	if len(seats) > 0 {
		if err := tx.CreateInBatches(seats, 100).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create seats"))
			return
		}
	}

	tx.Commit()

	// Load created screen with relationships
	database.DB.Preload("Theater").Preload("Seats").First(&screen, screen.ID)

	c.JSON(http.StatusCreated, utils.SuccessResponse("Screen created successfully", screen))
}

// UpdateScreen - Update screen and seat layout
func UpdateScreen(c *gin.Context) {
	screenID := c.Param("id")
	id, err := strconv.Atoi(screenID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid screen ID"))
		return
	}

	var screen models.Screen
	if err := database.DB.First(&screen, id).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Screen not found"))
		return
	}

	var req dtos.UpdateScreenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Convert seat layout to JSON string
	layoutJSON, err := json.Marshal(req.SeatLayout)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid seat layout"))
		return
	}

	// Calculate new capacity
	capacity := 0
	for _, row := range req.SeatLayout.Layout {
		for _, seat := range row {
			if seat.Type != "walkway" && seat.Type != "empty" {
				capacity++
			}
		}
	}

	// Start transaction
	tx := database.DB.Begin()

	// Update screen
	screen.Name = req.Name
	screen.Capacity = capacity
	screen.SeatLayout = string(layoutJSON)
	if req.IsActive != nil {
		screen.IsActive = *req.IsActive
	}

	if err := tx.Save(&screen).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update screen"))
		return
	}

	// Delete existing seats and recreate
	if err := tx.Where("screen_id = ?", screen.ID).Delete(&models.Seat{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update seats"))
		return
	}

	// Create new seats
	var seats []models.Seat
	for _, row := range req.SeatLayout.Layout {
		for _, seatPos := range row {
			if seatPos.Type != "walkway" && seatPos.Type != "empty" {
				seat := models.Seat{
					ScreenID:   screen.ID,
					SeatNumber: seatPos.Number,
					Row:        seatPos.Row,
					Column:     seatPos.Column,
					SeatType:   seatPos.Type,
					Status:     "available",
					Price:      seatPos.Price,
				}
				seats = append(seats, seat)
			}
		}
	}

	if len(seats) > 0 {
		if err := tx.CreateInBatches(seats, 100).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create seats"))
			return
		}
	}

	tx.Commit()

	// Load updated screen
	database.DB.Preload("Theater").Preload("Seats").First(&screen, screen.ID)

	c.JSON(http.StatusOK, utils.SuccessResponse("Screen updated successfully", screen))
}

// DeleteScreen - Delete screen and all its seats
func DeleteScreen(c *gin.Context) {
	screenID := c.Param("id")
	id, err := strconv.Atoi(screenID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid screen ID"))
		return
	}

	var screen models.Screen
	if err := database.DB.First(&screen, id).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Screen not found"))
		return
	}

	// Start transaction
	tx := database.DB.Begin()

	// Delete all seats first
	if err := tx.Where("screen_id = ?", screen.ID).Delete(&models.Seat{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete seats"))
		return
	}

	// Delete screen
	if err := tx.Delete(&screen).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete screen"))
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, utils.SuccessResponse("Screen deleted successfully", nil))
}

// GetAllScreens - Get all screens across all theaters
func GetAllScreens(c *gin.Context) {
	var screens []models.Screen
	query := database.DB.Preload("Theater")

	// Optional filtering by theater
	if theaterID := c.Query("theater_id"); theaterID != "" {
		query = query.Where("theater_id = ?", theaterID)
	}

	// Pagination
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "10")

	pageInt, _ := strconv.Atoi(page)
	limitInt, _ := strconv.Atoi(limit)
	offset := (pageInt - 1) * limitInt

	var total int64
	database.DB.Model(&models.Screen{}).Count(&total)

	if err := query.Offset(offset).Limit(limitInt).Find(&screens).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch screens"))
		return
	}

	response := map[string]interface{}{
		"data": screens,
		"pagination": map[string]interface{}{
			"page":        pageInt,
			"limit":       limitInt,
			"total":       total,
			"total_pages": (total + int64(limitInt) - 1) / int64(limitInt),
		},
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Screens retrieved successfully", response))
}
