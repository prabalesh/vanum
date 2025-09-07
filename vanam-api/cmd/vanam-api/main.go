package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/config"
	"github.com/prabalesh/vanam/vanam-api/internal/database"
	"github.com/prabalesh/vanam/vanam-api/internal/handlers"
	"github.com/prabalesh/vanam/vanam-api/internal/middleware"
)

func main() {
	cfg := config.Load()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// database setup
	database.Connect(cfg)
	database.Migrate()
	database.SeedData()

	r := gin.Default()

	// middlewares
	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Vanam API is running",
			"version": "1.0.0",
		})
	})

	adminAPI := r.Group("/api/admin/v1")
	{
		// Admin authentication
		auth := adminAPI.Group("/auth")
		{
			auth.POST("/login", handlers.AdminLogin)
		}
	}

	log.Printf("🚀 Movie Booking API server starting on port %s", cfg.Port)
	log.Printf("📍 Environment: %s", cfg.Environment)
	log.Printf("🎬 User App API: http://localhost:%s/api/user/v1", cfg.Port)
	log.Printf("🏢 Admin App API: http://localhost:%s/api/admin/v1", cfg.Port)
	log.Printf("❤️  Health Check: http://localhost:%s/health", cfg.Port)
	log.Fatal(r.Run(":" + cfg.Port))
}
