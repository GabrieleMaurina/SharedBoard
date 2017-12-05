const MAX_MSG_LENGTH = 300;
const MAX_NAME_LENGTH = 20;
const MAX_ROOM_LENGTH = 10;

const CHAT_LINES = 10;

const MSG_PER_SEC = 20;

const WIDTH = 2000;
const HEIGHT = 2000;

const LINE_WIDTH = 4;

var canvas = document.getElementById('canvas');

var X_RATIO = 1;
var Y_RATIO = 1;
var ctx = null;

canvas.width = WIDTH;
canvas.height = HEIGHT;

ctx = canvas.getContext('2d');
ctx.lineWidth = LINE_WIDTH;

function resizeCanvas(){
	X_RATIO = window.innerWidth / WIDTH;
	Y_RATIO = window.innerHeight / HEIGHT;

	canvas.style.width = window.innerWidth;
	canvas.style.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener('resize', resizeCanvas);

var lines = [];
var drawing = false;
var p = { x : 0, y : 0};
var lP = p;

canvas.addEventListener('mousedown', function (e) {
	fucusCanvas();
	drawing = true;
	p = getMousePos(e);
	lP = p;
	point(p);
	lines.push([p]);
}, false);

canvas.addEventListener('mouseup', function (e) {
	drawing = false;
	point(p);
}, false);

canvas.addEventListener('mousemove', function (e) {
	if(drawing)
	{
		pTmp = getMousePos(e);
		if (p.x != pTmp.x || p.y != pTmp.y)
		{
			lP = p;
			p = pTmp;
			line(lP, p);
			
			if(lines.length > 0) {
				lines[lines.length - 1].push(p);
			}
			else {
				lines.push([lP, p]);
			}
		}
	}
}, false);

function getMousePos(e) {
	var rect = canvas.getBoundingClientRect();
	return { x: Math.round((e.clientX - rect.left) / X_RATIO), y: Math.round((e.clientY - rect.top) / Y_RATIO) };
}

canvas.addEventListener('touchstart', function (e) {
	var mouseEvent = new MouseEvent('mousedown', {
		clientX: e.touches[0].clientX,
		clientY: e.touches[0].clientY
	});
	canvas.dispatchEvent(mouseEvent);
}, false);

canvas.addEventListener('touchend', function (e) {
	var mouseEvent = new MouseEvent('mouseup', {});
	canvas.dispatchEvent(mouseEvent);
}, false);

canvas.addEventListener('touchmove', function (e) {
	var touch = e.touches[0];
	var mouseEvent = new MouseEvent('mousemove', {
		clientX: touch.clientX,
		clientY: touch.clientY
	});
	canvas.dispatchEvent(mouseEvent);
}, false);

document.body.addEventListener('touchstart', function (e) {
	if (e.target == canvas) {
		e.preventDefault();
	}
}, false);

document.body.addEventListener('touchend', function (e) {
	if (e.target == canvas) {
		e.preventDefault();
	}
}, false);

document.body.addEventListener('touchmove', function (e) {
	if (e.target == canvas) {
		e.preventDefault();
	}
}, false);



var socket = io.connect(ADDRESS);
socket.on('lines', function(lines){
	for (i in lines) {
		for(var j = 0; j < lines[i].length - 1; j++) {
			line(lines[i][j], lines[i][j + 1]);
		}
		if(lines[i].length > 0) {
			point(lines[i][0]);
			point(lines[i][lines[i].length - 1]);
		}
	}
});

function sendLines(){
	var toSend = lines;
	lines = [];
	if(toSend.length > 0){
		socket.emit('lines', toSend);
	}
}

(function msgLoop () {
	window.setTimeout(msgLoop, 1000 / MSG_PER_SEC);
	sendLines();
})();



function point(p)
{
	ctx.fillRect(p.x - LINE_WIDTH / 2, p.y - LINE_WIDTH / 2, LINE_WIDTH, LINE_WIDTH);
}

function line(p0, p1)
{
	ctx.moveTo(p0.x, p0.y);
	ctx.lineTo(p1.x, p1.y);
	ctx.stroke();
}



var chatText = document.getElementById('chat_text');
var chatInput = document.getElementById('chat_input');
chatInput.style.display = 'none';
var typing = false;
var chatLines = [];

document.onkeyup = function(e) {
	if(typing){
		if (e.key == 'Enter'){
			submitChat();
		}
		else if (e.key == 'Escape'){
			hideChat();
		}
	}
	else if(naming){
		if (e.key == 'Enter' || e.key == 'Escape'){
			submitName();
		}
	}
	else if(rooming){
		if (e.key == 'Enter'){
			submitRoom();
		}
		else if (e.key == 'Escape'){
			hideRoom();
		}
	}
	else{
		if (e.key == 'c' || e.key == 'C'){
			clearScreen();
		}
		else if (e.key == 'Enter'){
			showChat();
		}
		else if (e.key == 'n' || e.key == 'N'){
			showName();
		}
		else if (e.key == 'r' || e.key == 'R'){
			showRoom();
		}
	}
};

function hideChat(){
	typing = false;
	chatInput.style.display = 'none';
}

function submitChat(){
	hideChat();
	if(chatInput.value != ''){
		socket.emit('msg', stripTags(chatInput.value));
	}
	chatInput.value = '';
}

function showChat(){
	typing = true;
	chatInput.style.display = 'initial';
	chatInput.focus();
}

function displayChatText(){
	chatText.innerHTML = chatLines.join('<br>');
}

socket.on('msg', function(msg){
	if(msg != ''){
		msg = stripTags(msg);
		if(msg.length > MAX_MSG_LENGTH){
			msg = msg.substr(0, MAX_MSG_LENGTH);
		}
		chatLines.push(msg);
		if(chatLines.length > CHAT_LINES){
			chatLines.splice(0, 1);
		}
		displayChatText();
	}
});

function clearScreen(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	
	chatLines = [];
	displayChatText();
	
	roomsInput.value = '';
}

function stripTags(str){
	var div = document.createElement("div");
	div.innerHTML = str;
	str = div.textContent || div.innerText || "";
	div.remove();
	return str;
}

var clientsCountText = document.getElementById('clients_count');

socket.on('clientsCount', function(clientsCount){
	clientsCountText.innerHTML = 'Clients: ' + clientsCount;
});

const NAME_COOKIE = 'name';

var namesText = document.getElementById('names');
var nameInput = document.getElementById('name_input');

var name =  Cookies.get(NAME_COOKIE, true);
if(name != ''){
	nameInput.value = name;
	submitName();
}

nameInput.style.display = 'none';
var naming = false;
var name = '';

socket.on('names', function(names){
	namesText.innerHTML = names.slice(0, 10).join('<br>');
});

function showName(){
	naming = true;
	nameInput.style.display = 'initial';
	nameInput.focus();
}

function submitName(){
	naming = false;
	nameInput.style.display = 'none';
	nameInput.blur();
	
	var newName = nameInput.value;
	newName = stripTags(newName);
	if(newName.length > MAX_NAME_LENGTH){
		newName = newName.substr(0, MAX_NAME_LENGTH);
	}
	
	if(newName != name){
		name = newName;
		socket.emit('name', name);
		Cookies.set(NAME_COOKIE, name, {expiry : 60 * 60 * 24 * 365});
	}
}

function fucusCanvas(){
	if(typing){
		hideChat();
	}
	if(naming){
		submitName();
	}
}

var room = stripTags(window.location.pathname.replace('/', ''));
socket.emit('join', room);
document.title = 'SharedBoard - ' + (room || 'HOME');

var roomsTitle = document.getElementById('rooms_title');
var roomsInstruction = document.getElementById('rooms_instruction');
var roomsInput = document.getElementById('rooms_input');
roomsInstruction.style.display = 'none';
roomsInput.style.display = 'none';
roomsTitle.innerHTML = room || 'HOME';
var rooming = false;

function submitRoom(){
	rooming = false;
	roomsInstruction.style.display = 'none';
	roomsInput.style.display = 'none';
	
	var newRoom = roomsInput.value;
	newRoom = stripTags(newRoom);
	if(newRoom.length > MAX_ROOM_LENGTH){
		newRoom = newRoom.substr(0, MAX_ROOM_LENGTH);
	}
	
	if(newRoom != 'admin' && newRoom != room){
		room = newRoom;
		socket.emit('join', room);
		window.history.pushState('', '', '/' + room);
		roomsTitle.innerHTML = room || 'HOME';
		document.title = 'SharedBoard - ' + (room || 'HOME');
		clearScreen();
	}
}

function showRoom(){
	rooming = true;
	roomsInstruction.style.display = 'initial';
	roomsInput.style.display = 'initial';
	roomsInput.focus();
}

function hideRoom(){
	rooming = false;
	roomsInstruction.style.display = 'none';
	roomsInput.style.display = 'none';
}