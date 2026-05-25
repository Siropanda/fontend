import { useEffect, useState } from "react";
import api from "@/services/api";
import type { PaginatedResponse } from "@/types/api";

/**
 * Fetches every page of a Django REST Framework paginated endpoint by
 * following the `next` URL until it is null, accumulating all results.
 *
 * NOTE: Only use when total `count` is small (< 500 records). For larger
 * datasets, prefer server-side pagination with explicit page controls.
 */
export const useFetchAll = <T>(url: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      const allData: T[] = [];
      let nextUrl: string | null = url;

      try {
        while (nextUrl !== null) {
          // Axios accepts absolute URLs (overrides baseURL) or relative paths.
          const res = await api.get<PaginatedResponse<T> | T[]>(nextUrl, {
            signal: controller.signal,
          });
          const json = res.data as PaginatedResponse<T> | T[] | undefined;

          if (Array.isArray(json)) {
            // Endpoint returned a plain array (no pagination wrapper).
            allData.push(...json);
            nextUrl = null;
          } else if (json && Array.isArray(json.results)) {
            allData.push(...json.results);
            nextUrl = json.next ?? null;
          } else {
            // Unknown shape — stop to avoid an infinite loop.
            console.warn("useFetchAll: unexpected response shape from", nextUrl, json);
            nextUrl = null;
          }
        }
        if (!cancelled) setData(allData);
      } catch (err: unknown) {
        if (cancelled) return;
        const e = err as { name?: string; message?: string };
        if (e.name === "CanceledError" || e.name === "AbortError") return;
        setError(e.message ?? "Failed to fetch data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
};

export default useFetchAll;
