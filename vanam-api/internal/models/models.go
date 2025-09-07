package models

import (
	"time"

	"gorm.io/gorm"
)

type Role struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"unique;not null"`
}

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Email     string `gorm:"unique;not null"`
	Password  string `gorm:"not null"`
	Name      string `gorm:"not null"`
	RoleID    uint   `gorm:"not null"`
	Role      Role   `gorm:"foreignKey:RoleID"`
	IsActive  bool   `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
