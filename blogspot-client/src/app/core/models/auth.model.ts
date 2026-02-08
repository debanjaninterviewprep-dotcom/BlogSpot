export interface User {
  id: string;
  userName: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
  displayName?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}
