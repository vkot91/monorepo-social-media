import { loginSchema } from "@social/contracts";
import { NextResponse } from "next/server";
import { ApiRequestError } from "#/lib/api/errors";
import { persistAuthSession } from "#/lib/api/auth/session";
import { authServerApi } from "#/lib/api/auth/server-actions";

export async function POST(request: Request) {
  const body = await request.json();
  const input = loginSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json({ message: "Enter a valid email and password." }, { status: 400 });
  }

  try {
    const response = await authServerApi.login(input.data);
    await persistAuthSession(response);

    return NextResponse.json({ user: response.user });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "Login is unavailable right now." }, { status: 502 });
  }
}
