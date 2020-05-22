require('dotenv').config();
const {CLIENT_HOST, CLIENT_PORT} = process.env;

const express = require("express");
const session = require('express-session');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cons = require('consolidate');
const cors = require('cors');

const router = require('./routes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));
app.use(cors());
app.use(session({
    secret: "very_secret_client",
    resave: true,
    saveUninitialized: true,
    cookie: {httpOnly: true, secure: false},
}));

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', './client/public');
app.set('json spaces', 4);

app.get('/', function (req, res) {
    const {access_token, refresh_token, scope} = req.session;

    res.render('index', {access_token, refresh_token, scope});
});

app.use('/', express.static('./client/public', {
    extensions: ['html', 'htm'],
}));

app.use('/', router);

const server = app.listen(CLIENT_PORT, CLIENT_HOST, function() {
    const host = server.address().address;
    const port = server.address().port;
    console.log('OAuth Client is listening at http://%s:%s', host, port);
});
