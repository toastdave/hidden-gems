export type ApiFetchResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

export const apiServerBase =
  import.meta.env.API_INTERNAL_BASE_URL ??
  import.meta.env.PUBLIC_API_BASE_URL ??
  "http://localhost:3000";

export const apiClientBase = import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:3000";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unable to connect to API service.";
}

export async function fetchApiJson<T>(
  input: string | URL,
  init?: RequestInit,
): Promise<ApiFetchResult<T>> {
  try {
    const response = await fetch(input, init);
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? ((await response.json()) as T) : null;
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: payload,
        error: `Request failed with status ${response.status}`,
      };
    }
    return {
      ok: true,
      status: response.status,
      data: payload,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: getErrorMessage(error),
    };
  }
}
