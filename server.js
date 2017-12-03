var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var striptags = require('striptags');

app.use(express.static('resources'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/resources/client.html');
});

io.on('connect', function(socket){
	socket.on('lines', function(lines){
		socket.broadcast.emit('lines', lines);
	});
	
	socket.on('msg', function(msg){
		if(msg != ''){
			msg = striptags(msg);
			if(msg.length > 300){
				msg = msg.substr(0, 300);
			}
			io.emit('msg', msg);
		}
	});
	
	socket.on('disconnect', function(){
		sendClientsCount();
	});
	
	sendClientsCount();
});

function sendClientsCount(){
	io.emit('clientsCount', io.engine.clientsCount);
}

server.listen((process.env.PORT || 80));