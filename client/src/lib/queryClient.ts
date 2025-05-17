import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Hata ayıklama için isteği detaylı logla
  console.log(`API Request: ${method} ${url}`, { data });

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        // CSRF koruması için ek header ekleyebiliriz
        "X-Requested-With": "XMLHttpRequest" 
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Yanıtı loglama
    console.log(`API Response: ${method} ${url}`, { 
      status: res.status, 
      statusText: res.statusText
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Error: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`Query Request: GET ${url}`);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        }
      });

      console.log(`Query Response: GET ${url}`, { 
        status: res.status, 
        statusText: res.statusText
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Auth 401 handled for ${url} - returning null`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Query Error: GET ${url}`, error);
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
