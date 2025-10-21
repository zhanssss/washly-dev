// src/lib/qr/parseQrToken.ts
export function parseQrToken(raw: string): string | null {
    const s = (raw || "").trim();

    // попытка распарсить как URL
    try {
        const u = new URL(s);
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts[0] === "qr" && parts[1]) return parts[1];
    } catch {
        // not a valid URL — падаем в regex
    }

    // вытащить токен по шаблону ".../qr/<token>"
    const m = s.match(/(?:^|\/)qr\/([^/?#]+)/i);
    if (m?.[1]) return m[1];

    // возможно, сыро передали только сам токен
    return /^[A-Za-z0-9._-]+$/.test(s) ? s : null;
}
