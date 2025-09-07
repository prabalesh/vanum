package database

import (
	"fmt"
	"log"

	"github.com/prabalesh/vanam/vanam-api/internal/config"
	"github.com/prabalesh/vanam/vanam-api/internal/models"
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
