package redis

import (
	"context"
	"log"

	"github.com/go-redis/redis/v8"
	"github.com/prabalesh/vanam/vanam-api/internal/config"
)

var Client *redis.Client
var Ctx = context.Background()

func Connect(cfg *config.Config) {
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatal("Failed to parse Redis URL:", err)
	}

	Client = redis.NewClient(opt)

	// Test connection
	_, err = Client.Ping(Ctx).Result()
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	log.Println("✅ Redis connected successfully")
}

func Close() {
	if Client != nil {
		Client.Close()
	}
}
