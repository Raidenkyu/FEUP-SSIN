// clients information
const clients = new Map(Object.entries({
    client: {
        client_id: "client",
        client_secret: "123",
        redirect_uri: "http://localhost:9000/callback",
        scope: "read write delete",
    },
}));

module.exports = Object.freeze({
    get: (client_id) => clients.get(client_id),
    verifyScope: (client_id, scope) => clients.has(client_id) &&
        scope.split(/\s+/g).every((singleScope) =>
            clients.get(client_id).scope.includes(singleScope))
});
