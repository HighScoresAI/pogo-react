import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthContext } from '@/contexts/AuthContext';
import { ProjectContext } from '@/contexts/ProjectContext';

// Mock data for testing
export const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    avatar: '/avatars/test.png',
    role: 'user',
    createdAt: new Date().toISOString(),
};

export const mockProject = {
    id: '1',
    name: 'Test Project',
    description: 'A test project for testing',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [mockUser],
    owner: mockUser,
};

export const mockAuthContextValue = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    updateProfile: jest.fn(),
};

export const mockProjectContextValue = {
    projects: [mockProject],
    currentProject: mockProject,
    isLoading: false,
    createProject: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    setCurrentProject: jest.fn(),
    fetchProjects: jest.fn(),
};

// Custom render function that includes all necessary providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <ThemeProvider>
            <AuthContext.Provider value={mockAuthContextValue}>
                <ProjectContext.Provider value={mockProjectContextValue}>
                    {children}
                </ProjectContext.Provider>
            </AuthContext.Provider>
        </ThemeProvider>
    );
};

// Custom render function for components that need providers
const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Custom render function for components that don't need providers
const renderWithoutProviders = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, options);

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render, renderWithoutProviders };

// Utility functions for testing
export const createMockEvent = (value: string) => ({
    target: { value },
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
});

export const createMockFormEvent = (formData: Record<string, string>) => ({
    preventDefault: jest.fn(),
    target: {
        elements: Object.keys(formData).reduce((acc, key) => {
            acc[key] = { value: formData[key] };
            return acc;
        }, {} as Record<string, { value: string }>),
    },
});

export const waitForElementToBeRemoved = (element: HTMLElement) =>
    new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            if (!document.contains(element)) {
                observer.disconnect();
                resolve(true);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });

// Mock fetch for API testing
export const mockFetch = (response: any, status = 200) => {
    global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
            ok: status >= 200 && status < 300,
            status,
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response)),
        })
    );
};

// Mock localStorage
export const mockLocalStorage = () => {
    const store: Record<string, string> = {};

    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach(key => delete store[key]);
        }),
    };
};

// Mock sessionStorage
export const mockSessionStorage = () => {
    const store: Record<string, string> = {};

    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach(key => delete store[key]);
        }),
    };
};

// Mock window.location
export const mockWindowLocation = (url: string) => {
    delete (window as any).location;
    window.location = new URL(url) as any;
};

// Mock window.scrollTo
export const mockWindowScrollTo = () => {
    window.scrollTo = jest.fn();
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
    const mockResizeObserver = jest.fn();
    mockResizeObserver.mockReturnValue({
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
    });
    window.ResizeObserver = mockResizeObserver;
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
    ...mockUser,
    ...overrides,
});

export const createMockProject = (overrides = {}) => ({
    ...mockProject,
    ...overrides,
});

export const createMockActivity = (overrides = {}) => ({
    id: '1',
    type: 'project_created',
    description: 'Project was created',
    userId: '1',
    projectId: '1',
    createdAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
});

export const createMockChatMessage = (overrides = {}) => ({
    id: '1',
    content: 'Hello, how can I help you?',
    sender: 'bot',
    timestamp: new Date().toISOString(),
    type: 'text',
    ...overrides,
}); 