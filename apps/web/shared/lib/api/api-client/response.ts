import { ApiRequestError } from "../utils/errors";

export async function parseJsonResponse<TResponse>(response: Response): Promise<TResponse> {
  if (response.status === 204) {
    return null as TResponse;
  }

  if (!response.ok) {
    let message = response.statusText || "Request failed";
    let errors: Record<string, string[]> = {};

    try {
      const body = (await response.json()) as { errors?: unknown; message?: unknown };

      if (typeof body.message === "string") {
        message = body.message;
      }

      if (typeof body.errors === "object" && body.errors !== null && !Array.isArray(body.errors)) {
        errors = Object.fromEntries(
          Object.entries(body.errors).filter(
            (entry): entry is [string, string[]] =>
              Array.isArray(entry[1]) && entry[1].every((e) => typeof e === "string"),
          ),
        );
      }
    } catch {
      // Keep status text fallback when the response body is not JSON.
    }

    throw new ApiRequestError(message, response.status, errors);
  }

  return (await response.json()) as TResponse;
}
