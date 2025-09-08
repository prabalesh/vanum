package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/database"
	"github.com/prabalesh/vanam/vanam-api/internal/dtos"
	"github.com/prabalesh/vanam/vanam-api/internal/models"
	"github.com/prabalesh/vanam/vanam-api/internal/utils"
	"gorm.io/gorm"
)

// CreateScreening - Create a new screening
func CreateScreening(c *gin.Context) {
	var req dtos.CreateScreeningRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Validate movie exists
	var movie models.Movie
	if err := database.DB.First(&movie, req.MovieID).Error; err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	// Validate screen exists
	var screen models.Screen
	if err := database.DB.First(&screen, req.ScreenID).Error; err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid screen ID"))
		return
	}

	// Validate language exists
	var language models.Language
	if err := database.DB.First(&language, req.LanguageID).Error; err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid language ID"))
		return
	}

	// Validate subtitle language if provided
	if req.SubtitleLanguageID != nil {
		var subtitleLang models.Language
		if err := database.DB.First(&subtitleLang, *req.SubtitleLanguageID).Error; err != nil {
			c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid subtitle language ID"))
			return
		}
	}

	// Check for scheduling conflicts
	var existingScreening models.Screening
	if err := database.DB.Where(
		"screen_id = ? AND show_date = ? AND ((show_time <= ? AND end_time > ?) OR (show_time < ? AND end_time >= ?))",
		req.ScreenID, req.ShowDate.Format("2006-01-02"),
		req.ShowTime.Format("15:04:05"), req.ShowTime.Format("15:04:05"),
		req.EndTime.Format("15:04:05"), req.EndTime.Format("15:04:05"),
	).First(&existingScreening).Error; err == nil {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Screen is already booked for this time slot"))
		return
	}

	screening := models.Screening{
		MovieID:            req.MovieID,
		ScreenID:           req.ScreenID,
		LanguageID:         req.LanguageID,
		SubtitleLanguageID: req.SubtitleLanguageID,
		ShowDate:           req.ShowDate,
		ShowTime:           req.ShowTime,
		EndTime:            req.EndTime,
		BasePrice:          req.BasePrice,
		PremiumPrice:       req.PremiumPrice,
		AvailableSeats:     req.AvailableSeats,
		AudioFormat:        req.AudioFormat,
		VideoFormat:        req.VideoFormat,
		IsActive:           true,
	}

	if err := database.DB.Create(&screening).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create screening"))
		return
	}

	// Load relationships
	database.DB.Preload("Movie").Preload("Screen.Theater").Preload("Language").Preload("SubtitleLanguage").First(&screening, screening.ID)

	c.JSON(http.StatusCreated, utils.SuccessResponse("Screening created successfully", screening))
}

// GetScreenings - Get screenings with filters
func GetScreenings(c *gin.Context) {
	var filters dtos.ScreeningFilters
	if err := c.ShouldBindQuery(&filters); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	var screenings []models.Screening
	query := database.DB.Preload("Movie").Preload("Screen.Theater").Preload("Language").Preload("SubtitleLanguage")

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Apply filters
	if filters.MovieID != nil {
		query = query.Where("movie_id = ?", *filters.MovieID)
	}

	if filters.LanguageID != nil {
		query = query.Where("language_id = ?", *filters.LanguageID)
	}

	if filters.Date != "" {
		query = query.Where("show_date = ?", filters.Date)
	}

	if filters.TheaterID != nil {
		query = query.Joins("JOIN screens ON screenings.screen_id = screens.id").
			Where("screens.theater_id = ?", *filters.TheaterID)
	}

	if filters.ScreenID != nil {
		query = query.Where("screen_id = ?", *filters.ScreenID)
	}

	// Only active screenings with available seats
	query = query.Where("screenings.is_active = ? AND available_seats > 0", true)

	// Order by date and time
	query = query.Order("show_date ASC, show_time ASC")

	// Get total count
	var total int64
	query.Model(&models.Screening{}).Count(&total)

	// Get screenings with pagination
	if err := query.Offset(offset).Limit(limit).Find(&screenings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch screenings"))
		return
	}

	c.JSON(http.StatusOK, utils.PaginationResponse("Screenings retrieved successfully", screenings, page, limit, total))
}

// GetScreeningByID - Get screening by ID
func GetScreeningByID(c *gin.Context) {
	screeningID := c.Param("id")
	id, err := strconv.ParseUint(screeningID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid screening ID"))
		return
	}

	var screening models.Screening
	if err := database.DB.Preload("Movie").Preload("Screen.Theater").Preload("Language").Preload("SubtitleLanguage").First(&screening, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Screening not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Screening retrieved successfully", screening))
}

// UpdateScreening - Update screening
func UpdateScreening(c *gin.Context) {
	screeningID := c.Param("id")
	id, err := strconv.ParseUint(screeningID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid screening ID"))
		return
	}

	var req dtos.UpdateScreeningRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	var screening models.Screening
	if err := database.DB.First(&screening, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Screening not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Update fields if provided
	updateData := make(map[string]interface{})

	if req.MovieID != 0 {
		updateData["movie_id"] = req.MovieID
	}
	if req.ScreenID != 0 {
		updateData["screen_id"] = req.ScreenID
	}
	if req.LanguageID != 0 {
		updateData["language_id"] = req.LanguageID
	}
	if req.SubtitleLanguageID != nil {
		updateData["subtitle_language_id"] = req.SubtitleLanguageID
	}
	if req.ShowDate != nil {
		updateData["show_date"] = *req.ShowDate
	}
	if req.ShowTime != nil {
		updateData["show_time"] = *req.ShowTime
	}
	if req.EndTime != nil {
		updateData["end_time"] = *req.EndTime
	}
	if req.BasePrice != nil {
		updateData["base_price"] = *req.BasePrice
	}
	if req.PremiumPrice != nil {
		updateData["premium_price"] = *req.PremiumPrice
	}
	if req.AvailableSeats != nil {
		updateData["available_seats"] = *req.AvailableSeats
	}
	if req.AudioFormat != "" {
		updateData["audio_format"] = req.AudioFormat
	}
	if req.VideoFormat != "" {
		updateData["video_format"] = req.VideoFormat
	}
	if req.IsActive != nil {
		updateData["is_active"] = *req.IsActive
	}

	if err := database.DB.Model(&screening).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update screening"))
		return
	}

	// Reload screening
	database.DB.Preload("Movie").Preload("Screen.Theater").Preload("Language").Preload("SubtitleLanguage").First(&screening, screening.ID)

	c.JSON(http.StatusOK, utils.SuccessResponse("Screening updated successfully", screening))
}

// DeleteScreening - Delete screening (soft delete)
func DeleteScreening(c *gin.Context) {
	screeningID := c.Param("id")
	id, err := strconv.ParseUint(screeningID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid screening ID"))
		return
	}

	var screening models.Screening
	if err := database.DB.First(&screening, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Screening not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	if err := database.DB.Delete(&screening).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete screening"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Screening deleted successfully", nil))
}

// GetLanguages - Get all languages
func GetLanguages(c *gin.Context) {
	var languages []models.Language

	if err := database.DB.Find(&languages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch languages"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Languages retrieved successfully", languages))
}
