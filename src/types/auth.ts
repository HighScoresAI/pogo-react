export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    // Add other fields as needed
}

export interface SignupRequest {
    email: string;
    password: string;
    name: string;
}

export interface SignupResponse {
    message: string;
    // Add other fields as needed
} 