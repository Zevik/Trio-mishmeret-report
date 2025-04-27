import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in demo mode for production
  const isDemoMode = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    console.log('Using configured API URL from environment:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (Netlify)
  if (import.meta.env.PROD) {
    // If we're in demo mode, return empty string to avoid network errors
    // (we'll use mock handlers for API calls)
    if (isDemoMode) {
      console.log('Using demo mode in production - API calls will be mocked');
      // Return empty string - the mock handlers will intercept these requests
      return "";
    }
    
    console.warn('Running in production without VITE_API_URL - API calls may fail');
    
    // Fallback URL for production without proper configuration
    // This should generally not happen if environment variables are set correctly
    return "";
  }
  
  // In development, use relative URL (same origin)
  return "";
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Prepend API base URL if URL doesn't already include http(s)://
  const fullUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Check if we're in demo mode for production
    const isDemoMode = import.meta.env.VITE_USE_MOCK_DATA === 'true';
    
    // Handle mock responses for user verification in demo mode
    if (isDemoMode && import.meta.env.PROD) {
      const url = queryKey[0] as string;
      
      // Handle user verification endpoint specifically
      if (url.startsWith('/api/user/')) {
        const userId = url.split('/').pop();
        console.log('Demo mode: Handling user verification for', userId);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Return mock data for specific IDs or a generic user
        if (userId === '204248272') {
          return { name: 'יהונתן בוורסקי גולן' };
        } else if (userId && userId.length >= 8) {
          return { name: 'משתמש בדיקה' };
        }
        
        // User not found
        const notFoundError = new Error('User not found');
        (notFoundError as any).status = 404;
        throw notFoundError;
      }
      
      // Handle other endpoints as needed
      // ... (more mock handlers could be added here)
    }
    
    // Handle regular API requests
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;
    
    try {
      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // In production demo mode, we'll handle specific fallbacks
      if (isDemoMode && import.meta.env.PROD) {
        console.warn('API error in demo mode, providing fallback data:', error);
        
        // Fallback data could be added here for different endpoints
        // This serves as a last resort if the mock handlers above didn't catch it
      }
      
      // Re-throw the error for normal error handling
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
