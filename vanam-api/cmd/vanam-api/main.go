package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/prabalesh/vanam/vanam-api/internal/config"
)

func main() {
	cfg := config.Load()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Vanam API is running",
			"version": "1.0.0",
		})
	})

	log.Fatal(r.Run(":" + cfg.Port))
}
