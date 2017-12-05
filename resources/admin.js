var clientsList = document.getElementById('clients_list');
var roomsList = document.getElementById('rooms_list');

var socket = io.connect(ADDRESS);

socket.emit('admin');

socket.on('update', function(clients){
	var rooms = [];
	
	var clientsHTML = '';
	var roomsHTML = '';
	
	for(i in clients){
		clientsHTML += '<tr><td>' + clients[i].name + '</td><td>' + clients[i].ip + '</td><td>' + clients[i].room + '</td></tr>';
		if(rooms[clients[i].room]){
			rooms[clients[i].room].clientsCount++;
		}
		else{
			rooms[clients[i].room] = {};
			rooms[clients[i].room].clientsCount = 1;
		}
	}
	for(i in rooms){
		roomsHTML += '<tr><td>' + i + '</td><td>' + rooms[i].clientsCount + '</td></tr>';
	}
	
	clientsList.innerHTML = clientsHTML;
	roomsList.innerHTML = roomsHTML;
});
	
