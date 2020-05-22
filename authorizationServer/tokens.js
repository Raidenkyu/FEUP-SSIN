const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKEY = fs.readFileSync('keys/private.pem', 'utf8');
const publicKEY = fs.readFileSync('keys/public.pem', 'utf8');

const accessTokenOptions = {
    expiresIn: "1h",
    algorithm: "RS512",
};

const refreshTokenOptions = {
    algorithm: "RS512",
};

const verifyOptions = {
    algorithms: ["RS512"],
}

/**
 * Generate an access/refresh token pair for an authorization grant
 */
function generate({ client_id, user_id, scope }) {
    const payload = { client_id, user_id, scope };
    const token = jwt.sign(payload, privateKEY, accessTokenOptions)
    const refreshToken = jwt.sign(payload, privateKEY, refreshTokenOptions);
    return { token, refreshToken };
}

/**
 * Verify an access token
 */
function verify(token) {
    return jwt.verify(token, publicKEY, verifyOptions);
}

/**
 * Refresh an access token
 */
function refresh(refreshToken) {
    // TODO
}

module.exports = Object.freeze({
    generate, verify, refresh
});
