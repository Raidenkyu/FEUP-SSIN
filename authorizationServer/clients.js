// clients information
const {CLIENT_HOST, CLIENT_PORT} = process.env;

const clients = new Map(Object.entries({
    client: {
        client_id: "client",
        client_secret: "123",
        redirect_uri: `http://${CLIENT_HOST}:${CLIENT_PORT}/callback`,
        scope: "read write delete",
    },
}));

module.exports = Object.freeze({
    get: (client_id) => clients.get(client_id),
    getAll: () => Object.fromEntries(clients),
    verifyScope: (client_id, scope) => clients.has(client_id) &&
        scope.trim().split(/\s+/g).every((singleScope) =>
            clients.get(client_id).scope.includes(singleScope))
});
