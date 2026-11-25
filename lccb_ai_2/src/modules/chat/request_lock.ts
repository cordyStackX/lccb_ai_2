const activeRequests = new Set<string>();

function requestKey(email: string) {
    return email.trim().toLowerCase() || "anonymous";
}

export function acquireChatRequest(email: string) {
    const key = requestKey(email);
    if (activeRequests.has(key)) return null;
    activeRequests.add(key);
    return key;
}

export function releaseChatRequest(key: string) {
    activeRequests.delete(key);
}
