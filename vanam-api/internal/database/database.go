package database

import (
	"fmt"
	"log"

	"github.com/prabalesh/vanam/vanam-api/internal/config"
	"github.com/prabalesh/vanam/vanam-api/internal/models"
	"github.com/prabalesh/vanam/vanam-api/internal/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg *config.Config) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("✅ Database connected successfully")

	// Configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("Failed to get database instance:", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)
}

func Migrate() {
	err := DB.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.Genre{},  // Add Genre
		&models.Person{}, // Add Person
		&models.Language{},
		&models.Movie{},
		&models.MovieLanguage{},
		&models.Screen{},
		&models.Screening{},
		&models.Theater{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("✅ Database migration completed")
}

func SeedData() {
	// Start transaction
	tx := DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Seed Roles
	seedRoles(tx)

	// Seed Genres
	seedGenres(tx)

	// Seed Languages
	seedLanguages(tx)

	// Seed Sample Persons (Actors/Directors)
	seedPersons(tx)

	// Seed Admin User
	seedAdminUser(tx)

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Fatal("Failed to seed database:", err)
	}

	log.Println("✅ Database seeding completed successfully")
}

func seedRoles(tx *gorm.DB) {
	roles := []models.Role{
		{Name: "admin"},
		{Name: "user"},
		{Name: "moderator"},
	}

	for _, role := range roles {
		var existingRole models.Role
		if err := tx.Where("name = ?", role.Name).First(&existingRole).Error; err == gorm.ErrRecordNotFound {
			if err := tx.Create(&role).Error; err != nil {
				log.Printf("Failed to create role %s: %v", role.Name, err)
			} else {
				log.Printf("✅ Created role: %s", role.Name)
			}
		}
	}
}

func seedGenres(tx *gorm.DB) {
	genres := []models.Genre{
		{Name: "Action"},
		{Name: "Adventure"},
		{Name: "Animation"},
		{Name: "Biography"},
		{Name: "Comedy"},
		{Name: "Crime"},
		{Name: "Documentary"},
		{Name: "Drama"},
		{Name: "Family"},
		{Name: "Fantasy"},
		{Name: "History"},
		{Name: "Horror"},
		{Name: "Music"},
		{Name: "Mystery"},
		{Name: "Romance"},
		{Name: "Sci-Fi"},
		{Name: "Sport"},
		{Name: "Thriller"},
		{Name: "War"},
		{Name: "Western"},
	}

	var genreCount int64
	tx.Model(&models.Genre{}).Count(&genreCount)

	if genreCount == 0 {
		if err := tx.Create(&genres).Error; err != nil {
			log.Printf("Failed to seed genres: %v", err)
		} else {
			log.Printf("✅ Seeded %d genres", len(genres))
		}
	} else {
		log.Printf("✅ Genres already exist (%d records)", genreCount)
	}
}

func seedLanguages(tx *gorm.DB) {
	languages := []models.Language{
		{Code: "en", Name: "English", NativeName: "English"},
		{Code: "hi", Name: "Hindi", NativeName: "हिन्दी"},
		{Code: "ta", Name: "Tamil", NativeName: "தமிழ்"},
		{Code: "te", Name: "Telugu", NativeName: "తెలుగు"},
		{Code: "kn", Name: "Kannada", NativeName: "ಕನ್ನಡ"},
		{Code: "ml", Name: "Malayalam", NativeName: "മലയാളം"},
		{Code: "mr", Name: "Marathi", NativeName: "मराठी"},
		{Code: "bn", Name: "Bengali", NativeName: "বাংলা"},
		{Code: "gu", Name: "Gujarati", NativeName: "ગુજરાતી"},
		{Code: "pa", Name: "Punjabi", NativeName: "ਪੰਜਾਬੀ"},
		{Code: "or", Name: "Odia", NativeName: "ଓଡ଼ିଆ"},
		{Code: "as", Name: "Assamese", NativeName: "অসমীয়া"},
		{Code: "es", Name: "Spanish", NativeName: "Español"},
		{Code: "fr", Name: "French", NativeName: "Français"},
		{Code: "de", Name: "German", NativeName: "Deutsch"},
		{Code: "ja", Name: "Japanese", NativeName: "日本語"},
		{Code: "ko", Name: "Korean", NativeName: "한국어"},
		{Code: "zh", Name: "Chinese", NativeName: "中文"},
	}

	for _, language := range languages {
		var existingLang models.Language
		if err := tx.Where("code = ?", language.Code).First(&existingLang).Error; err == gorm.ErrRecordNotFound {
			if err := tx.Create(&language).Error; err != nil {
				log.Printf("Failed to create language %s: %v", language.Name, err)
			}
		}
	}

	log.Printf("✅ Languages seeded successfully")
}

