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
	var dir = true;
	var switched = false;
	var rows = table.getElementsByTagName("TR");
	
	for(var k = 0; k < 2; k++){
		for(var i = 0; i < rows.length - 1; i++){
			for(var j = i + 1; j < rows.length; j++){
				var first = rows[i].getElementsByTagName("TD")[column].innerHTML.toLowerCase();
				var second = rows[j].getElementsByTagName("TD")[column].innerHTML.toLowerCase();
				if ((dir && first > second)	|| (!dir && first < second)){
					switchRows(rows, i, j);
					switched = true;
				}
			}
		}
		if(dir && switched){
			k++;
		}
		dir = false;
	}
}

function switchRows(rows, i, j){
	var parentNode = rows[i].parentNode;
	parentNode.insertBefore(rows[j], rows[i]);
	parentNode.insertBefore(rows[i + 1], rows[j]);
}