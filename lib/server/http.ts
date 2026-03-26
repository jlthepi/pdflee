// lib/server/http.ts
import { NextResponse } from "next/server";

export const ok = <T>(data: T, status = 200) => {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status },
  );
};

export const fail = (
  status: number,
  code: string,
  message: string,
  details?: unknown,
) => {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
};
