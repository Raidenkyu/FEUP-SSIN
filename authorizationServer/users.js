// registred users information
const users = new Map(Object.entries({
    'antonio': {
        user_id: 'antonio',
        password: '123',
    },
    'bruno': {
        user_id: 'bruno',
        password: '123',
    },
    'joao': {
        user_id: 'joao',
        password: '123',
    },
    'alice': {
        user_id: 'alice',
        password: '123',
    },
    'bob': {
        user_id: 'bob',
        password: '123',
    },
}));

module.exports = Object.freeze({
    get: (username) => users.get(username),
    verify: (username, password) => {
        const user = users.get(username);
        return password === user.password;
    }
});
