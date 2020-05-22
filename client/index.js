const express = require("express");
const session = require('express-session');
const bodyParser = require('body-parser');
const cons = require('consolidate');
const cors = require('cors');

const router = require('./routes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(session({
    secret: "very_secret",
    resave: false,
    saveUninitialized: true,
}));

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', './client/public');
app.set('json spaces', 4);

app.get('/', function (req, res) {
    const access_token = req.query.access_token;
    const refresh_token = req.query.refresh_token;
    const scope = req.query.scope;

    res.render('index', {access_token, refresh_token, scope});
});

app.use('/', express.static('./client/public', {
    extensions: ['html', 'htm'],
}));

app.use('/', router);

var server = app.listen(9000, 'localhost', function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('OAuth Client is listening at http://%s:%s', host, port);
});
