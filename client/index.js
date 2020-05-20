const express = require("express");
const cons = require('consolidate');

const router = require('./routes');

const app = express();

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', './client/public');

app.get('/', function (req, res) {
    const access_token = req.query.access_token;
    const refresh_token = req.query.refresh_token;
    const scope = req.query.scope;

    res.render('index', {access_token: access_token, refresh_token: refresh_token, scope: scope});
});

app.use('/', express.static('./client/public'));

app.use('/', router);

var server = app.listen(9000, 'localhost', function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('OAuth Client is listening at http://%s:%s', host, port);
});