func seedPersons(tx *gorm.DB) {
	persons := []models.Person{
		{Name: "Christopher Nolan", Bio: "British-American filmmaker known for his complex narratives"},
		{Name: "Leonardo DiCaprio", Bio: "American actor and film producer"},
		{Name: "Morgan Freeman", Bio: "American actor and film narrator"},
		{Name: "Scarlett Johansson", Bio: "American actress and singer"},
		{Name: "Robert Downey Jr.", Bio: "American actor and producer"},
		{Name: "Natalie Portman", Bio: "Israeli-born American actress and filmmaker"},
		{Name: "Brad Pitt", Bio: "American actor and film producer"},
		{Name: "Meryl Streep", Bio: "American actress"},
		{Name: "Tom Hanks", Bio: "American actor and filmmaker"},
		{Name: "Jennifer Lawrence", Bio: "American actress"},
		// Indian Cinema
		{Name: "Shah Rukh Khan", Bio: "Indian actor and film producer, King of Bollywood"},
		{Name: "Amitabh Bachchan", Bio: "Indian actor, film producer, television host"},
		{Name: "Aamir Khan", Bio: "Indian actor, director, filmmaker, and television talk show host"},
		{Name: "Deepika Padukone", Bio: "Indian actress who works in Hindi films"},
		{Name: "Priyanka Chopra", Bio: "Indian actress, singer, and film producer"},
		{Name: "Rajinikanth", Bio: "Indian actor who works primarily in Tamil cinema"},
		{Name: "Kamal Haasan", Bio: "Indian actor, filmmaker, screenwriter, playback singer"},
		{Name: "Mammootty", Bio: "Indian actor and film producer who works in Malayalam cinema"},
	}

	var personCount int64
	tx.Model(&models.Person{}).Count(&personCount)

	if personCount == 0 {
		if err := tx.Create(&persons).Error; err != nil {
			log.Printf("Failed to seed persons: %v", err)
		} else {
			log.Printf("✅ Seeded %d persons", len(persons))
		}
	} else {
		log.Printf("✅ Persons already exist (%d records)", personCount)
	}
}

func seedAdminUser(tx *gorm.DB) {
	// Find admin role ID
	var adminRole models.Role
	if err := tx.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		log.Fatalf("❌ Admin role not found: %v", err)
	}

	// Check if admin user exists
	var adminCount int64
	tx.Model(&models.User{}).Where("role_id = ?", adminRole.ID).Count(&adminCount)

	if adminCount == 0 {
		hashedPassword, err := utils.HashPassword("vanam")
		if err != nil {
			log.Printf("Failed to hash password: %v", err)
			return
		}

		adminUser := models.User{
			Email:    "admin@vanam.com",
			Password: hashedPassword,
			Name:     "System Administrator",
			RoleID:   adminRole.ID,
			IsActive: true,
		}

		if err := tx.Create(&adminUser).Error; err != nil {
			log.Printf("Failed to create admin user: %v", err)
		} else {
			log.Println("✅ Admin user created - Email: admin@vanam.com, Password: vanam")
		}
	} else {
		log.Println("✅ Admin user already exists")
	}
}
