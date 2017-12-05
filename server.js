const MAX_MSG_LENGTH = 300;
const MAX_NAME_LENGTH = 20;

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var striptags = require('striptags');

app.use(express.static('resources'));

app.get('/admin', function(req, res) {
    res.sendFile(__dirname + '/resources/admin.html');
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/resources/client.html');
});

app.get('/:page', function(req, res) {
    res.sendFile(__dirname + '/resources/client.html');
});

var names = {};

io.on('connect', function(socket){
	socket.on('admin', function(){
		join(socket, 'admin');
	});
	
	socket.on('join', function(room){
		if(room != 'admin'){
			join(socket, room);
		}
	});
	
	socket.on('lines', function(lines){
		socket.broadcast.to(Object.keys(socket.rooms)[0]).emit('lines', lines);
	});
	
	socket.on('msg', function(msg){
		if(msg != ''){
			msg = striptags(msg);
			if(msg.length > MAX_MSG_LENGTH){
				msg = msg.substr(0, MAX_MSG_LENGTH);
			}
			var name = socket.nickname || 'Unknown';
			io.sockets.in(Object.keys(socket.rooms)[0]).emit('msg', name + ': ' + msg);
		}
	});
	
	socket.on('name', function(name){
		name = striptags(name);
		if(name.length > MAX_NAME_LENGTH){
			msg = msg.substr(0, MAX_NAME_LENGTH);
		}
		
		if(socket.nickname != name){
			socket.nickname = name;
			if(name == ''){
				delete socket.nickname;
			}
			sendNames(Object.keys(socket.rooms)[0]);
			sendUpdate();
		}
	});
	
	var lastRoom = '';
	socket.on('disconnecting', function(){
		lastRoom = Object.keys(socket.rooms)[0];
	});
	
	socket.on('disconnect', function(){
		sendNames(lastRoom);
		sendClientsCount(lastRoom);
		sendUpdate();
	});
});

function sendClientsCount(room){
	io.in(room).clients(function(err, clients){
		io.sockets.in(room).emit('clientsCount', clients.length);
	});
}

function sendNames(room){
	io.in(room).clients(function(err, clients){
		var names = [];
		for(i in clients){
			var nickname = io.sockets.connected[clients[i]].nickname;
			if(nickname){
				names.push(nickname);
			}
		}
		
		io.sockets.in(room).emit('names', names);
	});
}

function join(socket, room){
	var oldRoom = Object.keys(socket.rooms)[0];
	socket.join(room, function(){
		socket.leave(oldRoom, function(){
			sendNames(room);
			sendClientsCount(room);
			sendNames(oldRoom);
			sendClientsCount(oldRoom);
			
			sendUpdate();
		});
	});
}

function sendUpdate(){
	var clients = [];
	
	for(i in io.sockets.connected){
		var c = {};
		c.name = io.sockets.connected[i].nickname || '';
		c.ip = (io.sockets.connected[i].handshake.headers['x-forwarded-for'] || io.sockets.connected[i].handshake.address).replace('::ffff:', '');
		c.room = Object.keys(io.sockets.connected[i].rooms)[0];
		clients.push(c);
	}
		
	io.in('admin').emit('update', clients);
}

server.listen((process.env.PORT || 80));