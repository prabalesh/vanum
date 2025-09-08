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

// CreateMovie - Create a new movie
func CreateMovie(c *gin.Context) {
	var req dtos.CreateMovieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	movie := models.Movie{
		OriginalTitle: req.OriginalTitle,
		Duration:      req.Duration,
		ReleaseDate:   req.ReleaseDate,
		Genre:         req.Genre,
		Rating:        req.Rating,
		Description:   req.Description,
		PosterURL:     req.PosterURL,
		Director:      req.Director,
		Cast:          req.Cast,
		IsActive:      true,
	}

	if err := database.DB.Create(&movie).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create movie"))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Movie created successfully", movie))
}

// GetAllMovies - Get all movies with pagination
func GetAllMovies(c *gin.Context) {
	var movies []models.Movie
	query := database.DB.Preload("MovieLanguages.Language")

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Filters
	if search := c.Query("search"); search != "" {
		query = query.Where("original_title ILIKE ?", "%"+search+"%")
	}

	if genre := c.Query("genre"); genre != "" {
		query = query.Where("genre = ?", genre)
	}

	if isActive := c.Query("is_active"); isActive != "" {
		query = query.Where("is_active = ?", isActive == "true")
	}

	// Get total count
	var total int64
	query.Model(&models.Movie{}).Count(&total)

	// Get movies with pagination
	if err := query.Offset(offset).Limit(limit).Find(&movies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch movies"))
		return
	}

	c.JSON(http.StatusOK, utils.PaginationResponse("Movies retrieved successfully", movies, page, limit, total))
}

// GetMovieByID - Get movie by ID
func GetMovieByID(c *gin.Context) {
	movieID := c.Param("id")
	id, err := strconv.ParseUint(movieID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	var movie models.Movie
	if err := database.DB.Preload("MovieLanguages.Language").First(&movie, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Movie not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie retrieved successfully", movie))
}

// UpdateMovie - Update movie
func UpdateMovie(c *gin.Context) {
	movieID := c.Param("id")
	id, err := strconv.ParseUint(movieID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	var req dtos.UpdateMovieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	var movie models.Movie
	if err := database.DB.First(&movie, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Movie not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Update fields if provided
	updateData := make(map[string]interface{})
	if req.OriginalTitle != "" {
		updateData["original_title"] = req.OriginalTitle
	}
	if req.Duration != 0 {
		updateData["duration"] = req.Duration
	}
	if req.ReleaseDate != nil {
		updateData["release_date"] = *req.ReleaseDate
	}
	if req.Genre != "" {
		updateData["genre"] = req.Genre
	}
	if req.Rating != "" {
		updateData["rating"] = req.Rating
	}
	if req.Description != "" {
		updateData["description"] = req.Description
	}
	if req.PosterURL != "" {
		updateData["poster_url"] = req.PosterURL
	}
	if req.Director != "" {
		updateData["director"] = req.Director
	}
	if req.Cast != "" {
		updateData["cast"] = req.Cast
	}
	if req.IsActive != nil {
		updateData["is_active"] = *req.IsActive
	}

	if err := database.DB.Model(&movie).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update movie"))
		return
	}

	// Reload movie
	database.DB.Preload("MovieLanguages.Language").First(&movie, movie.ID)

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie updated successfully", movie))
}

// DeleteMovie - Delete movie (soft delete)
func DeleteMovie(c *gin.Context) {
	movieID := c.Param("id")
	id, err := strconv.ParseUint(movieID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	var movie models.Movie
	if err := database.DB.First(&movie, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Movie not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	if err := database.DB.Delete(&movie).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete movie"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie deleted successfully", nil))
}
