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

// GetTheaters - Get all theaters with optional pagination and filtering
func GetTheaters(c *gin.Context) {
	var theaters []models.Theater
	query := database.DB.Preload("Screens")

	// Optional filters
	if city := c.Query("city"); city != "" {
		query = query.Where("city ILIKE ?", "%"+city+"%")
	}
	if state := c.Query("state"); state != "" {
		query = query.Where("state ILIKE ?", "%"+state+"%")
	}
	if isActive := c.Query("is_active"); isActive != "" {
		query = query.Where("is_active = ?", isActive == "true")
	}

	// Pagination
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "10")

	pageInt, _ := strconv.Atoi(page)
	limitInt, _ := strconv.Atoi(limit)
	offset := (pageInt - 1) * limitInt

	var total int64
	database.DB.Model(&models.Theater{}).Count(&total)

	if err := query.Offset(offset).Limit(limitInt).Find(&theaters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch theaters"))
		return
	}

	response := map[string]interface{}{
		"data": theaters,
		"pagination": map[string]interface{}{
			"page":        pageInt,
			"limit":       limitInt,
			"total":       total,
			"total_pages": (total + int64(limitInt) - 1) / int64(limitInt),
		},
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Theaters retrieved successfully", response))
}

// GetTheaterByID - Get single theater by ID
func GetTheaterByID(c *gin.Context) {
	theaterID := c.Param("id")
	id, err := strconv.Atoi(theaterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid theater ID"))
		return
	}

	var theater models.Theater
	if err := database.DB.Preload("Screens").First(&theater, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Theater not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to retrieve theater"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Theater retrieved successfully", theater))
}

// CreateTheater - Create new theater
func CreateTheater(c *gin.Context) {
	var req dtos.TheaterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	theater := models.Theater{
		Name:     req.Name,
		Address:  req.Address,
		City:     req.City,
		State:    req.State,
		IsActive: true, // Default to active
	}

	if req.IsActive != nil {
		theater.IsActive = *req.IsActive
	}

	if err := database.DB.Create(&theater).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create theater"))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Theater created successfully", theater))
}

// UpdateTheater - Update existing theater
func UpdateTheater(c *gin.Context) {
	theaterID := c.Param("id")
	id, err := strconv.Atoi(theaterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid theater ID"))
		return
	}

	var theater models.Theater
	if err := database.DB.First(&theater, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Theater not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	var req dtos.TheaterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Update fields
	theater.Name = req.Name
	theater.Address = req.Address
	theater.City = req.City
	theater.State = req.State

	if req.IsActive != nil {
		theater.IsActive = *req.IsActive
	}

	if err := database.DB.Save(&theater).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update theater"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Theater updated successfully", theater))
}

// DeleteTheater - Delete theater (soft delete)
func DeleteTheater(c *gin.Context) {
	theaterID := c.Param("id")
	id, err := strconv.Atoi(theaterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid theater ID"))
		return
	}

	var theater models.Theater
	if err := database.DB.First(&theater, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Theater not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Check if theater has screens
	var screenCount int64
	database.DB.Model(&models.Screen{}).Where("theater_id = ?", id).Count(&screenCount)
	if screenCount > 0 {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Cannot delete theater with existing screens"))
		return
	}

	if err := database.DB.Delete(&theater).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete theater"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Theater deleted successfully", nil))
}

// ToggleTheaterStatus - Toggle theater active/inactive status
func ToggleTheaterStatus(c *gin.Context) {
	theaterID := c.Param("id")
	id, err := strconv.Atoi(theaterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid theater ID"))
		return
	}

	var theater models.Theater
	if err := database.DB.First(&theater, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Theater not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	theater.IsActive = !theater.IsActive

	if err := database.DB.Save(&theater).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update theater status"))
		return
	}

	status := "activated"
	if !theater.IsActive {
		status = "deactivated"
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Theater "+status+" successfully", theater))
}
