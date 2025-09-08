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

// CreateMovie - Create a new movie with proper genre and cast associations
func CreateMovie(c *gin.Context) {
	var req dtos.CreateMovieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Validate genres exist
	var genreCount int64
	if err := database.DB.Model(&models.Genre{}).Where("id IN ?", req.GenreIDs).Count(&genreCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to validate genres"))
		return
	}
	if genreCount != int64(len(req.GenreIDs)) {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Some genre IDs are invalid"))
		return
	}

	// Validate cast exists (if provided)
	if len(req.CastIDs) > 0 {
		var castCount int64
		if err := database.DB.Model(&models.Person{}).Where("id IN ?", req.CastIDs).Count(&castCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to validate cast"))
			return
		}
		if castCount != int64(len(req.CastIDs)) {
			c.JSON(http.StatusBadRequest, utils.ErrorResponse("Some cast IDs are invalid"))
			return
		}
	}

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create movie
	movie := models.Movie{
		OriginalTitle: req.OriginalTitle,
		Duration:      req.Duration,
		ReleaseDate:   req.ReleaseDate,
		Rating:        models.MovieRating(req.Rating),
		Description:   req.Description,
		PosterURL:     req.PosterURL,
		IsActive:      true,
	}

	if err := tx.Create(&movie).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create movie"))
		return
	}

	// Associate genres
	var genres []models.Genre
	if err := tx.Where("id IN ?", req.GenreIDs).Find(&genres).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch genres"))
		return
	}
	if err := tx.Model(&movie).Association("Genres").Replace(&genres); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to associate genres"))
		return
	}

	// Associate cast (if provided)
	if len(req.CastIDs) > 0 {
		var persons []models.Person
		if err := tx.Where("id IN ?", req.CastIDs).Find(&persons).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch cast"))
			return
		}
		if err := tx.Model(&movie).Association("Cast").Replace(&persons); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to associate cast"))
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create movie"))
		return
	}

	// Reload movie with associations
	database.DB.Preload("Genres").Preload("Cast").First(&movie, movie.ID)

	c.JSON(http.StatusCreated, utils.SuccessResponse("Movie created successfully", movie))
}

// GetAllMovies - Get all movies with pagination and proper filtering
func GetAllMovies(c *gin.Context) {
	var movies []models.Movie
	query := database.DB.Preload("Genres").Preload("Cast")

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Filters
	if search := c.Query("search"); search != "" {
		query = query.Where("original_title ILIKE ?", "%"+search+"%")
	}

	// Filter by genre
	if genreIDStr := c.Query("genre_id"); genreIDStr != "" {
		genreID, err := strconv.Atoi(genreIDStr)
		if err == nil {
			query = query.Distinct().Joins("JOIN movie_genres ON movie_genres.movie_id = movies.id").
				Where("movie_genres.genre_id = ?", genreID)
		}
	}

	// Filter by cast member
	if castIDStr := c.Query("cast_id"); castIDStr != "" {
		castID, err := strconv.Atoi(castIDStr)
		if err == nil {
			query = query.Distinct().Joins("JOIN movie_cast ON movie_cast.movie_id = movies.id").
				Where("movie_cast.person_id = ?", castID)
		}
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

// GetMovieByID - Get movie by ID with all associations
func GetMovieByID(c *gin.Context) {
	movieID := c.Param("id")
	id, err := strconv.Atoi(movieID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	var movie models.Movie
	err = database.DB.
		Preload("Genres").
		Preload("Cast").
		Preload("MovieLanguages.Language").
		Preload("Screenings").
		First(&movie, id).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Movie not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie retrieved successfully", movie))
}

// UpdateMovie - Update movie with proper association handling
func UpdateMovie(c *gin.Context) {
	movieID := c.Param("id")
	id, err := strconv.Atoi(movieID)
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

	// Validate genres if provided
	if len(req.GenreIDs) > 0 {
		var genreCount int64
		if err := database.DB.Model(&models.Genre{}).Where("id IN ?", req.GenreIDs).Count(&genreCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to validate genres"))
			return
		}
		if genreCount != int64(len(req.GenreIDs)) {
			c.JSON(http.StatusBadRequest, utils.ErrorResponse("Some genre IDs are invalid"))
			return
		}
	}

	// Validate cast if provided
	if len(req.CastIDs) > 0 {
		var castCount int64
		if err := database.DB.Model(&models.Person{}).Where("id IN ?", req.CastIDs).Count(&castCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to validate cast"))
			return
		}
		if castCount != int64(len(req.CastIDs)) {
			c.JSON(http.StatusBadRequest, utils.ErrorResponse("Some cast IDs are invalid"))
			return
		}
	}

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update basic fields
	updateData := make(map[string]interface{})
	if req.OriginalTitle != nil && *req.OriginalTitle != "" {
		updateData["original_title"] = *req.OriginalTitle
	}
	if req.Duration != nil && *req.Duration > 0 {
		updateData["duration"] = *req.Duration
	}
	if req.ReleaseDate != nil {
		updateData["release_date"] = *req.ReleaseDate
	}
	if req.Rating != nil {
		updateData["rating"] = *req.Rating
	}
	if req.Description != nil {
		updateData["description"] = *req.Description
	}
	if req.PosterURL != nil {
		updateData["poster_url"] = *req.PosterURL
	}
	if req.IsActive != nil {
		updateData["is_active"] = *req.IsActive
	}

	if len(updateData) > 0 {
		if err := tx.Model(&movie).Updates(updateData).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update movie"))
			return
		}
	}

	// Update genres if provided
	if len(req.GenreIDs) > 0 {
		var genres []models.Genre
		if err := tx.Where("id IN ?", req.GenreIDs).Find(&genres).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch genres"))
			return
		}
		if err := tx.Model(&movie).Association("Genres").Replace(&genres); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update genres"))
			return
		}
	}

	// Update cast if provided
	if len(req.CastIDs) > 0 {
		var persons []models.Person
		if err := tx.Where("id IN ?", req.CastIDs).Find(&persons).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch cast"))
			return
		}
		if err := tx.Model(&movie).Association("Cast").Replace(&persons); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update cast"))
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update movie"))
		return
	}

	// Reload movie with associations
	database.DB.Preload("Genres").Preload("Cast").First(&movie, movie.ID)

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie updated successfully", movie))
}

// DeleteMovie - Delete movie (soft delete with association cleanup)
func DeleteMovie(c *gin.Context) {
	movieID := c.Param("id")
	id, err := strconv.Atoi(movieID)
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

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Clear associations before soft delete
	if err := tx.Model(&movie).Association("Genres").Clear(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to clear genre associations"))
		return
	}

	if err := tx.Model(&movie).Association("Cast").Clear(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to clear cast associations"))
		return
	}

	// Soft delete the movie
	if err := tx.Delete(&movie).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete movie"))
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete movie"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie deleted successfully", nil))
}
