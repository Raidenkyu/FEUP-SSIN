// clients information
const clients = new Map(Object.entries({
    "client": {
        "client_id": "client",
        "client_secret": "123",
        "redirect_uri": "http://localhost:9000/callback",
        "scope": "read write delete",
    },
    "client-2": {
        "client_id": "client-2",
        "client_secret": "123",
        "redirect_uri": "http://localhost:9000/callback/2",
        "scope": "read"
    },
}));

module.exports = Object.freeze({
    get: (client_id) => clients.get(client_id)
});
