import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/lib/security";
import setting from "@/config/global_config/setting.json";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
        success: true,
        state: setting.suspend_voice_route || "off",
    });
}

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { state } = body;

        if (!["off", "suspend"].includes(state)) {
            return NextResponse.json(
                { error: "Invalid state. Must be 'off' or 'suspend'" },
                { status: 400 }
            );
        }

        // Update setting.json
        const settingPath = path.join(process.cwd(), "src/config/global_config/setting.json");
        const updatedSetting = {
            ...setting,
            suspend_voice_route: state,
        };

        fs.writeFileSync(settingPath, JSON.stringify(updatedSetting, null, 2));

        return NextResponse.json({
            success: true,
            state,
            message: `API connections ${state === "suspend" ? "suspended" : "restored"}`,
        });
    } catch (e) {
        console.error("Error updating suspension state:", e);
        return NextResponse.json(
            { error: "Failed to update suspension state" },
            { status: 500 }
        );
    }
}
