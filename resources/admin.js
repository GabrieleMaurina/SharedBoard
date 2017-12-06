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
	
	sortTable(clientsList, 2);
	sortTable(roomsList, 0);
});

function sortTable(table, column){
	var switching = true;
	var shouldSwitch = false;
	var dir = true;
	var switched = false;
	while (switching) {
		shouldSwitch = false;
		switching = false;
		rows = table.getElementsByTagName("TR");
		for (i = 0; i < rows.length - 1; i++) {
			shouldSwitch = false;
			x = rows[i].getElementsByTagName("TD")[column];
			y = rows[i + 1].getElementsByTagName("TD")[column];
			if (dir) {
				if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()){
					shouldSwitch = true;
					break;
				}
			}
			else if (!dir) {
				if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()){
					shouldSwitch = true;
					break;
				}
			}
		}
		if (shouldSwitch) {
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
			switched = true;
		}
		else {
			if (!switched && dir) {
				dir = false;
				switching = true;
			}
		}
	}
}