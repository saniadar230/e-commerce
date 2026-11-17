// one place for page/limit/offset math -- every service reuses this
export function getPagination(query) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

export function buildMeta({ page, limit, total }) {
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
}