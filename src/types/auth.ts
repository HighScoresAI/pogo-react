export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    // Add other fields as needed
}

export interface SignupRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    acceptTerms: boolean;
}

export interface SignupResponse {
    message: string;
    email: string;
    userId: string;
    access_token?: string;
    refresh_token?: string;
} 