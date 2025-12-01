import { NextRequest, NextResponse } from "next/server";
import db from "@/app/services/mysql2/connections/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";

const LoginAttempts = new Map<string, { attempts: number; cooldownUntil: number }>();

const verifyPassword = async (plainpassword: string, hashpassword: string) => {
    const match = await bcrypt.compare(plainpassword, hashpassword);
    return match;
};

export async function POST(req: NextRequest) {
    try {

        const { email, password } = await req.json();

        if (password.length < 8) return NextResponse.json({ success: false, error: "Password Must be more than 8 characters" }, { status: 409 });

        if (!email || !password) return NextResponse.json({ success: false, error: "Email and Password is required" }, { status: 404 });
        
        const [rows] = await db.query("SELECT * FROM auth WHERE email = ?", [email]) as [RowDataPacket[], unknown];

        console.log(" ==> User Trying To Login");
        console.log("Data Info: ", rows);

        if (rows.length > 0) {

            const user = rows[0];
            const email = user.email;
            const now = Date.now();

            // === GET LOGIN STATE FROM MEMORY ===
            let state = LoginAttempts.get(email);

            if (!state) {
                state = { attempts: 0, cooldownUntil: 0 };
                LoginAttempts.set(email, state);
            }

            // === CHECK IF USER IS IN COOLDOWN ===
            if (now < state.cooldownUntil) {
                const left = Math.ceil((state.cooldownUntil - now) / 1000);
                return NextResponse.json(
                    { success: false, error: `Too many attempts. Try again in ${left}s.` },
                    { status: 429 }
                );
            }

            // === CHECK PASSWORD ===
            const verify = await verifyPassword(password, user.password);

            if (!verify) {

                state.attempts++;

                console.log(`Wrong password: ${state.attempts} attempts`);

                // If wrong attempts reached 5 → cooldown for 3 minutes
                if (state.attempts >= 5) {
                    state.cooldownUntil = now + 3 * 60 * 1000; // 3 minutes
                    state.attempts = 0; // reset attempts
                    LoginAttempts.set(email, state);

                    return NextResponse.json(
                        { success: false, error: "Too many attempts. Locked for 3 minutes." },
                        { status: 429 }
                    );
                }

                LoginAttempts.set(email, state);
                return NextResponse.json(
                    { success: false, error: "Password does not match", attemptsLeft: 5 - state.attempts },
                    { status: 409 }
                );
            }

            // === CORRECT PASSWORD ===
            state.attempts = 0;
            state.cooldownUntil = 0;
            LoginAttempts.set(email, state);

            return NextResponse.json({ success: true }, { status: 200 });
        }
        
    } catch (err: unknown) {

        console.error("BackEnd Error: ", err);

        return NextResponse.json({ success: false, error: "Server is Down" }, {status: 500});

    }

}