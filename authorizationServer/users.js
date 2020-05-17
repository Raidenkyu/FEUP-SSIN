// registred users information
const users = new Map(Object.freeze({
    100: {
        username: 'antonio',
		password: '123',
    },
    200: {
        username: 'bruno',
		password: '123',
    },
    300: {
        username: 'joao',
		password: '123',
    },
    400: {
        username: 'alice',
		password: '123',
    },
    500: {
        username: 'bob',
		password: '123',
    },
}));

module.exports = Object.freeze({
    get: (user_id) => users.get(user_id)
});
