package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/database"
	"github.com/prabalesh/vanam/vanam-api/internal/dtos"
	"github.com/prabalesh/vanam/vanam-api/internal/models"
	"github.com/prabalesh/vanam/vanam-api/internal/utils"
	"github.com/prabalesh/vanam/vanam-api/pkg/redis"
	"gorm.io/gorm"
)

// CreateUser - Create a new user (admin only)
func CreateUser(c *gin.Context) {
	var req dtos.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Check if email already exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, utils.ErrorResponse("User with this email already exists"))
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to hash password"))
		return
	}

	// Get role
	var role models.Role
	if err := database.DB.Where("id = ?", req.RoleID).First(&role).Error; err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid role"))
		return
	}

	// Create user
	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
		RoleID:   req.RoleID,
		IsActive: true,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create user"))
		return
	}

	// Load role for response
	database.DB.Preload("Role").First(&user, user.ID)

	c.JSON(http.StatusCreated, utils.SuccessResponse("User created successfully", gin.H{
		"user": gin.H{
			"id":         user.ID,
			"name":       user.Name,
			"email":      user.Email,
			"role":       user.Role,
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
		},
	}))
}

// UpdateUser - Update user details
func UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	id, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid user ID"))
		return
	}

	var req dtos.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Find user
	var user models.User
	if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("User not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Update fields if provided
	updateData := make(map[string]interface{})

	if req.Name != "" {
		updateData["name"] = req.Name
	}

	if req.Email != "" {
		// Check if email already exists for another user
		var existingUser models.User
		if err := database.DB.Where("email = ? AND id != ?", req.Email, id).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, utils.ErrorResponse("Email already exists"))
			return
		}
		updateData["email"] = req.Email
	}

	if req.Password != "" {
		hashedPassword, err := utils.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to hash password"))
			return
		}
		updateData["password"] = hashedPassword
	}

	if req.RoleID != 0 {
		// Verify role exists
		var role models.Role
		if err := database.DB.Where("id = ?", req.RoleID).First(&role).Error; err != nil {
			c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid role"))
			return
		}
		updateData["role_id"] = req.RoleID
	}

	if req.IsActive != nil {
		updateData["is_active"] = *req.IsActive
	}

	// Update user
	if err := database.DB.Model(&user).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update user"))
		return
	}

	// Reload user with role
	database.DB.Preload("Role").First(&user, user.ID)

	c.JSON(http.StatusOK, utils.SuccessResponse("User updated successfully", gin.H{
		"user": gin.H{
			"id":         user.ID,
			"name":       user.Name,
			"email":      user.Email,
			"role":       user.Role,
			"is_active":  user.IsActive,
			"updated_at": user.UpdatedAt,
		},
	}))
}

// DeleteUser - Delete user (soft delete)
func DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	id, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid user ID"))
		return
	}

	// Find user
	var user models.User
	if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("User not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Prevent self-deletion for logged-in user
	currentUserID, exists := c.Get("user_id")
	if exists && currentUserID == uint(id) {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Cannot delete your own account"))
		return
	}

	// Soft delete user
	if err := database.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete user"))
		return
	}

	// Invalidate all sessions for this user
	keys, err := redis.Client.Keys(redis.Ctx, "session:*").Result()
	if err == nil {
		for _, key := range keys {
			sessionData, err := redis.Client.Get(redis.Ctx, key).Result()
			if err == nil {
				var session models.Session
				if json.Unmarshal([]byte(sessionData), &session) == nil && session.UserID == uint(id) {
					redis.Client.Del(redis.Ctx, key)
				}
			}
		}
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("User deleted successfully", nil))
}

// GetUserDetails - Get current logged-in user details
func GetUserDetails(c *gin.Context) {
	// Get user ID from middleware (assuming you have auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		fmt.Println("This is where i reached")
		fmt.Println(userID)
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse("User not authenticated"))
		return
	}

	var user models.User
	if err := database.DB.Preload("Role").Where("id = ? AND is_active = ?", userID, true).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("User not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("User details retrieved successfully", gin.H{
		"user": gin.H{
			"id":         user.ID,
			"name":       user.Name,
			"email":      user.Email,
			"role":       user.Role,
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		},
	}))
}

// GetAllUsers - Get all users (admin only)
func GetAllUsers(c *gin.Context) {
	var users []models.User
	query := database.DB.Preload("Role")

	// Add pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Add search filter
	search := c.Query("search")
	if search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Add role filter
	roleID := c.Query("role_id")
	if roleID != "" {
		query = query.Where("role_id = ?", roleID)
	}

	// Add active filter
	isActive := c.Query("is_active")
	if isActive != "" {
		query = query.Where("is_active = ?", isActive == "true")
	}

	// Get total count
	var total int64
	query.Model(&models.User{}).Count(&total)

	// Get users with pagination
	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch users"))
		return
	}

	// Format response
	var userList []gin.H
	for _, user := range users {
		userList = append(userList, gin.H{
			"id":         user.ID,
			"name":       user.Name,
			"email":      user.Email,
			"role":       user.Role,
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, utils.PaginationResponse("Users retrieved successfully", userList, page, limit, total))
}
