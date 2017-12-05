const WEB_SERVER_ADDRESS = 'https://sharedboardgm.herokuapp.com';//'localhost';//

var clientsList = document.getElementById('clients_list');
var roomsList = document.getElementById('rooms_list');

var socket = io.connect(WEB_SERVER_ADDRESS);

socket.emit('admin');

socket.on('update', function(update){
	var clients = update.clients;
	var rooms = update.rooms;
	
	var clientsHTML = '';
	var roomsHTML = '';
	
	for(i in clients){
		clientsHTML += '<tr><td>' + clients[i].name + '</td><td>' + clients[i].ip + '</td><td>' + clients[i].room + '</td></tr>';
	}
	for(i in rooms){
		roomsHTML += '<tr><td>' + rooms[i].name + '</td><td>' + rooms[i].clientsCount + '</td></tr>';
	}
	
	clientsList.innerHTML = clientsHTML;
	roomsList.innerHTML = roomsHTML;
});