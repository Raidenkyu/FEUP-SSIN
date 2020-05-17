const crypto = require('crypto');

// Authorization code expiration time
const code_lifetime = 300 * 1000;

/**
 * Recently generated (unused) authorization codes
 * {
 *   code: string,  (also map key)
 *   expires_in: timestamp,
 *   client_id: string,
 *   user_id: string,
 *   scopes: string,
 *   redirect_uri: string,
 *   state: string,
 * }
 * Each code signifies one authorization grant from a user to a client
 */
const grants = new Map();

/**
 * Remove old and unrevoked codes from the store
 */
setInterval(function clearCache() {
    const now = Date.now();
    if (now - latestClear < frequencyClear) return;

    for (const [code, grant] of grants.values())
        if (grant.expires_in < now)
            grants.delete(code);

    latestClear = now;
}, 30 * 1000);

/**
 * Add to the store a code along with a grant containing client_id, user_id,
 * redirect_uri, scope and state. The code and its timestamp are generated.
 */
function generate(authorization) {
    const code = crypto.randomBytes(32).toString('hex');
    console.info('Generated authorization code ' + code);

    const grant = {
        code,
        expires_in: Date.now() + code_lifetime,
        ...authorization,
    };
    grants.set(code, grant);
    return code;
}

/**
 * Revoke a code (it was used)
 */
function revoke(code) {
    grants.delete(code);
    console.info('Revoked authorization code ' + code);
}

/**
 * Get the authorization grant from a code
 * Revokes the code automatically
 */
function get(code, alsoRevoke = true) {
    const grant = grants.get(code);
    const now = Date.now();
    if (!grant || grant.expires_in < now) return null;

    if (alsoRevoke) revoke(code);
    return grant;
}

module.exports = { generate, revoke, get };
