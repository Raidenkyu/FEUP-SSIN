// registred users information
const users = new Map(Object.entries({
    'antonio': {
        username: 'antonio',
        password: '123',
    },
    'bruno': {
        username: 'bruno',
        password: '123',
    },
    'joao': {
        username: 'joao',
        password: '123',
    },
    'alice': {
        username: 'alice',
        password: '123',
    },
    'bob': {
        username: 'bob',
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
