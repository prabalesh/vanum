package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/database"
	"github.com/prabalesh/vanam/vanam-api/internal/models"
	"github.com/prabalesh/vanam/vanam-api/internal/utils"
	"gorm.io/gorm"
)

type GenreRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

// GetAllGenres - Get all genres (public endpoint)
func GetAllGenres(c *gin.Context) {
	var genres []models.Genre

	// Optional search filter
	query := database.DB.Model(&models.Genre{})
	if search := c.Query("search"); search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	if err := query.Order("name ASC").Find(&genres).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch genres"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Genres retrieved successfully", genres))
}

// CreateGenre - Create a new genre (admin only)
func CreateGenre(c *gin.Context) {
	var req GenreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Check if genre already exists
	var existingGenre models.Genre
	if err := database.DB.Where("name = ?", req.Name).First(&existingGenre).Error; err == nil {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Genre already exists"))
		return
	}

	genre := models.Genre{
		Name: req.Name,
	}

	if err := database.DB.Create(&genre).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create genre"))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Genre created successfully", genre))
}

// UpdateGenre - Update existing genre (admin only)
func UpdateGenre(c *gin.Context) {
	genreID := c.Param("id")
	id, err := strconv.Atoi(genreID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid genre ID"))
		return
	}

	var req GenreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	var genre models.Genre
	if err := database.DB.First(&genre, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Genre not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Check if updated name conflicts with another genre
	var existingGenre models.Genre
	if err := database.DB.Where("name = ? AND id != ?", req.Name, id).First(&existingGenre).Error; err == nil {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Genre name already exists"))
		return
	}

	genre.Name = req.Name
	if err := database.DB.Save(&genre).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update genre"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Genre updated successfully", genre))
}

// DeleteGenre - Delete genre (admin only)
func DeleteGenre(c *gin.Context) {
	genreID := c.Param("id")
	id, err := strconv.Atoi(genreID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid genre ID"))
		return
	}

	var genre models.Genre
	if err := database.DB.First(&genre, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Genre not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Check if genre is used by any movies
	var movieCount int64
	database.DB.Model(&models.Movie{}).Joins("JOIN movie_genres ON movie_genres.movie_id = movies.id").
		Where("movie_genres.genre_id = ?", id).Count(&movieCount)

	if movieCount > 0 {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Cannot delete genre that is used by movies"))
		return
	}

	if err := database.DB.Delete(&genre).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete genre"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Genre deleted successfully", nil))
}
