import { ApiClient } from '../lib/api';

export interface ChatMessage {
    id: string;
    message: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    status?: 'sending' | 'sent' | 'delivered' | 'error';
}

export interface ChatSession {
    id: string;
    projectId?: string;
    userId: string;
    title: string;
    status: 'active' | 'inactive';
    createdAt: Date;
}

export interface SendMessageRequest {
    message: string;
    userId: string;
    sessionId?: string;
    projectId?: string;
    chatSessionId?: string;  // For chat session management
}

export interface SendMessageResponse {
    response: string;
    sessionId: string;
}

class ChatService {
    /**
     * Send a message to the chatbot
     */
    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        try {
            console.log('ChatService: Sending message request:', JSON.stringify(request, null, 2));

            // Validate required fields
            if (!request.message || !request.userId) {
                throw new Error(`Missing required fields: message=${!!request.message}, userId=${!!request.userId}`);
            }

            // Use the existing ApiClient methods that match your backend exactly
            if (request.sessionId && request.sessionId !== 'general') {
                console.log('ChatService: Using session-specific endpoint for session:', request.sessionId);

                // If we have both sessionId and projectId, use project-specific endpoint for better context
                if (request.projectId && request.projectId !== 'general') {
                    console.log('ChatService: Using project-specific endpoint for better context');
                    const response = await ApiClient.sendChatMessage(
                        request.projectId,
                        request.message,
                        request.userId,
                        request.sessionId
                    ) as SendMessageResponse;
                    return response;
                } else {
                    // Use session-specific chat endpoint
                    const response = await ApiClient.sendSessionMessage(
                        request.sessionId,
                        request.message,
                        request.userId,
                        request.chatSessionId,
                        request.projectId
                    ) as SendMessageResponse;
                    return response;
                }
            } else if (request.projectId && request.projectId !== 'general') {
                console.log('ChatService: Using project-specific endpoint for project:', request.projectId);
                // Use project-specific chat endpoint
                const response = await ApiClient.sendChatMessage(
                    request.projectId,
                    request.message,
                    request.userId,
                    request.sessionId
                ) as SendMessageResponse;
                return response;
            } else {
                console.log('ChatService: Using general chat endpoint');
                // Use general chat endpoint
                const response = await ApiClient.sendGeneralMessage(
                    request.message,
                    request.userId,
                    request.sessionId
                ) as SendMessageResponse;
                return response;
            }
        } catch (error) {
            console.error('ChatService: Error sending message:', error);
            throw new Error('Failed to send message');
        }
    }

    /**
 * Get chat history for a session
 */
    async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
        try {
            const response = await ApiClient.getChatHistory(sessionId) as any;

            // Transform the response to match our ChatMessage interface
            // Your backend returns: { session: {...}, messages: [...] }
            if (response.messages && Array.isArray(response.messages)) {
                return response.messages.map((msg: any) => ({
                    id: msg._id || msg.id,
                    message: msg.content,
                    sender: msg.role === 'user' ? 'user' : 'bot',
                    timestamp: new Date(msg.timestamp),
                    status: 'sent' as const,
                }));
            }

            return [];
        } catch (error) {
            console.error('Error getting chat history:', error);
            // Don't throw error, just return empty array to avoid breaking the UI
            return [];
        }
    }

    /**
     * Create a new chat session
     * Note: Sessions are created automatically by the backend when sending the first message
     */
    async createSession(userId: string, projectId?: string): Promise<ChatSession> {
        // This method is deprecated - sessions are created automatically by the backend
        console.warn('createSession is deprecated - sessions are created automatically by the backend');
        return {
            id: 'temp',
            projectId: projectId || 'general',
            userId: userId,
            title: projectId ? 'Project Chat' : 'General Chat',
            status: 'active' as const,
            createdAt: new Date(),
        };
    }

    /**
     * Get user's chat sessions
     */
    async getUserSessions(userId: string): Promise<ChatSession[]> {
        try {
            // This endpoint might not exist yet, so we'll return a mock response
            // You can implement this when you add the endpoint to your backend
            const mockSessions: ChatSession[] = [
                {
                    id: 'session_1',
                    projectId: 'general',
                    userId,
                    title: 'General Chat',
                    status: 'active',
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                },
            ];

            return mockSessions;
        } catch (error) {
            console.error('Error getting user sessions:', error);
            return [];
        }
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(sessionId: string, userId: string): Promise<void> {
        try {
            // This endpoint might not exist yet
            // You can implement this when you add the endpoint to your backend
            console.log(`Marking messages as read for session ${sessionId}`);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
}

export const chatService = new ChatService();
export default chatService; 