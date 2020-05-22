const operations = new Map(Object.entries({
    read: "read",
    readall: "read",
    write: "write",
    delete: "delete",
}));

const needWord = ["read", "write", "delete"];

function getScope(operation) {
    return operations.get(operation);
}

function requiresWord(operation) {
    return needWord.includes(operation);
}

module.exports = Object.freeze({
    getScope,
    requiresWord
});
