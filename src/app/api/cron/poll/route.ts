import { NextResponse, type NextRequest } from "next/server";

import { getCronEnv } from "@/lib/env";
import { runPollingCycleForAllCompanies } from "@/lib/control-tower/poll";

function isAuthorized(request: NextRequest) {
  const env = getCronEnv();
  const bearer = request.headers.get("authorization");

  if (bearer === `Bearer ${env.CRON_SECRET}`) {
    return true;
  }

  const querySecret = request.nextUrl.searchParams.get("secret");
  return querySecret === env.CRON_SECRET;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const summary = await runPollingCycleForAllCompanies();

    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown cron polling error.";

    console.error("Cron polling request failed.", error);

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
