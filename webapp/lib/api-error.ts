import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

export function getApiErrorMessage(
  error: FetchBaseQueryError | SerializedError | unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (!error || typeof error !== "object") return fallback;

  if ("data" in error) {
    const data = error.data;
    if (typeof data === "string" && data) return data;
    if (data && typeof data === "object" && "message" in data) {
      const message = data.message;
      if (typeof message === "string" && message) return message;
      if (Array.isArray(message) && typeof message[0] === "string") return message[0];
    }
  }

  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  if ("error" in error && typeof error.error === "string") {
    return error.error;
  }

  return fallback;
}
