module.exports = function extendURL(url, extraParams) {
    if (!(url instanceof URL)) url = new URL(url);
    const params = new URLSearchParams(url.search);
    for (const [key, value] of Object.entries(extraParams))
        params.set(key, value);
    url.search = params;
    return url;
};
