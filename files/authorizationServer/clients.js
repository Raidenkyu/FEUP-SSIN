// clients information
const clients = [
	{
		"client_id": "oauth-client-1",
		"client_secret": "oauth-client-secret-1",
		"redirect_uris": ["http://localhost:9000/callback"],
		"scope": "foo bar"
    },
    {
        "client_id": "client",
		"client_secret": "123",
		"redirect_uris": ["http://localhost:9000/"],
		"scope": "read write delete"
    },
];

module.exports = clients;