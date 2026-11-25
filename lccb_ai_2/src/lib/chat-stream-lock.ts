type ChatLockGlobal = typeof globalThis & { __lacoChatRequests?: Set<string> };

function activeRequests() {
    const root = globalThis as ChatLockGlobal;
    return root.__lacoChatRequests ??= new Set<string>();
}

export function acquireChatStream(email: string) {
    const key = email.trim().toLowerCase();
    if (!key || activeRequests().has(key)) return false;
    activeRequests().add(key);
    return true;
}

export function releaseChatStream(email: string) {
    activeRequests().delete(email.trim().toLowerCase());
}

export function releaseWhenStreamEnds(body: ReadableStream<Uint8Array>, email: string) {
    const reader = body.getReader();
    let released = false;
    const release = () => {
        if (released) return;
        released = true;
        releaseChatStream(email);
    };

    return new ReadableStream<Uint8Array>({
        async pull(controller) {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    release();
                    controller.close();
                } else {
                    controller.enqueue(value);
                }
            } catch (error) {
                release();
                controller.error(error);
            }
        },
        async cancel(reason) {
            try {
                await reader.cancel(reason);
            } finally {
                release();
            }
        },
    });
}
