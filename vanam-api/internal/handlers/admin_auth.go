package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/database"
	"github.com/prabalesh/vanam/vanam-api/internal/dtos"
	"github.com/prabalesh/vanam/vanam-api/internal/models"
	"github.com/prabalesh/vanam/vanam-api/internal/utils"
)

func AdminLogin(c *gin.Context) {
	var req dtos.AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// find admin role
	var adminRole models.Role
	if err := database.DB.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		log.Fatalf("❌ Admin role not found: %v", err)
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Invalid admin credentials"))
		return
	}

	// find admin user
	var user models.User
	if err := database.DB.Preload("Role").Where("email = ? AND role_id = ? AND is_active = ?", req.Email, adminRole.ID, true).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Invalid admin credentials"))
		return
	}

	// Check password
	if !utils.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("Invalid admin credentials"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Admin login successful", gin.H{
		"token": "bruhh",
		"admin": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
			"role":  user.Role,
		},
	}))
}
