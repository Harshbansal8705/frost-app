import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner"; // Assuming sonner is used for toasts, if not I should check

interface FetchOptions<T> extends RequestInit {
  onSuccess?: (data: T) => void;
  onError?: (msg: string) => void;
  skipRefresh?: boolean;
}

export function useFrostFetch() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const frostFetch = useCallback(async <T = unknown>(url: string, options: FetchOptions<T> = {}) => {
    setLoading(true);
    try {
      const { onSuccess, ...fetchOptions } = options;
      const response = await fetch(url, fetchOptions);

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorMessage = data?.error || "An unexpected error occurred";
        throw new Error(errorMessage);
      }

      if (options.method && options.method !== 'GET' && !options.skipRefresh) {
        router.refresh();
      }

      if (onSuccess) {
        onSuccess(data as T);
      }

      return data as T;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Something went wrong";
      toast.error(msg);

      if (options.onError) {
        options.onError(msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { frostFetch, loading };
}
