export const cooldownMap = new Map<string, number>();

export const CodeStore = new Map<
    string,
    { code: string; expiresAt: number; confirm_code: string; }
>();

export const attemptMap = new Map<string, number>();
