var express = require('express');
var app = express();
var server = require('http').createServer(app); 
var io = require('socket.io')(server);

app.use(express.static('resources'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/resources/client.html');
});

io.on('connect', function(socket){
	socket.on('lines', function(lines){
		socket.broadcast.emit('lines', lines);
	});
});


server.listen((process.env.PORT || 80));