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

type MovieLanguageRequest struct {
	LanguageID     uint   `json:"language_id" binding:"required"`
	Title          string `json:"title" binding:"required"`
	Description    string `json:"description"`
	HasAudio       bool   `json:"has_audio"`
	HasSubtitles   bool   `json:"has_subtitles"`
	AudioFormat    string `json:"audio_format"`
	SubtitleFormat string `json:"subtitle_format"`
}

// AddMovieLanguage - Add language support to a movie
func AddMovieLanguage(c *gin.Context) {
	movieID := c.Param("id")
	id, err := strconv.Atoi(movieID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	var req MovieLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Check if movie exists
	var movie models.Movie
	if err := database.DB.First(&movie, id).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Movie not found"))
		return
	}

	// Check if language exists
	var language models.Language
	if err := database.DB.First(&language, req.LanguageID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Language not found"))
		return
	}

	// Create movie language entry
	movieLanguage := models.MovieLanguage{
		MovieID:        uint(id),
		LanguageID:     req.LanguageID,
		Title:          req.Title,
		Description:    req.Description,
		HasAudio:       req.HasAudio,
		HasSubtitles:   req.HasSubtitles,
		AudioFormat:    req.AudioFormat,
		SubtitleFormat: req.SubtitleFormat,
	}

	if err := database.DB.Create(&movieLanguage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to add language support"))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Language support added successfully", movieLanguage))
}

// GetMovieLanguages - Get all supported languages for a movie
func GetMovieLanguages(c *gin.Context) {
	movieID := c.Param("id")
	id, err := strconv.Atoi(movieID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	var movieLanguages []models.MovieLanguage
	if err := database.DB.Where("movie_id = ?", id).
		Preload("Language").
		Find(&movieLanguages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch movie languages"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie languages retrieved successfully", movieLanguages))
}

// GetMovieByLanguage - Get movie details in specific language
func GetMovieByLanguage(c *gin.Context) {
	movieID := c.Param("id")
	languageCode := c.Query("lang")

	if languageCode == "" {
		languageCode = "en" // Default to English
	}

	id, err := strconv.Atoi(movieID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	var movie models.Movie
	if err := database.DB.Preload("Genres").Preload("Cast").First(&movie, id).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Movie not found"))
		return
	}

	// Get localized content
	var movieLanguage models.MovieLanguage
	err = database.DB.Joins("JOIN languages ON languages.id = movie_languages.language_id").
		Where("movie_languages.movie_id = ? AND languages.code = ?", id, languageCode).
		First(&movieLanguage).Error

	if err == nil {
		// Return localized version
		movie.OriginalTitle = movieLanguage.Title
		movie.Description = movieLanguage.Description
	}
	// If no localization found, return original content

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie retrieved successfully", movie))
}

// UpdateMovieLanguage - Update language support for a movie
func UpdateMovieLanguage(c *gin.Context) {
	movieID := c.Param("id")
	langID := c.Param("langId")

	movieIDInt, err := strconv.Atoi(movieID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	langIDInt, err := strconv.Atoi(langID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid language ID"))
		return
	}

	var req MovieLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Find the existing movie language entry
	var movieLanguage models.MovieLanguage
	if err := database.DB.Where("movie_id = ? AND language_id = ?", movieIDInt, langIDInt).
		First(&movieLanguage).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Movie language not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Update the fields
	updateData := map[string]interface{}{
		"title":           req.Title,
		"description":     req.Description,
		"has_audio":       req.HasAudio,
		"has_subtitles":   req.HasSubtitles,
		"audio_format":    req.AudioFormat,
		"subtitle_format": req.SubtitleFormat,
	}

	if err := database.DB.Model(&movieLanguage).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update movie language"))
		return
	}

	// Reload with language info
	database.DB.Preload("Language").First(&movieLanguage, movieLanguage.ID)

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie language updated successfully", movieLanguage))
}

// RemoveMovieLanguage - Remove language support from a movie
func RemoveMovieLanguage(c *gin.Context) {
	movieID := c.Param("id")
	langID := c.Param("langId")

	movieIDInt, err := strconv.Atoi(movieID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid movie ID"))
		return
	}

	langIDInt, err := strconv.Atoi(langID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid language ID"))
		return
	}

	// Find the movie language entry
	var movieLanguage models.MovieLanguage
	if err := database.DB.Where("movie_id = ? AND language_id = ?", movieIDInt, langIDInt).
		First(&movieLanguage).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Movie language not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Delete the movie language entry
	if err := database.DB.Delete(&movieLanguage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to remove movie language"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Movie language removed successfully", nil))
}
