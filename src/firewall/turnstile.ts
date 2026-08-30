type TurnstileVerifyResponse = {
    success: boolean;
    "error-codes"?: string[];
    challenge_ts?: string;
    hostname?: string;
};

export const verifyTurnstile = async (token: string, remoteIp?: string): Promise<{ success: boolean; errorCodes?: string[] }> => {
    if (!token) {
        return { success: false, errorCodes: ["missing-input-response"] };
    }

    try {
        const body = new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY || "",
            response: token,
        });

        if (remoteIp) {
            body.append("remoteip", remoteIp);
        }

        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
        });

        const verifyData: TurnstileVerifyResponse = await verifyRes.json();

        if (!verifyData.success) {
            console.error("Turnstile verification failed:", verifyData["error-codes"]);
        }

        return { success: verifyData.success, errorCodes: verifyData["error-codes"] };

    } catch (err) {
        console.error("Turnstile Verify Error:", err);
        return { success: false, errorCodes: ["internal-verify-error"] };
    }
};