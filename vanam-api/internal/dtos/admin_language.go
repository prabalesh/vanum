package dtos

type LanguageRequest struct {
	Code       string `json:"code" binding:"required,min=2,max=5"`
	Name       string `json:"name" binding:"required,min=1,max=100"`
	NativeName string `json:"native_name"`
}
