import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils/test-utils';
import { ChatbotWidget } from '../ChatbotWidget';
import { mockFetch, createMockChatMessage } from '@/test-utils/test-utils';

// Mock the chat service
jest.mock('@/services/chatService', () => ({
    sendMessage: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
}));

describe('ChatbotWidget', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock fetch for API calls
        mockFetch({ success: true });
    });

    describe('Initial Rendering', () => {
        it('renders the chat widget button initially', () => {
            render(<ChatbotWidget />);

            const chatButton = screen.getByRole('button', { name: /chat/i });
            expect(chatButton).toBeInTheDocument();
        });

        it('does not render chat interface initially', () => {
            render(<ChatbotWidget />);

            const chatInterface = screen.queryByTestId('chat-interface');
            expect(chatInterface).not.toBeInTheDocument();
        });

        it('shows correct initial button text', () => {
            render(<ChatbotWidget />);

            const chatButton = screen.getByRole('button', { name: /chat/i });
            expect(chatButton).toHaveTextContent(/chat/i);
        });
    });

    describe('Widget Toggle Functionality', () => {
        it('opens chat interface when button is clicked', async () => {
            render(<ChatbotWidget />);

            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });
        });

        it('closes chat interface when close button is clicked', async () => {
            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Close chat interface
            const closeButton = screen.getByRole('button', { name: /close/i });
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByTestId('chat-interface')).not.toBeInTheDocument();
            });
        });

        it('toggles between open and closed states', async () => {
            render(<ChatbotWidget />);

            const chatButton = screen.getByRole('button', { name: /chat/i });

            // First click - open
            fireEvent.click(chatButton);
            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Second click - close
            fireEvent.click(chatButton);
            await waitFor(() => {
                expect(screen.queryByTestId('chat-interface')).not.toBeInTheDocument();
            });
        });
    });

    describe('Chat Functionality', () => {
        it('allows user to type messages', async () => {
            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Type a message
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            const testMessage = 'Hello, chatbot!';
            fireEvent.change(messageInput, { target: { value: testMessage } });

            expect(messageInput).toHaveValue(testMessage);
        });

        it('sends message when send button is clicked', async () => {
            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Type and send a message
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });
            const testMessage = 'Hello, chatbot!';

            fireEvent.change(messageInput, { target: { value: testMessage } });
            fireEvent.click(sendButton);

            // Verify message is sent
            await waitFor(() => {
                expect(screen.getByText(testMessage)).toBeInTheDocument();
            });
        });

        it('sends message when Enter key is pressed', async () => {
            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Type a message and press Enter
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            const testMessage = 'Hello, chatbot!';

            fireEvent.change(messageInput, { target: { value: testMessage } });
            fireEvent.keyPress(messageInput, { key: 'Enter', code: 'Enter' });

            // Verify message is sent
            await waitFor(() => {
                expect(screen.getByText(testMessage)).toBeInTheDocument();
            });
        });

        it('clears input after sending message', async () => {
            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Type and send a message
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });
            const testMessage = 'Hello, chatbot!';

            fireEvent.change(messageInput, { target: { value: testMessage } });
            fireEvent.click(sendButton);

            // Verify input is cleared
            await waitFor(() => {
                expect(messageInput).toHaveValue('');
            });
        });
    });

    describe('Message Display', () => {
        it('displays user messages correctly', async () => {
            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Send a message
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });
            const testMessage = 'Hello, chatbot!';

            fireEvent.change(messageInput, { target: { value: testMessage } });
            fireEvent.click(sendButton);

            // Verify user message is displayed
            await waitFor(() => {
                const userMessage = screen.getByText(testMessage);
                expect(userMessage).toBeInTheDocument();
                expect(userMessage.closest('[data-testid="user-message"]')).toBeInTheDocument();
            });
        });

        it('displays bot responses correctly', async () => {
            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Mock bot response
            const botMessage = createMockChatMessage({
                content: 'Hello! How can I help you today?',
                sender: 'bot'
            });

            // Simulate receiving bot message
            // This would typically be handled by the chat service
            // For testing, we'll need to trigger the state update

            // Verify bot message is displayed
            await waitFor(() => {
                const botMessageElement = screen.getByText(botMessage.content);
                expect(botMessageElement).toBeInTheDocument();
                expect(botMessageElement.closest('[data-testid="bot-message"]')).toBeInTheDocument();
            });
        });

        it('shows loading indicator while waiting for response', async () => {
            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Send a message
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });
            const testMessage = 'Hello, chatbot!';

            fireEvent.change(messageInput, { target: { value: testMessage } });
            fireEvent.click(sendButton);

            // Verify loading indicator is shown
            await waitFor(() => {
                expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('displays error message when message fails to send', async () => {
            // Mock failed API call
            mockFetch({ error: 'Failed to send message' }, 500);

            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Try to send a message
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });
            const testMessage = 'Hello, chatbot!';

            fireEvent.change(messageInput, { target: { value: testMessage } });
            fireEvent.click(sendButton);

            // Verify error message is displayed
            await waitFor(() => {
                expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
            });
        });

        it('handles network errors gracefully', async () => {
            // Mock network error
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Try to send a message
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });
            const testMessage = 'Hello, chatbot!';

            fireEvent.change(messageInput, { target: { value: testMessage } });
            fireEvent.click(sendButton);

            // Verify error message is displayed
            await waitFor(() => {
                expect(screen.getByText(/network error/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            render(<ChatbotWidget />);

            const chatButton = screen.getByRole('button', { name: /chat/i });
            expect(chatButton).toHaveAttribute('aria-label', expect.stringContaining('chat'));
        });

        it('supports keyboard navigation', async () => {
            render(<ChatbotWidget />);

            // Open chat interface with Enter key
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.keyPress(chatButton, { key: 'Enter', code: 'Enter' });

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });
        });

        it('maintains focus management', async () => {
            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Verify focus is moved to input
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            expect(messageInput).toHaveFocus();
        });
    });

    describe('Responsive Behavior', () => {
        it('adapts to different screen sizes', () => {
            // Mock different viewport sizes
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 768,
            });

            render(<ChatbotWidget />);

            // Verify mobile-specific behavior
            const chatButton = screen.getByRole('button', { name: /chat/i });
            expect(chatButton).toHaveClass('mobile');
        });

        it('positions correctly on different screen sizes', () => {
            render(<ChatbotWidget />);

            const chatButton = screen.getByRole('button', { name: /chat/i });

            // Verify positioning classes
            expect(chatButton).toHaveClass('position-bottom-right');
        });
    });

    describe('State Persistence', () => {
        it('remembers chat history between sessions', () => {
            // Mock localStorage with chat history
            const mockStorage = {
                getItem: jest.fn().mockReturnValue(JSON.stringify([
                    createMockChatMessage({ content: 'Previous message' })
                ])),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn(),
            };
            Object.defineProperty(window, 'localStorage', {
                value: mockStorage,
                writable: true,
            });

            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            // Verify previous message is displayed
            expect(screen.getByText('Previous message')).toBeInTheDocument();
        });

        it('saves chat history to localStorage', async () => {
            const mockStorage = {
                getItem: jest.fn().mockReturnValue(null),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn(),
            };
            Object.defineProperty(window, 'localStorage', {
                value: mockStorage,
                writable: true,
            });

            render(<ChatbotWidget />);

            // Open chat interface
            const chatButton = screen.getByRole('button', { name: /chat/i });
            fireEvent.click(chatButton);

            await waitFor(() => {
                expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
            });

            // Send a message
            const messageInput = screen.getByPlaceholderText(/type your message/i);
            const sendButton = screen.getByRole('button', { name: /send/i });
            const testMessage = 'Hello, chatbot!';

            fireEvent.change(messageInput, { target: { value: testMessage } });
            fireEvent.click(sendButton);

            // Verify localStorage was updated
            expect(mockStorage.setItem).toHaveBeenCalledWith(
                'chatbot-history',
                expect.stringContaining(testMessage)
            );
        });
    });
}); 