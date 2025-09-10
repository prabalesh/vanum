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

	// Public API routes
	public := r.Group("/api/v1")
	{
		// Theater routes (public)
		theaterPublic := public.Group("/theaters")
		{
			theaterPublic.GET("", handlers.GetTheaters)                     // GET /api/v1/theaters
			theaterPublic.GET("/:id", handlers.GetTheaterByID)              // GET /api/v1/theaters/:id
			theaterPublic.GET("/:id/screens", handlers.GetScreensByTheater) // GET /api/v1/theaters/:id/screens
		}

		// Screen routes (public)
		screenPublic := public.Group("/screens")
		{
			screenPublic.GET("", handlers.GetAllScreens)     // GET /api/v1/screens
			screenPublic.GET("/:id", handlers.GetScreenByID) // GET /api/v1/screens/:id
		}

		// Language routes
		public.GET("/languages", handlers.GetLanguages)

		// Genre routes
		public.GET("/genres", handlers.GetAllGenres)

		// Movie routes
		moviePublic := public.Group("/movies")
		{
			moviePublic.GET("", handlers.GetAllMovies)
			moviePublic.GET("/:id", handlers.GetMovieByID)
		}

		// Screening routes
		screeningPublic := public.Group("/screenings")
		{
			screeningPublic.GET("", handlers.GetScreenings)
			screeningPublic.GET("/:id", handlers.GetScreeningByID)
		}
	}

	// Admin API routes
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
			// Profile and logout
			adminProtected.GET("/profile", handlers.GetUserDetails)
			adminProtected.POST("/logout", handlers.AdminLogout)

			// Role management
			adminRolesProtected := adminProtected.Group("/roles")
			{
				adminRolesProtected.GET("", handlers.GetAllRoles)
				adminRolesProtected.POST("", handlers.CreateRole)
				adminRolesProtected.GET("/:id", handlers.GetRoleByID)
				adminRolesProtected.PUT("/:id", handlers.UpdateRole)
				adminRolesProtected.DELETE("/:id", handlers.DeleteRole)
				adminRolesProtected.GET("/:id/users", handlers.GetRoleUsers)
			}

			// User management
			adminUsersProtected := adminProtected.Group("/users")
			{
				adminUsersProtected.GET("", handlers.GetAllUsers)
				adminUsersProtected.POST("/", handlers.CreateUser)
				adminUsersProtected.PUT("/:id", handlers.UpdateUser)
				adminUsersProtected.DELETE("/:id", handlers.DeleteUser)
			}

			// Genre management
			genreGroup := adminProtected.Group("/genres")
			{
				genreGroup.POST("", handlers.CreateGenre)
				genreGroup.PUT("/:id", handlers.UpdateGenre)
				genreGroup.DELETE("/:id", handlers.DeleteGenre)
			}

			// Language management
			languageGroup := adminProtected.Group("/languages")
			{
				languageGroup.POST("", handlers.CreateLanguage)
				languageGroup.PUT("/:id", handlers.UpdateLanguage)
				languageGroup.DELETE("/:id", handlers.DeleteLanguage)
			}

			// Movie management
			adminMoviesProtected := adminProtected.Group("/movies")
			{
				adminMoviesProtected.POST("", handlers.CreateMovie)
				adminMoviesProtected.PUT("/:id", handlers.UpdateMovie)
				adminMoviesProtected.DELETE("/:id", handlers.DeleteMovie)
				adminMoviesProtected.GET("/:id/languages", handlers.GetMovieLanguages)
				adminMoviesProtected.POST("/:id/languages", handlers.AddMovieLanguage)
				adminMoviesProtected.PUT("/:id/languages/:langId", handlers.UpdateMovieLanguage)
				adminMoviesProtected.DELETE("/:id/languages/:langId", handlers.RemoveMovieLanguage)
				adminMoviesProtected.GET("/:id", handlers.GetMovieByID) // Supports ?lang=hi parameter
			}

			// Theater management (admin)
			theaterAdmin := adminProtected.Group("/theaters")
			{
				theaterAdmin.POST("", handlers.CreateTheater)                   // POST /api/admin/v1/theaters
				theaterAdmin.PUT("/:id", handlers.UpdateTheater)                // PUT /api/admin/v1/theaters/:id
				theaterAdmin.DELETE("/:id", handlers.DeleteTheater)             // DELETE /api/admin/v1/theaters/:id
				theaterAdmin.PATCH("/:id/toggle", handlers.ToggleTheaterStatus) // PATCH /api/admin/v1/theaters/:id/toggle

				// Screen management within theaters
				theaterAdmin.GET("/:id/screens", handlers.GetScreensByTheater) // GET /api/admin/v1/theaters/:id/screens
				theaterAdmin.POST("/:id/screens", handlers.CreateScreen)       // POST /api/admin/v1/theaters/:id/screens
			}

			// Screen management (admin)
			screenAdmin := adminProtected.Group("/screens")
			{
				screenAdmin.GET("", handlers.GetAllScreens)       // GET /api/admin/v1/screens
				screenAdmin.GET("/:id", handlers.GetScreenByID)   // GET /api/admin/v1/screens/:id
				screenAdmin.PUT("/:id", handlers.UpdateScreen)    // PUT /api/admin/v1/screens/:id
				screenAdmin.DELETE("/:id", handlers.DeleteScreen) // DELETE /api/admin/v1/screens/:id
			}

			// Screening management
			adminScreeningsProtected := adminProtected.Group("/screenings")
			{
				adminScreeningsProtected.POST("", handlers.CreateScreening)
				adminScreeningsProtected.PUT("/:id", handlers.UpdateScreening)
				adminScreeningsProtected.DELETE("/:id", handlers.DeleteScreening)
			}

			// Dashboard
			adminProtected.GET("/dashboard", func(c *gin.Context) {
				c.JSON(200, "success")
			})
		}
	}

	log.Printf("🚀 Movie Booking API server starting on port %s", cfg.Port)
	log.Printf("📍 Environment: %s", cfg.Environment)
	log.Printf("🎬 Public API: http://localhost:%s/api/v1", cfg.Port)
	log.Printf("🏢 Admin API: http://localhost:%s/api/admin/v1", cfg.Port)
	log.Printf("❤️  Health Check: http://localhost:%s/health", cfg.Port)
	log.Fatal(r.Run(":" + cfg.Port))
}
