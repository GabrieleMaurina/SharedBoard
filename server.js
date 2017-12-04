const MAX_MSG_LENGTH = 300;
const MAX_NAME_LENGTH = 20;

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var striptags = require('striptags');

app.use(express.static('resources'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/resources/client.html');
});

var names = {};

io.on('connect', function(socket){
	socket.on('lines', function(lines){
		socket.broadcast.emit('lines', lines);
	});
	
	socket.on('msg', function(msg){
		if(msg != ''){
			msg = striptags(msg);
			if(msg.length > MAX_MSG_LENGTH){
				msg = msg.substr(0, MAX_MSG_LENGTH);
			}
			var name = 'Unknown';
			if(names[socket.id]){
				name = names[socket.id];
			}
			io.emit('msg', name + ': ' + msg);
		}
	});
	
	socket.on('name', function(name){
		if(name != ''){
			name = striptags(name);
			if(name.length > MAX_NAME_LENGTH){
				msg = msg.substr(0, MAX_NAME_LENGTH);
			}
			if(names[socket.id] != name){
				names[socket.id] = name;
				sendNames();
			}
		}
	});
	
	socket.on('disconnect', function(){
		sendClientsCount();
		delete names[socket.id];
		sendNames();
	});
	
	sendNames();
	sendClientsCount();
});

function sendClientsCount(){
	io.emit('clientsCount', io.engine.clientsCount);
}

function sendNames(){
	io.emit('names', Object.values(names));
}

server.listen((process.env.PORT || 80));