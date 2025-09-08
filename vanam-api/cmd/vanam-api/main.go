package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/config"
	"github.com/prabalesh/vanam/vanam-api/internal/database"
	"github.com/prabalesh/vanam/vanam-api/internal/handlers"
	"github.com/prabalesh/vanam/vanam-api/internal/middleware"
	"github.com/prabalesh/vanam/vanam-api/pkg/redis"
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
	redis.Connect(cfg)

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
	public := r.Group("/api/v1")
	{
		public.GET("/languages", handlers.GetLanguages)

		// Movies
		public.GET("/movies", handlers.GetAllMovies)
		public.GET("/movies/:id", handlers.GetMovieByID)

		// Screenings
		public.GET("/screenings", handlers.GetScreenings)
		public.GET("/screenings/:id", handlers.GetScreeningByID)
	}

	adminAPI := r.Group("/api/admin/v1")
	{
		// Admin authentication
		auth := adminAPI.Group("/auth")
		{
			auth.POST("/login", handlers.AdminLogin)
		}

		// All admin routes require authentication and admin role
		adminProtected := adminAPI.Group("/")
		adminProtected.Use(middleware.UserAuthMiddleware())
		{
			adminProtected.GET("/profile", handlers.GetUserDetails)
			adminProtected.POST("/logout", handlers.AdminLogout)

			adminRolesProtected := adminProtected.Group("/roles")
			{
				adminRolesProtected.GET("", handlers.GetAllRoles)
				adminRolesProtected.POST("", handlers.CreateRole)
				adminRolesProtected.GET("/:id", handlers.GetRoleByID)
				adminRolesProtected.PUT("/:id", handlers.UpdateRole)
				adminRolesProtected.DELETE("/:id", handlers.DeleteRole)
				adminRolesProtected.GET("/:id/users", handlers.GetRoleUsers)
			}

			adminUsersProtected := adminProtected.Group("/users")
			{
				adminUsersProtected.GET("", handlers.GetAllUsers)
				adminUsersProtected.POST("/", handlers.CreateUser)
				adminUsersProtected.PUT("/:id", handlers.UpdateUser)
				adminUsersProtected.DELETE("/:id", handlers.DeleteUser)
			}

			adminMoviesProtected := adminProtected.Group("/movies")
			{
				adminMoviesProtected.POST("", handlers.CreateMovie)
				adminMoviesProtected.PUT("/:id", handlers.UpdateMovie)
				adminMoviesProtected.DELETE("/:id", handlers.DeleteMovie)
			}

			adminScreeningsProtected := adminProtected.Group("/screenings")
			{
				adminScreeningsProtected.POST("", handlers.CreateScreening)
				adminScreeningsProtected.PUT("/:id", handlers.UpdateScreening)
				adminScreeningsProtected.DELETE("/:id", handlers.DeleteScreening)
			}

			adminProtected.GET("/dashboard", func(c *gin.Context) {
				c.JSON(200, "success")
			})
		}
	}

	log.Printf("🚀 Movie Booking API server starting on port %s", cfg.Port)
	log.Printf("📍 Environment: %s", cfg.Environment)
	log.Printf("🎬 User App API: http://localhost:%s/api/user/v1", cfg.Port)
	log.Printf("🏢 Admin App API: http://localhost:%s/api/admin/v1", cfg.Port)
	log.Printf("❤️  Health Check: http://localhost:%s/health", cfg.Port)
	log.Fatal(r.Run(":" + cfg.Port))
}
