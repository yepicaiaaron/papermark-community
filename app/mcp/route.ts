import { handleMcp } from "@/community/features/mcp/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = handleMcp;
export const POST = handleMcp;
export const DELETE = handleMcp;
export const OPTIONS = handleMcp;
