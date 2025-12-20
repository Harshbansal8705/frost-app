import { NextResponse } from "next/server";

export class FrostError extends Error {
  code: number;

  constructor(message: string, code: number = 500) {
    super(message);
    this.name = "FrostError";
    this.code = code;
  }
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
type APIHandler<T = any> = (
  req: Request,
  params: any
) => Promise<NextResponse<T>> | Promise<Response>;

export function safeAPI(handler: APIHandler): APIHandler {
  return async (req: Request, params: any) => {
    try {
      return await handler(req, params);
    } catch (error) {
      return handleFrostError(error);
    }
  };
}
