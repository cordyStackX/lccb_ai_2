export const cooldownMap = new Map<string, number>();

export const CodeStore = new Map<
    string,
    { code: string; expiresAt: number; confirm_code: string; purpose: string }
>();

export const attemptMap = new Map<string, number>();

const verifiedMap = new Map<string, { purpose: string; expiresAt: number; token: string }>();

export function consumeVerification(email: string, purpose: string, token: string | undefined) {
    const verified = verifiedMap.get(email);
    if (!verified || !token || verified.token !== token || verified.purpose !== purpose || Date.now() > verified.expiresAt) {
        if (verified && Date.now() > verified.expiresAt) verifiedMap.delete(email);
        return false;
    }
    verifiedMap.delete(email);
    return true;
}

export function grantVerification(email: string, purpose: string, expiresAt: number, token: string) {
    verifiedMap.set(email, { purpose, expiresAt, token });
}

export function revokeVerification(email: string) {
    verifiedMap.delete(email);
}
