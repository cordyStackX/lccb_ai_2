import { NextResponse } from "next/server";
import db from "@/lib/mysql2/db";

export async function GET() {
    try {
        // Test database connection with a simple query
        await db.query("SELECT 1");
        
        return NextResponse.json(
            { status: "healthy", message: "Database connection successful" },
            { status: 200 }
        );
    } catch (err) {
        console.error("Database health check failed:", err);
        
        return NextResponse.json(
            { 
                status: "unhealthy", 
                message: "Database connection failed",
                error: err instanceof Error ? err.message : "Unknown error"
            },
            { status: 503 }
        );
    }
}