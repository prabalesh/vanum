package dtos

type TheaterRequest struct {
	Name     string `json:"name" binding:"required"`
	Address  string `json:"address"`
	City     string `json:"city"`
	State    string `json:"state"`
	IsActive *bool  `json:"is_active"` // Pointer to allow null values
}
