package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/database"
	"github.com/prabalesh/vanam/vanam-api/internal/dtos"
	"github.com/prabalesh/vanam/vanam-api/internal/models"
	"github.com/prabalesh/vanam/vanam-api/internal/utils"
	"github.com/prabalesh/vanam/vanam-api/pkg/redis"
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

	// Create admin session
	session := models.Session{
		SessionID: utils.GenerateSecureToken(),
		UserID:    user.ID,
		RoleID:    user.RoleID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(8 * time.Hour),
		IPAddress: c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
	}

	sessionJSON, _ := json.Marshal(session)
	if err := redis.Client.Set(redis.Ctx, "session:"+session.SessionID, sessionJSON, 8*time.Hour).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create admin session"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Admin login successful", gin.H{
		"token": session.SessionID,
		"admin": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
			"role":  user.Role,
		},
	}))
}

func AdminLogout(c *gin.Context) {
	// Get session token from header or cookie
	token := c.GetHeader("Authorization")
	if token == "" {
		token = c.GetHeader("X-Session-Token")
	}

	if token == "" {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Session token required"))
		return
	}

	// Remove session from Redis
	if err := redis.Client.Del(redis.Ctx, "session:"+token).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to logout"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Logout successful", nil))
}
