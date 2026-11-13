
"use server";

import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseServer } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import api_link from "@/config/conf/json_config/Api_links.json";

type RetryState = {
    count: number;
    windowStart: number;
};

// Retry tracking per session + IP
const retryMap = new Map<string, RetryState>();

const MAX_RETRIES = 50;
const RETRY_WINDOW_MS = 60_000;

function toOrigin(url: string | null): string | null {
    if (!url) return null;

    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
}

function normalizeIp(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");

    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }

    return req.headers.get("x-real-ip") || "unknown";
}

// Allow localhost and loopback addresses on different ports.
// Do not use this as a production domain wildcard.
function isLocalOrigin(origin: string | null): boolean {
    if (!origin) return false;

    try {
        const url = new URL(origin);

        return (
            ["localhost", "127.0.0.1", "::1"].includes(url.hostname) &&
            ["http:", "https:"].includes(url.protocol)
        );
    } catch {
        return false;
    }
}

function isAllowedRequestOrigin(req: NextRequest): boolean {
    const requestOrigin = toOrigin(req.headers.get("origin"));
    const refererOrigin = toOrigin(req.headers.get("referer"));

    const configuredOrigins = [
        process.env.APP_URL,
        process.env.NEXT_PUBLIC_APP_URL,
        "http://localhost:3000",
        "https://localhost:3000",
        "http://laco-py:5000/",
        api_link.share_ip_link,
        "http://app.laco.local/"
    ];

    const allowedOrigins = new Set(
        configuredOrigins
            .map((origin) => toOrigin(origin ?? null))
            .filter((origin): origin is string => Boolean(origin))
    );

    // Exact configured origin match
    if (requestOrigin && allowedOrigins.has(requestOrigin)) {
        return true;
    }

    if (refererOrigin && allowedOrigins.has(refererOrigin)) {
        return true;
    }

    // Local development: any localhost/loopback port
    if (isLocalOrigin(requestOrigin)) {
        return true;
    }

    if (isLocalOrigin(refererOrigin)) {
        return true;
    }

    return false;
}

function cleanupRetryMap(now: number) {
    if (retryMap.size <= 2000) return;

    const cutoff = now - RETRY_WINDOW_MS * 2;

    for (const [key, value] of retryMap.entries()) {
        if (value.windowStart < cutoff) {
            retryMap.delete(key);
        }
    }
}

export async function Security(req: NextRequest) {

    const isWeb =
        req.headers.get("origin") ||
        req.headers.get("referer");

    if (isWeb && !isAllowedRequestOrigin(req)) {
        return {
            error: NextResponse.json(
                { error: "CSRF blocked" },
                { status: 403 }
            ),
        };
    }

    try {
        const authHeader = req.headers.get("authorization");

        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.replace("Bearer ", "")
            : null;

        const cookieToken = (await cookies()).get("token")?.value;

        const token = bearerToken || cookieToken;

        if (!token) {
            return {
                error: NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                ),
            };
        }

        // Retry tracking
        const ip = normalizeIp(req);
        const sessionKey = `${token.slice(0, 24)}:${ip}`;
        const now = Date.now();

        const currentRetryState = retryMap.get(sessionKey);

        if (
            !currentRetryState ||
            now - currentRetryState.windowStart > RETRY_WINDOW_MS
        ) {
            retryMap.set(sessionKey, {
                count: 1,
                windowStart: now,
            });
        } else {
            const nextCount = currentRetryState.count + 1;

            if (nextCount > MAX_RETRIES) {
                return {
                    error: NextResponse.json(
                        {
                            error: "Too many requests. Please try again after a minute.",
                        },
                        { status: 429 }
                    ),
                };
            }

            retryMap.set(sessionKey, {
                ...currentRetryState,
                count: nextCount,
            });
        }

        cleanupRetryMap(now);

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as {
            email?: string;
            final_data?: {
                email?: string;
            };
        };

        const email =
            decoded.email ?? decoded.final_data?.email;

        if (!email) {
            return {
                error: NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                ),
            };
        }

        // Verify active account through Supabase
        const { data: user, error } = await supabaseServer
            .from("auth")
            .select("role, status")
            .eq("email", email)
            .maybeSingle();

        if (error || user?.status !== "active") {
            return {
                error: NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                ),
            };
        }

        return {
            error: false,
            email,
            role: user.role ?? null,
        };

    } catch (err) {
        console.error("Security error:", err);

        return {
            error: NextResponse.json(
                { error: "Unauthorized" },
                { status: 500 }
            ),
        };
    }
}
