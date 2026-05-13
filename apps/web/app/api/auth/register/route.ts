import { registerSchema } from "@social/contracts";
import { NextResponse } from "next/server";
import { ApiRequestError } from "#/lib/api/errors";
import { persistAuthSession } from "#/lib/api/auth/session";
import { authServerApi } from "#/lib/api/auth/server-actions";

export async function POST(request: Request) {
  const input = registerSchema.safeParse(await request.json().catch(() => null));

  if (!input.success) {
    return NextResponse.json({ message: "Please check the registration fields." }, { status: 400 });
  }

  try {
    const response = await authServerApi.register(input.data);
    await persistAuthSession(response);

    return NextResponse.json({ user: response.user });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "Registration is unavailable right now." },
      { status: 502 },
    );
  }
}
