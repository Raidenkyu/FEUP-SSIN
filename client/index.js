var express = require("express");
var cons = require('consolidate');

var app = express();

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', './public');

app.get('/', function (req, res) {
  const access_token = req.query.access_token;
  const refresh_token = req.query.refresh_token;
  const scope = req.query.scope;

	res.render('index', {access_token: access_token, refresh_token: refresh_token, scope: scope});
});

app.use('/', express.static('./public'));

var server = app.listen(9000, 'localhost', function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('OAuth Client is listening at http://%s:%s', host, port);
});
