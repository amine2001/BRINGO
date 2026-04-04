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
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runPollingCycleForAllCompanies();

  return NextResponse.json({
    ok: true,
    summary,
  });
}
