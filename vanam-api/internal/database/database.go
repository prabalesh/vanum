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
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("✅ Database migration completed")
}

func SeedData() {
	roles := []models.Role{
		{Name: "admin"},
		{Name: "user"},
		{Name: "moderator"},
	}

	for _, role := range roles {
		var existingRole models.Role
		if err := DB.Where("name = ?", role.Name).First(&existingRole).Error; err == gorm.ErrRecordNotFound {
			DB.Create(&role)
		}
	}

	// Find admin role ID
	var adminRole models.Role
	if err := DB.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		log.Fatalf("❌ Admin role not found: %v", err)
	}

	// Create admin user
	var adminCount int64
	DB.Model(&models.User{}).Where("role_id = ?", adminRole.ID).Count(&adminCount)

	if adminCount == 0 {
		hashedPassword, _ := utils.HashPassword("vanam")
		adminUser := models.User{
			Email:    "admin@vanam.com",
			Password: hashedPassword,
			Name:     "System",
			RoleID:   adminRole.ID,
			IsActive: true,
		}
		DB.Create(&adminUser)
		log.Println("✅ Admin user created - Email: admin@moviebooking.com, Password: admin123")
	}

}
