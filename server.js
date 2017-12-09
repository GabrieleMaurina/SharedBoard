const CLAIMED = 0;
const UNCLAIMED = 1;
const MINE = 2;

const MAX_MSG_LENGTH = 300;
const MAX_NAME_LENGTH = 20;
const MAX_ROOM_LENGTH = 10;

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var striptags = require('striptags');
var Mongoose = require('mongoose');
var Update = require('./mongoose/update.js');

Mongoose.Promise = global.Promise;
Mongoose.connect('mongodb://admin:admin@ds135186.mlab.com:35186/sharedboard', { useMongoClient: true }).then(
    function() { console.log('DB connected successfully!'); },
    function(err){ console.error('Error while connecting to DB: ' + err.message); }
);

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
var claims = {};

io.on('connect', function(socket){
	socket.on('admin', function(){
		join(socket, 'admin');
	});
	
	socket.on('join', function(room){
		room = striptags(room);
		if(room.length > MAX_ROOM_LENGTH){
			room = room.substr(0, MAX_MSG_LENGTH);
		}
		if(room != 'admin'){
			join(socket, room);
			if(claims[room]){
				socket.emit('claim', CLAIMED);
			}
			else{
				socket.emit('claim', UNCLAIMED);
			}
			Update.find({room : room}).sort('date').select('data').exec(function(err, res){
				var lines = [];
				for(i in res){
					lines = lines.concat(res[i].data);
				}
				if(lines.length > 0){
					socket.emit('lines', lines);
				}
			});
		}
	});
	
	socket.on('claim', function(lines){
		var r = Object.keys(socket.rooms)[0];
		if(r){
			if(claims[r]){
				if(claims[r] == socket.id){
					delete claims[r];
					io.sockets.in(r).emit('claim', UNCLAIMED);
				}
			}
			else{
				io.in(r).clients(function(err, clients){
					if(clients.length == 1 && clients[0] == socket.id){
						claims[r] = socket.id;
						socket.emit('claim', MINE);
					}
				});
			}
		}
	});
	
	socket.on('clear', function(room){
		var r = Object.keys(socket.rooms)[0];
		var admin = false;
		
		if(room != undefined){
			r = room;
			admin = true;
		}
		
		if(admin || !claims[r] || claims[r] == socket.id){
			socket.broadcast.to(r).emit('clear');
			Update.remove({room : r}).exec(sendUpdate);
		}
	});
	
	socket.on('lines', function(lines){
		var r = Object.keys(socket.rooms)[0];
		if(!claims[r] || claims[r] == socket.id){
			socket.broadcast.to(r).emit('lines', lines);
			
			var u = new Update({room : r, type : 'lines', data : lines});
			u.save(sendUpdate);
		}
	});
	
	socket.on('updateCursor', function(cursor){
		cursor.id = socket.id;
		cursor.name = socket.name;
		socket.broadcast.to(Object.keys(socket.rooms)[0]).emit('updateCursor', cursor);
	});
	
	socket.on('msg', function(msg){
		if(msg != ''){
			msg = striptags(msg);
			if(msg.length > MAX_MSG_LENGTH){
				msg = msg.substr(0, MAX_MSG_LENGTH);
			}
			var name = socket.name || 'Unknown';
			io.sockets.in(Object.keys(socket.rooms)[0]).emit('msg', name + ': ' + msg);
		}
	});
	
	socket.on('name', function(name){
		name = striptags(name);
		if(name.length > MAX_NAME_LENGTH){
			msg = msg.substr(0, MAX_NAME_LENGTH);
		}
		
		if(socket.name != name){
			socket.name = name;
			if(name == ''){
				delete socket.name;
			}
			sendNames(Object.keys(socket.rooms)[0]);
			socket.broadcast.to(Object.keys(socket.rooms)[0]).emit('updateCursor', {name : name, id : socket.id});
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
		io.sockets.in(lastRoom).emit('removeCursor', socket.id);
		if(claims[lastRoom] == socket.id){
			delete claims[lastRoom];
			io.sockets.in(lastRoom).emit('claim', UNCLAIMED);
		}
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
			var name = io.sockets.connected[clients[i]].name;
			if(name){
				names.push(name);
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
	var update = {};
	var clients = [];
	var mongo = [];
	
	for(i in io.sockets.connected){
		var c = {};
		c.name = io.sockets.connected[i].name || '';
		c.ip = (io.sockets.connected[i].handshake.headers['x-forwarded-for'] || io.sockets.connected[i].handshake.address).replace('::ffff:', '');
		c.room = Object.keys(io.sockets.connected[i].rooms)[0];
		clients.push(c);
	}
	
	Update.aggregate([{$group: {_id: '$room', documents: {$sum: 1}}}]).exec(function(err, res){
		for(i in res){
			mongo.push({room : res[i]._id, documents : res[i].documents});
		}
		
		update.clients = clients;
		update.mongo = mongo;
		
		io.in('admin').emit('update', update);
	});
}

server.listen(process.env.PORT || 80);