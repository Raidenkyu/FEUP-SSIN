const operations = new Map(Object.entries({
    read: "read",
    readall: "read",
    write: "write",
    delete: "delete",
}));

function getScope(operation) {
    return operations.get(operation);
}

module.exports = Object.freeze({
    getScope,
});
