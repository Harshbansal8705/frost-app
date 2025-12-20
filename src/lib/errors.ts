import { NextResponse } from "next/server";
import { APIHandler } from "@/types";

export class FrostError extends Error {
  code: number;

  constructor(message: string, code: number = 500) {
    super(message);
    this.name = "FrostError";
    this.code = code;
  }
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function handleFrostError(error: unknown) {
  console.error("[FROST_ERROR]", error);

  if (error instanceof FrostError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code }
    );
  }

  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  );
}

// Wrapper for API routes to enforce global error handling

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeAPI<T = unknown, P = any>(handler: APIHandler<T, P>): APIHandler<T, P> {
  return async (req: Request, params: { params: Promise<P> }) => {
    try {
      return await handler(req, params);
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return handleFrostError(error) as any;
    }
  };
}
