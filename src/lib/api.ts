const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.hellopogo.com/';

// Utility function to get the base URL for any remaining hardcoded URLs
export const getApiBaseUrl = () => API_BASE_URL;

export class ApiClient {
  private static getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const extensionToken = typeof window !== 'undefined' ? localStorage.getItem('extensionToken') : null;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (extensionToken) {
      headers['Extension-Token'] = extensionToken;
    }

    return headers;
  }

  private static async handleWithRefresh<T>(fn: () => Promise<Response>): Promise<T> {
    let response = await fn();
    if (response.status === 401) {
      // Try to refresh token
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refreshToken) {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
          const { access_token } = await refreshRes.json();
          if (access_token) {
            localStorage.setItem('access_token', access_token);
            // Retry original request with new token
            response = await fn();
          }
        } else {
          // Refresh failed, clear tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        // No refresh token, clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Session expired. Please log in again.');
      }
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.handleWithRefresh<T>(() => fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.getAuthHeaders(),
    }));
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    return this.handleWithRefresh<T>(() => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    }));
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    return this.handleWithRefresh<T>(() => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    }));
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.handleWithRefresh<T>(() => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    }));
  }

  static async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const extensionToken = typeof window !== 'undefined' ? localStorage.getItem('extensionToken') : null;
    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (extensionToken) {
      headers['Extension-Token'] = extensionToken;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async getUserProfile() {
    return this.get('/users/user');
  }

  // Chat API methods
  static async sendChatMessage(projectId: string, message: string, userId: string, sessionId?: string) {
    return this.post(`/api/chat/${projectId}/message`, {
      message,
      userId,
      sessionId
    });
  }

  static async sendGeneralMessage(message: string, userId: string, sessionId?: string) {
    return this.post(`/api/chat/message`, {
      message,
      userId,
      sessionId
    });
  }

  static async getChatHistory(sessionId: string) {
    return this.get(`/chat/history/${sessionId}`);
  }

  // User management methods
  static async getUserByEmail(email: string) {
    return this.get(`/users/email/${encodeURIComponent(email)}`);
  }

  // Project management methods
  static async getProjectById(projectId: string) {
    return this.get(`/projects/${projectId}`);
  }

  static async addProjectMember(projectId: string, userId: string, role: string) {
    return this.post(`/projects/${projectId}/members`, { userId, role });
  }

  static async inviteProjectMember(projectId: string, email: string, role: string) {
    return this.post(`/projects/${projectId}/invite`, { email, role });
  }

  // Artifact methods
  static async createDocumentArtifact(data: any) {
    return this.post('/artifacts', data);
  }

  // Organization methods
  static async createOrganization(data: any) {
    return this.post('/organizations', data);
  }

  static async getOrganizations() {
    return this.get('/organizations');
  }

  static async updateOrganization(orgId: string, data: any) {
    return this.put(`/organizations/${orgId}`, data);
  }

  static async deleteOrganization(orgId: string) {
    return this.delete(`/organizations/${orgId}`);
  }

  // Session methods
  static async createSession(data: any) {
    return this.post('/sessions', data);
  }

  static async updateSession(sessionId: string, data: any) {
    return this.put(`/sessions/${sessionId}`, data);
  }

  static async deleteSession(sessionId: string) {
    return this.delete(`/sessions/${sessionId}`);
  }

  // Documentation methods
  static async getDocumentation(artifactId: string) {
    return this.get(`/api/documentation/${artifactId}`);
  }

  static async generateDocumentation(sessionId: string) {
    return this.post(`/api/documentation/${sessionId}/generate`, {});
  }

  static async updateDocumentation(documentationId: string, content: string) {
    return this.put(`/api/documentation/${documentationId}`, { content });
  }

  static async updateDocumentationStatus(documentationId: string, status: string) {
    return this.put(`/api/documentation/${documentationId}/status`, { status });
  }

  // Activity log methods
  static async getSessionLogs(sessionId: string, limit: number = 50) {
    return this.get(`/api/activity-logs/session/${sessionId}?limit=${limit}`);
  }

  static async getArtifactLogs(artifactId: string, limit: number = 50) {
    return this.get(`/api/activity-logs/artifact/${artifactId}?limit=${limit}`);
  }

  static async getProjectLogs(projectId: string, limit: number = 50) {
    return this.get(`/api/activity-logs/project/${projectId}?limit=${limit}`);
  }

  static async getUserLogs(userId: string, limit: number = 50) {
    return this.get(`/api/activity-logs/user/${userId}?limit=${limit}`);
  }

  static async logActivity(data: {
    activity_type: string;
    description: string;
    session_id?: string;
    artifact_id?: string;
    project_id?: string;
    metadata?: any;
  }) {
    return this.post('/api/activity-logs/log', data);
  }

  // Blog methods
  static async getBlogPosts(): Promise<{ blog_posts: any[] }> {
    return this.get('/api/blog/posts');
  }

  static async getBlogPost(blogId: string): Promise<any> {
    return this.get(`/api/blog/posts/${blogId}`);
  }

  static async getBlogPostsBySession(sessionId: string): Promise<{ blog_posts: any[] }> {
    return this.get(`/api/blog/posts/session/${sessionId}`);
  }

  static async createBlogPost(sessionId: string, customTitle?: string, customTags?: string[]): Promise<any> {
    return this.post('/api/blog/posts', {
      session_id: sessionId,
      custom_title: customTitle,
      custom_tags: customTags
    });
  }

  static async updateBlogPost(blogId: string, updateData: any): Promise<any> {
    return this.put(`/api/blog/posts/${blogId}`, updateData);
  }

  static async deleteBlogPost(blogId: string): Promise<any> {
    return this.delete(`/api/blog/posts/${blogId}`);
  }

  static async downloadBlogWordDoc(blogId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/blog/posts/${blogId}/download`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    return await response.blob();
  }

  static async regenerateBlogPost(blogId: string): Promise<any> {
    return this.post(`/api/blog/posts/${blogId}/regenerate`, {});
  }

  static async getSessions(): Promise<{ sessions: any[] }> {
    return this.get('/sessions');
  }
} 