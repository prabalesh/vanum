package dtos

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	RoleID   uint   `json:"role_id" binding:"required"`
}

type UpdateUserRequest struct {
	Name     string `json:"name,omitempty" binding:"omitempty,min=2,max=100"`
	Email    string `json:"email,omitempty" binding:"omitempty,email"`
	Password string `json:"password,omitempty" binding:"omitempty,min=8"`
	RoleID   uint   `json:"role_id,omitempty"`
	IsActive *bool  `json:"is_active,omitempty"`
}
