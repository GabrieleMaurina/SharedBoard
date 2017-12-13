var clientsTitle = document.getElementById('clients_title');
var roomsTitle = document.getElementById('rooms_title');
var mongoTitle = document.getElementById('mongo_title');
var clientsList = document.getElementById('clients_list');
var roomsList = document.getElementById('rooms_list');
var mongoList = document.getElementById('mongo_list');

var div = document.getElementById('tables_div');

function resize(){
	if(window.innerWidth < 800){
		div.style.display = 'inline';
	}
	else{
		div.style.display = 'flex';
	}
}
resize();
window.addEventListener('resize', resize);

var socket = io.connect(ADDRESS);

socket.emit('admin');
socket.on('reconnect', function(){
	socket.emit('admin');
	out('Connected', 1000);
});
socket.on('disconnect', function(c){
	out('Disconnected');
});

socket.on('update', function(update){
	var clients = update.clients;
	var mongo = update.mongo;
	var rooms = [];
	
	var clientsHTML = '';
	var roomsHTML = '';
	var mongoHTML = '';
	
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
	
	for(i in mongo){
		mongoHTML += '<tr><td><a href="' + (mongo[i].room || ADDRESS) + '">' + (mongo[i].room || 'HOME') + '</a></td><td>' + mongo[i].documents + '</td><td>' + mongo[i].lastUpdate + '</td><td onclick=\'drop("' + mongo[i].room + '")\' id="clickable"><font color="#ED1C24">DROP</font></td></tr>';
	}
	
	clientsTitle.innerHTML = 'Clients ' + clients.length;
	roomsTitle.innerHTML = 'Online Rooms ' + Object.keys(rooms).length;
	mongoTitle.innerHTML = 'Mongo Rooms ' + mongo.length;
	
	clientsList.innerHTML = clientsHTML;
	roomsList.innerHTML = roomsHTML;
	mongoList.innerHTML = mongoHTML;
	
	sortTable(clientsList, 2);
	sortTable(roomsList, 0);
	sortTable(mongoList, 1, false);
});

function sortTable(table, column, dir){
	if(dir == undefined){
		dir = true;
	}
	var switched = false;
	var rows = table.getElementsByTagName("TR");
	
	for(var k = 0; k < 2; k++){
		for(var i = 0; i < rows.length - 1; i++){
			for(var j = i + 1; j < rows.length; j++){
				var first = rows[i].getElementsByTagName("TD")[column].innerHTML.toLowerCase();
				var second = rows[j].getElementsByTagName("TD")[column].innerHTML.toLowerCase();
				
				first = Number(first) || first;
				second = Number(second) || second;
				
				if ((dir && first > second)	|| (!dir && first < second)){
					switchRows(rows, i, j);
					switched = true;
				}
			}
		}
		if(k == 0 && switched){
			k++;
		}
		dir = !dir;
	}
}

function switchRows(rows, i, j){
	var parentNode = rows[i].parentNode;
	parentNode.insertBefore(rows[j], rows[i]);
	parentNode.insertBefore(rows[i + 1], rows[j]);
}

function drop(room){
	console.log('asdf');
	socket.emit('clear', room);
}

var msg = document.getElementById('msg');
var msgCounter = 0;
function out(m, t){
	msg.innerHTML = m;
	msgCounter++;
	if(t){
		var id = msgCounter;
		window.setTimeout(function(){
			if(id == msgCounter){
				msg.innerHTML = '';
			}
		}, t);
	}
}

var titleDiv = document.getElementById('title_div');
var homeLink = document.createElement("a");
homeLink.href = ADDRESS;
homeLink.innerHTML = 'HOME';
titleDiv.appendChild(homeLink);
titleDiv.appendChild(document.createElement("br"));
titleDiv.appendChild(document.createElement("br"));