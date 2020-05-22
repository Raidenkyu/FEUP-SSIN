const jwt = require('jsonwebtoken');

const state_secret = "some_random_secret";

const buildOptions = {
    algorithm: "HS512",
};

const parseOptions = {
    algorithms: ["HS512"],
};

function buildState(payload) {
    return jwt.sign(payload, state_secret, buildOptions);
}

function parseState(state) {
    try {
        return jwt.verify(state, state_secret, parseOptions);
    } catch (err) {
        return null;
    }
}

module.exports = Object.freeze({
    build: buildState,
    parse: parseState,
});
