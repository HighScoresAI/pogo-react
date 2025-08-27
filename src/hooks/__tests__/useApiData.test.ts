import { renderHook, waitFor } from '@testing-library/react';
import { useApiData } from '../useApiData';
import { mockFetch } from '@/test-utils/test-utils';

// Mock the API module
jest.mock('@/lib/api', () => ({
    fetchData: jest.fn(),
}));

describe('useApiData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should return initial state', () => {
            const { result } = renderHook(() => useApiData('/test-endpoint'));

            expect(result.current.data).toBeNull();
            expect(result.current.loading).toBe(true);
            expect(result.current.error).toBeNull();
        });

        it('should have correct endpoint', () => {
            const endpoint = '/test-endpoint';
            const { result } = renderHook(() => useApiData(endpoint));

            expect(result.current.endpoint).toBe(endpoint);
        });
    });

    describe('Data Fetching', () => {
        it('should fetch data successfully', async () => {
            const mockData = { id: 1, name: 'Test Item' };
            mockFetch(mockData);

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual(mockData);
            expect(result.current.error).toBeNull();
        });

        it('should handle API errors', async () => {
            mockFetch({ error: 'Not found' }, 404);

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toBeNull();
            expect(result.current.error).toBe('Not found');
        });

        it('should handle network errors', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toBeNull();
            expect(result.current.error).toBe('Network error');
        });
    });

    describe('Loading States', () => {
        it('should set loading to true initially', () => {
            const { result } = renderHook(() => useApiData('/test-endpoint'));

            expect(result.current.loading).toBe(true);
        });

        it('should set loading to false after data fetch', async () => {
            const mockData = { id: 1, name: 'Test Item' };
            mockFetch(mockData);

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });

        it('should set loading to false after error', async () => {
            mockFetch({ error: 'Not found' }, 404);

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });
    });

    describe('Refetch Functionality', () => {
        it('should refetch data when refetch is called', async () => {
            const mockData = { id: 1, name: 'Test Item' };
            mockFetch(mockData);

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Mock new data for refetch
            const newMockData = { id: 2, name: 'Updated Item' };
            mockFetch(newMockData);

            // Call refetch
            result.current.refetch();

            // Should show loading state
            expect(result.current.loading).toBe(true);

            // Wait for new data
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual(newMockData);
        });

        it('should handle errors during refetch', async () => {
            const mockData = { id: 1, name: 'Test Item' };
            mockFetch(mockData);

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Mock error for refetch
            mockFetch({ error: 'Server error' }, 500);

            // Call refetch
            result.current.refetch();

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBe('Server error');
        });
    });

    describe('Dependencies', () => {
        it('should refetch when endpoint changes', async () => {
            const { result, rerender } = renderHook(
                ({ endpoint }) => useApiData(endpoint),
                { initialProps: { endpoint: '/endpoint-1' } }
            );

            const mockData1 = { id: 1, name: 'Item 1' };
            mockFetch(mockData1);

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual(mockData1);

            // Change endpoint
            const mockData2 = { id: 2, name: 'Item 2' };
            mockFetch(mockData2);

            rerender({ endpoint: '/endpoint-2' });

            // Should show loading state
            expect(result.current.loading).toBe(true);

            // Wait for new data
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toEqual(mockData2);
        });

        it('should not refetch when endpoint is the same', async () => {
            const mockData = { id: 1, name: 'Test Item' };
            mockFetch(mockData);

            const { result, rerender } = renderHook(
                ({ endpoint }) => useApiData(endpoint),
                { initialProps: { endpoint: '/test-endpoint' } }
            );

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const initialData = result.current.data;

            // Rerender with same endpoint
            rerender({ endpoint: '/test-endpoint' });

            // Should not refetch
            expect(result.current.data).toBe(initialData);
            expect(result.current.loading).toBe(false);
        });
    });

    describe('Cleanup', () => {
        it('should cancel pending requests on unmount', async () => {
            // Mock a slow response
            global.fetch = jest.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: 'delayed' })
                }), 1000))
            );

            const { result, unmount } = renderHook(() => useApiData('/test-endpoint'));

            // Start the request
            expect(result.current.loading).toBe(true);

            // Unmount before request completes
            unmount();

            // Should not cause memory leaks or errors
            expect(result.current.loading).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty response', async () => {
            mockFetch(null);

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toBeNull();
            expect(result.current.error).toBeNull();
        });

        it('should handle malformed JSON response', async () => {
            global.fetch = jest.fn().mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.reject(new Error('Invalid JSON'))
                })
            );

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toBeNull();
            expect(result.current.error).toBe('Invalid JSON');
        });

        it('should handle timeout scenarios', async () => {
            // Mock a timeout scenario
            global.fetch = jest.fn().mockImplementation(() =>
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), 100)
                )
            );

            const { result } = renderHook(() => useApiData('/test-endpoint'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.data).toBeNull();
            expect(result.current.error).toBe('Request timeout');
        });
    });
}); 