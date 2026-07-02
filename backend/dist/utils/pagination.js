export function buildPaginatedResult(items, total, page, limit) {
    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit))
    };
}
