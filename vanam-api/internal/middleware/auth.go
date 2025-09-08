package middleware

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/database"
	"github.com/prabalesh/vanam/vanam-api/internal/models"
	"github.com/prabalesh/vanam/vanam-api/pkg/redis"
)

// AdminAuthMiddleware - Your existing admin authentication middleware (unchanged)
func AdminAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := extractSessionToken(c)
		if sessionID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin authentication required"})
			c.Abort()
			return
		}

		session, err := validateSession(sessionID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired admin session"})
			c.Abort()
			return
		}

		// Verify admin user
		var user models.User
		if err := database.DB.Preload("Role").First(&user, session.UserID).Error; err != nil {
			deleteSession(sessionID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin user not found"})
			c.Abort()
			return
		}

		if user.Role.Name != "admin" || !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		// Extend admin session
		extendSession(sessionID, session)

		c.Set("admin_id", session.UserID)
		c.Set("session_id", sessionID)
		c.Set("user_role", user.Role)
		c.Next()
	}
}

// UserAuthMiddleware - General user authentication middleware for getUserDetails and other user operations
func UserAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := extractSessionToken(c)
		if sessionID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		session, err := validateSession(sessionID)
		fmt.Println(session)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session"})
			c.Abort()
			return
		}

		// Verify user exists and is active
		var user models.User
		if err := database.DB.Preload("Role").First(&user, session.UserID).Error; err != nil {
			deleteSession(sessionID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		if !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account is inactive"})
			c.Abort()
			return
		}

		// Extend user session (shorter duration for regular users)
		extendUserSession(sessionID, session)

		// Set context for any authenticated user
		c.Set("user_id", session.UserID)
		c.Set("session_id", sessionID)
		c.Set("user_role", user.Role)
		c.Set("user", user) // Full user object available in context
		c.Next()
	}
}

// Helper functions (keeping your existing ones + new one)
func extractSessionToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}

	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return ""
	}

	return tokenParts[1]
}

func validateSession(sessionID string) (*models.Session, error) {
	sessionData, err := redis.Client.Get(redis.Ctx, "session:"+sessionID).Result()
	if err != nil {
		return nil, err
	}

	var session models.Session
	if err := json.Unmarshal([]byte(sessionData), &session); err != nil {
		return nil, err
	}

	if time.Now().After(session.ExpiresAt) {
		redis.Client.Del(redis.Ctx, "session:"+sessionID)
		return nil, errors.New("session expired")
	}

	return &session, nil
}

func extendSession(sessionID string, session *models.Session) {
	session.ExpiresAt = time.Now().Add(24 * time.Hour)
	updatedSessionJSON, _ := json.Marshal(session)
	redis.Client.Set(redis.Ctx, "session:"+sessionID, updatedSessionJSON, 24*time.Hour)
}

// New helper function for regular user session extension (shorter duration)
func extendUserSession(sessionID string, session *models.Session) {
	session.ExpiresAt = time.Now().Add(8 * time.Hour) // Regular users get 8 hours
	updatedSessionJSON, _ := json.Marshal(session)
	redis.Client.Set(redis.Ctx, "session:"+sessionID, updatedSessionJSON, 8*time.Hour)
}

func deleteSession(sessionID string) {
	redis.Client.Del(redis.Ctx, "session:"+sessionID)
}
