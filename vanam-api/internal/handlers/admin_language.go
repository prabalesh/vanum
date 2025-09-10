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

// GetAllLanguages - Get all languages (public endpoint)
func GetAllLanguages(c *gin.Context) {
	var languages []models.Language

	// Optional search filter
	query := database.DB.Model(&models.Language{})
	if search := c.Query("search"); search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Order("name ASC").Find(&languages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch languages"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Languages retrieved successfully", languages))
}

// CreateLanguage - Create a new language (admin only)
func CreateLanguage(c *gin.Context) {
	var req dtos.LanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Check if language code already exists
	var existingLanguage models.Language
	if err := database.DB.Where("code = ?", req.Code).First(&existingLanguage).Error; err == nil {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Language code already exists"))
		return
	}

	language := models.Language{
		Code:       req.Code,
		Name:       req.Name,
		NativeName: req.NativeName,
	}

	if err := database.DB.Create(&language).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create language"))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Language created successfully", language))
}

// UpdateLanguage - Update existing language (admin only)
func UpdateLanguage(c *gin.Context) {
	languageID := c.Param("id")
	id, err := strconv.Atoi(languageID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid language ID"))
		return
	}

	var req dtos.LanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	var language models.Language
	if err := database.DB.First(&language, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Language not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Check if updated code conflicts with another language
	var existingLanguage models.Language
	if err := database.DB.Where("code = ? AND id != ?", req.Code, id).First(&existingLanguage).Error; err == nil {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Language code already exists"))
		return
	}

	language.Code = req.Code
	language.Name = req.Name
	language.NativeName = req.NativeName

	if err := database.DB.Save(&language).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update language"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Language updated successfully", language))
}

// DeleteLanguage - Delete language (admin only)
func DeleteLanguage(c *gin.Context) {
	languageID := c.Param("id")
	id, err := strconv.Atoi(languageID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid language ID"))
		return
	}

	var language models.Language
	if err := database.DB.First(&language, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Language not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Check if language is used by any movies or screenings
	var movieLanguageCount, screeningCount int64
	database.DB.Model(&models.MovieLanguage{}).Where("language_id = ?", id).Count(&movieLanguageCount)
	database.DB.Model(&models.Screening{}).Where("language_id = ? OR subtitle_language_id = ?", id, id).Count(&screeningCount)

	if movieLanguageCount > 0 || screeningCount > 0 {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Cannot delete language that is used by movies or screenings"))
		return
	}

	if err := database.DB.Delete(&language).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete language"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Language deleted successfully", nil))
}
