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

// CreateRole - Create a new role (admin only)
func CreateRole(c *gin.Context) {
	var req dtos.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Check if role name already exists
	var existingRole models.Role
	if err := database.DB.Where("name = ?", req.Name).First(&existingRole).Error; err == nil {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Role with this name already exists"))
		return
	}

	// Create role
	role := models.Role{
		Name: req.Name,
	}

	if err := database.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to create role"))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Role created successfully", gin.H{
		"role": gin.H{
			"id":   role.ID,
			"name": role.Name,
		},
	}))
}

// GetAllRoles - Get all roles
func GetAllRoles(c *gin.Context) {
	var roles []models.Role

	// Add pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Add search filter
	search := c.Query("search")
	query := database.DB.Model(&models.Role{})

	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get roles with pagination
	if err := query.Offset(offset).Limit(limit).Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch roles"))
		return
	}

	// Format response
	var roleList []gin.H
	for _, role := range roles {
		roleList = append(roleList, gin.H{
			"id":   role.ID,
			"name": role.Name,
		})
	}

	c.JSON(http.StatusOK, utils.PaginationResponse("Roles retrieved successfully", roleList, page, limit, total))
}

// GetRoleByID - Get role by ID
func GetRoleByID(c *gin.Context) {
	roleID := c.Param("id")
	id, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid role ID"))
		return
	}

	var role models.Role
	if err := database.DB.Where("id = ?", id).First(&role).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Role not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Role retrieved successfully", gin.H{
		"role": gin.H{
			"id":   role.ID,
			"name": role.Name,
		},
	}))
}

// UpdateRole - Update role details
func UpdateRole(c *gin.Context) {
	roleID := c.Param("id")
	id, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid role ID"))
		return
	}

	var req dtos.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Find role
	var role models.Role
	if err := database.DB.Where("id = ?", id).First(&role).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Role not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Check if new name already exists (for another role)
	if req.Name != "" && req.Name != role.Name {
		var existingRole models.Role
		if err := database.DB.Where("name = ? AND id != ?", req.Name, id).First(&existingRole).Error; err == nil {
			c.JSON(http.StatusConflict, utils.ErrorResponse("Role name already exists"))
			return
		}
		role.Name = req.Name
	}

	// Update role
	if err := database.DB.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to update role"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Role updated successfully", gin.H{
		"role": gin.H{
			"id":   role.ID,
			"name": role.Name,
		},
	}))
}

// DeleteRole - Delete role
func DeleteRole(c *gin.Context) {
	roleID := c.Param("id")
	id, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid role ID"))
		return
	}

	// Find role
	var role models.Role
	if err := database.DB.Where("id = ?", id).First(&role).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Role not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Check if role is being used by any users
	var userCount int64
	if err := database.DB.Model(&models.User{}).Where("role_id = ?", id).Count(&userCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	if userCount > 0 {
		c.JSON(http.StatusConflict, utils.ErrorResponse("Cannot delete role: it is assigned to users"))
		return
	}

	// Prevent deletion of critical roles
	criticalRoles := []string{"admin", "user", "superadmin"}
	for _, criticalRole := range criticalRoles {
		if role.Name == criticalRole {
			c.JSON(http.StatusForbidden, utils.ErrorResponse("Cannot delete system role: "+role.Name))
			return
		}
	}

	// Delete role
	if err := database.DB.Delete(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Failed to delete role"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Role deleted successfully", nil))
}

// GetRoleUsers - Get all users with a specific role
func GetRoleUsers(c *gin.Context) {
	roleID := c.Param("id")
	id, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid role ID"))
		return
	}

	// Check if role exists
	var role models.Role
	if err := database.DB.Where("id = ?", id).First(&role).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, utils.ErrorResponse("Role not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse("Database error"))
		return
	}

	// Get users with pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var users []models.User
	var total int64

	// Count total users for this role
	database.DB.Model(&models.User{}).Where("role_id = ?", id).Count(&total)

	// Get users
	if err := database.DB.Where("role_id = ?", id).Offset(offset).Limit(limit).Find(&users).Error; err != nil {
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
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Role users retrieved successfully", gin.H{
		"role":  gin.H{"id": role.ID, "name": role.Name},
		"users": userList,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	}))
}
