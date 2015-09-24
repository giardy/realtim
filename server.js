var config = require('./config.json');
var express = require('express');
var app = express();
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var massive = require('massive');
var connectionString = (
    `postgres://${config.postgres.user}:${config.postgres.password}@${config.postgres.host}/${config.postgres.db}`
);
var massiveInstance = massive.connectSync({connectionString: connectionString});
var pg = require('pg');

/*********** Express setup ***********/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(serveStatic('./public'));
app.set('db', massiveInstance);
var db = app.get('db');

/*********** API routes *************/
app.get('/api/coords', function (req, res) {
    var coords = [];

    if (!db.coords) {
        res.json(coords);
        return;
    }

    db.coords.findDoc(function (err, doc) {
        if (err) {
            throw err;
        }

        for(var row of doc) {
            coords.push({latitude: row.latitude, longitude: row.longitude});
        }

        res.json(coords);
    });
})

app.post('/api/coords', function (req, res) {
    var newCoords = req.body.coords;

    db.saveDoc('coords', newCoords, function (err, response) {
        if (err) {
            throw err;
        }

        io.emit('added', response);

        res.json(response);
    });
});

/********** Start the server *********/
var server = app.listen(config.express.port, function () {
    var host = server.address().address;
    var port = config.express.port; // server.address().port;

    console.log(`Server running on http://${host}:${port}`);
});

/********** Initialize Socket.io *****/
var io = require('socket.io')(server);
