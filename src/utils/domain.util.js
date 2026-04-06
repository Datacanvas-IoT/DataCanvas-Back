function extractDomain(req) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    try {
        if (origin) return new URL(origin).origin;
        if (referer) return new URL(referer).origin;
    } catch {
        return null;
    }

    return null;
}

module.exports = { extractDomain };