import api from './api'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

const login = (data: LoginData) => {
  return api.post('/auth/login', data)
}

const register = (data: RegisterData) => {
  return api.post('/auth/register', data)
}

const getMe = () => {
  return api.get('/auth/me')
}

const logout = () => {
  return api.post('/auth/logout')
}

const changePassword = (data: ChangePasswordData) => {
  return api.put('/users/change-password', data)
}

const updateProfile = (data: FormData) => {
  return api.put('/users/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const authService = {
  login,
  register,
  getMe,
  logout,
  changePassword,
  updateProfile
}