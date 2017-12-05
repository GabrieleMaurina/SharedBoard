var clientsTitle = document.getElementById('clients_title');
var roomsTitle = document.getElementById('rooms_title');
var clientsList = document.getElementById('clients_list');
var roomsList = document.getElementById('rooms_list');

var socket = io.connect(ADDRESS);

socket.emit('admin');

socket.on('update', function(clients){
	var rooms = [];
	
	var clientsHTML = '';
	var roomsHTML = '';
	
	for(i in clients){
		clientsHTML += '<tr><td>' + clients[i].name + '</td><td>' + clients[i].ip + '</td><td><a href="' + (clients[i].room || ADDRESS) + '">' + (clients[i].room || 'HOME') + '</a></td></tr>';
		if(rooms[clients[i].room]){
			rooms[clients[i].room].clientsCount++;
		}
		else{
			rooms[clients[i].room] = {};
			rooms[clients[i].room].clientsCount = 1;
		}
	}
	for(i in rooms){
		roomsHTML += '<tr><td><a href="' + (i || ADDRESS) + '">' + (i || 'HOME') + '</a></td><td>' + rooms[i].clientsCount + '</td></tr>';
	}
	
	clientsTitle.innerHTML = 'Clients ' + clients.length;
	roomsTitle.innerHTML = 'Rooms ' + Object.keys(rooms).length;
	clientsList.innerHTML = clientsHTML;
	roomsList.innerHTML = roomsHTML;
});
	
