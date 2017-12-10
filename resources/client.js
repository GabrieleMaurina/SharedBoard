const CLAIMED = 0;
const UNCLAIMED = 1;
const MINE = 2;

const CLAIM_STATES = ['(claimed)', '', '(mine)'];

const LEFT = 1;
const RIGHT = 3;

const IDS = {CHAT : 'chat', TITLE : 'title', ROOMS : 'rooms', CLIENTS : 'clients', PALETTE : 'palette', CLEAR : 'clear', HELP : 'help'};

const COLORS = ['#000000', '#7F7F7F', '#880015', '#ED1C24', '#FF8927', '#FFF200', '#22B14C', '#00A2E8', '#3F48CC', '#A349AE', '#FFFFFF'];
const C_NAMES = { BLACK : 0, GRAY : 1, DARK_RED : 2, RED : 3, ORANGE : 4, YELLOW : 5, GREEN : 6, LIGHT_BLUE : 7, BLUE : 8, PURPLE : 9, WHITE : 10 };

const MAX_MSG_LENGTH = 300;
const MAX_NAME_LENGTH = 20;
const MAX_ROOM_LENGTH = 10;

const CHAT_LINES = 10;

const MSG_PER_SEC = 20;

const WIDTH = 2000;
const HEIGHT = 2000;

const LINE_WIDTH = 10;

const CURSOR_WIDTH = 32;
const HALF_CURSOR_WIDTH = CURSOR_WIDTH / 2;

var canvas = document.getElementById('canvas');
canvas.oncontextmenu = function (e) {
    e.preventDefault();
};

var X_RATIO = 1;
var Y_RATIO = 1;
var ctx = null;

var eles = {};
for(key in IDS){
	eles[key] = document.getElementById(IDS[key]);
}
var desktop = true;
if('ontouchstart' in window){
	desktop = false;
	for(i in eles){
		eles[i].style.pointerEvents = 'all';
		eles[i].style.zIndex = 1;
	}
	document.getElementById('key_bindings').style.display = 'none';
	document.getElementById('keys_list').style.display = 'none';
}
else{
	eles.CLEAR.style.display = 'none';
}

canvas.width = WIDTH;
canvas.height = HEIGHT;

ctx = canvas.getContext('2d');
ctx.lineWidth = LINE_WIDTH;

function resizeCanvas(){
	X_RATIO = window.innerWidth / WIDTH;
	Y_RATIO = window.innerHeight / HEIGHT;

	canvas.style.width = window.innerWidth;
	canvas.style.height = window.innerHeight;
	
	makeCursor(color);
	if(window.innerWidth < 600){
		eles.CHAT.style.bottom = '50px';
		eles.CLEAR.style.bottom = '50px';
	}
	else{
		eles.CHAT.style.bottom = '0px';
		eles.CLEAR.style.bottom = '0px';
	}
}

resizeCanvas();

window.addEventListener('resize', resizeCanvas);

var lines = [];
var drawing = false;
var p = { x : 0, y : 0};
var lP = p;
var mousePos = p;
var lastMousePos = mousePos;
var lastMouseColor = C_NAMES.WHITE;

var lastColor = C_NAMES.WHITE;
var beforeWhite = C_NAMES.WHITE;

var mouseButton = 0;

canvas.addEventListener('mousedown', function (e) {
	focusCanvas();
	if(claimed){
		mouseButton = e.which;
		
		if(e.which == RIGHT){
			highlight(C_NAMES.WHITE);
		}
		else if(e.which == LEFT){
			highlight(beforeWhite);
		}
		
		drawing = true;
		p = getMousePos(e);
		lP = p;
		
		if(lastColor != color){
			p.color = color;
			lastColor = color;
		}
		
		point(p, color);
		
		lines.push([p]);
	}
}, false);

canvas.addEventListener('mouseup', function (e) {
	if(claimed){
		if(mouseButton == e.which){
			mouseButton = 0;
			
			drawing = false;
			point(p, color);
			
			if(e.which == RIGHT){
				highlight(beforeWhite);
			}
		}
	}
}, false);

canvas.addEventListener('mousemove', function (e) {
	mousePos = getMousePos(e);
	if(claimed){
		if(drawing)
		{
			pTmp = mousePos;
			if (p.x != pTmp.x || p.y != pTmp.y)
			{
				lP = p;
				p = pTmp;
				
				if(lastColor != color){
					p.color = color;
					lastColor = color;
				}
				
				line(lP, p, color);
				point(p, color);
				
				if(lines.length > 0) {
					lines[lines.length - 1].push(p);
				}
				else {
					lines.push([lP, p]);
				}
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
	var c = C_NAMES.BLACK;
	for (i in lines) {
		for(var j = 0; j < lines[i].length - 1; j++) {
			if(lines[i][j].color != undefined){
				c = lines[i][j].color;
			}
			point(lines[i][j], c);
			line(lines[i][j], lines[i][j + 1], c);
		}
		
		if(lines[i].length > 0) {
			if(lines[i][j].color != undefined){
				c = lines[i][j].color;
			}
			point(lines[i][lines[i].length - 1], c);
		}
	}
});

function sendLines(){
	if(claimed){
		var toSend = lines;
		lines = [];
		if(toSend.length > 0){
			if(toSend[0][0].color == undefined){
				toSend[0][0].color = color;
			}
			socket.emit('lines', toSend);
		}
	}
}

(function msgLoop () {
	window.setTimeout(msgLoop, 1000 / MSG_PER_SEC);
	sendLines();
	sendCursor();
})();

function point(p, c)
{
	var width = Math.round(LINE_WIDTH * 0.8);
	
	ctx.fillStyle = COLORS[c];
	ctx.fillRect(p.x - width / 2, p.y - width / 2, width, width);
}

function line(p0, p1, c)
{
	ctx.strokeStyle = COLORS[c];
	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.lineTo(p1.x, p1.y);
	ctx.stroke();
	ctx.closePath();
}

var chatText = document.getElementById('chat_text');
var chatInput = document.getElementById('chat_input');
var typing = false;
hideChat();
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
	else if(helping){
		if (e.key == 'h' || e.key == 'H' || e.key == 'Enter' || e.key == 'Escape'){
			hideHelp();
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
		if (e.key == 'Backspace' || e.key == 'Delete'){
			clearScreen();
		}
		else if (e.key == 'c' || e.key == 'C'){
			claim();
		}
		else if (e.key == 'Enter'){
			showChat();
		}
		else if (e.key == 'h' || e.key == 'H'){
			showHelp();
		}
		else if (e.key == 'n' || e.key == 'N'){
			showName();
		}
		else if (e.key == 'r' || e.key == 'R'){
			showRoom();
		}
		else if (e.key == 'w' || e.key == 'W'){
			highlight((color + 1) % 10);
		}
	}
};

function hideChat(){
	typing = false;
	chatInput.style.display = 'none';
	eles.CHAT.style.zIndex = desktop ? -1 : 1;
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
	eles.CHAT.style.zIndex = 2;
}

function chatClick(){
	if(typing){
		hideChat();
	}
	else{
		focusCanvas(IDS.CHAT);
		showChat();
	}
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

socket.on('clear', function(){
	clear();
});

function clearScreen(){
	if(claimed){
		socket.emit('clear');
		clear();
	}
}

function clear(){
	focusCanvas();
	
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
var naming = false;

var name =  Cookies.get(NAME_COOKIE, true);
if(name){
	nameInput.value = name;
	name = null;
}
submitName();

socket.on('names', function(names){
	namesText.innerHTML = names.slice(0, 10).join('<br>');
});

function showName(){
	naming = true;
	nameInput.style.display = 'initial';
	nameInput.focus();
	eles.CLIENTS.style.zIndex = 2;
}

function submitName(){
	naming = false;
	nameInput.style.display = 'none';
	nameInput.blur();
	eles.CLIENTS.style.zIndex = desktop ? -1 : 1;
	
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

function namesClick(){
	if(naming){
		submitName();
	}
	else{
		focusCanvas(IDS.CLIENTS);
		showName();
	}
}

function focusCanvas(id){
	if((!id || id != IDS.CHAT) && typing){
		hideChat();
	}
	if((!id || id != IDS.CLIENTS) && naming){
		submitName();
	}
	if((!id || id != IDS.HELP) && helping){
		hideHelp();
	}
	if((!id || id != IDS.ROOMS) && rooming){
		hideRoom();
	}
}

var room = stripTags(window.location.pathname.replace('/', ''));
socket.emit('join', room);
socket.on('reconnect', function(){
	socket.emit('join', room);
	out('Connected', 1000);
});
socket.on('disconnect', function(c){
	out('Disconnected', 1000);
});
document.title = 'SharedBoard - ' + (room || 'HOME');

var roomsTitle = document.getElementById('rooms_title');
var roomsInstruction = document.getElementById('rooms_instruction');
var roomsInput = document.getElementById('rooms_input');
var claimButton = document.getElementById('claim');
claimButton.style.display = 'none';

roomsTitle.innerHTML = room || 'HOME';
var rooming = false;
hideRoom();

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
		setRoomName();
		document.title = 'SharedBoard - ' + (room || 'HOME');
		clear();
		if(!desktop){
			claimButton.style.display = 'none';
		}
	}
}

function setRoomName(){
	roomsTitle.innerHTML = (room || 'HOME') + ' ' + CLAIM_STATES[claimed];
}

function showRoom(){
	rooming = true;
	roomsInstruction.style.display = 'initial';
	roomsInput.style.display = 'initial';
	roomsInput.focus();
	eles.ROOMS.style.zIndex = 2;
	
	if(!desktop){
		claimButton.style.display = 'initial';
	}
}

function hideRoom(){
	rooming = false;
	roomsInstruction.style.display = 'none';
	roomsInput.style.display = 'none';
	eles.ROOMS.style.zIndex = desktop ? -1 : 1;
	
	if(!desktop){
		claimButton.style.display = 'none';
	}
}

function roomsClick(){
	if(rooming){
		hideRoom();
	}
	else{
		focusCanvas(IDS.ROOMS);
		showRoom();
	}
}

var help = document.getElementById('help');
var helping = false;
showHelp();

function showHelp(){
	helping = true;
	help.style.display = 'initial';
	eles.HELP.style.zIndex = 2;
}
function hideHelp(){
	helping = false;
	help.style.display = 'none';
	eles.HELP.style.zIndex = desktop ? -1 : 1;
}

function helpClick(){
	if(helping){
		hideHelp();
	}
	else{
		focusCanvas(IDS.HELP);
		showHelp();
	}
}

var squares = [];
for(var i = 0; i < 10; i++){
	squares.push(document.getElementById('c' + i));
	squares[i].style.backgroundColor = COLORS[i];
	squares[i].style.border = '4px solid ' + COLORS[C_NAMES.WHITE];
}

var color = 1;
highlight(0);

function highlight(i){
	if(i != color){
		if(squares[color]){
			squares[color].style.border = '4px solid ' + COLORS[C_NAMES.WHITE];
		}
		color = i;
		if(color != C_NAMES.WHITE){
			beforeWhite = color;
		}
		if(squares[color]){
			squares[color].style.border = '4px solid ' + COLORS[color];
		}
		makeCursor(color);
	}
}

canvas.addEventListener('mousewheel', function (e) {
	if(e.wheelDelta > 0){
		highlight((color + 1) % 10);
	}
	else{
		highlight((color + 9) % 10);
	}
}, false);

function makeCursor(color) {
	canvas.style.cursor = 'url(' + createCursor(color) + ') ' + HALF_CURSOR_WIDTH + ' '  + HALF_CURSOR_WIDTH + ', auto';
}

var cursors = {};
var cursorsNames = {};
socket.on('updateCursor', function(cursor){
	var rect = canvas.getBoundingClientRect();
	
	if(!cursors[cursor.id]){
		var img = document.createElement('img');
		img.style.position = 'absolute';
		img.style.pointerEvents = 'none';
		img.style.zIndex = -1;
		
		document.body.appendChild(img);	
		cursors[cursor.id] = img;
	}
	if(!cursorsNames[cursor.id]){
		var name = document.createElement('label');
		name.style.position = 'absolute';
		name.style.transform = 'translate(-50%, 0)';
		
		name.style.pointerEvents = 'none';
		name.style.zIndex = -1;
		
		document.body.appendChild(name);
		cursorsNames[cursor.id] = name;
	}
	
	if(cursor.x){
		cursors[cursor.id].style.left = (cursor.x * X_RATIO + rect.left - HALF_CURSOR_WIDTH) + 'px';
		cursorsNames[cursor.id].style.left = (cursor.x * X_RATIO + rect.left) + 'px';
	}
	if(cursor.y){
		cursorsNames[cursor.id].style.top = (cursor.y * Y_RATIO + rect.top - CURSOR_WIDTH) + 'px';
		cursors[cursor.id].style.top = (cursor.y * Y_RATIO + rect.top - HALF_CURSOR_WIDTH) + 'px';
	}
	if(cursor.color != undefined){
		cursors[cursor.id].src = createCursor(cursor.color);
		cursorsNames[cursor.id].style.color = COLORS[cursor.color];
	}
	cursorsNames[cursor.id].innerHTML = cursor.name || 'Unknown';
});

socket.on('removeCursor', function(cursorId){
	if(cursors[cursorId]){
		cursors[cursorId].outerHTML = '';
		delete cursors[cursorId];
	}
	if(cursorsNames[cursorId]){
		cursorsNames[cursorId].outerHTML = '';
		delete cursorsNames[cursorId];
	}
});

function sendCursor(){
	if(mousePos.x != lastMousePos.x || mousePos.y != lastMousePos.y || color != lastMouseColor)
	{
		lastMousePos = mousePos;
		lastMouseColor = color;
		socket.emit('updateCursor', { x : mousePos.x, y : mousePos.y, color : color});
	}
}

function createCursor(c){	
	var can = document.createElement('canvas');
	var ctx = can.getContext('2d');
	
	can.width = CURSOR_WIDTH;
	can.height = CURSOR_WIDTH;
	
	ctx.fillStyle = COLORS[c];
	
	ctx.fillRect(HALF_CURSOR_WIDTH - LINE_WIDTH * X_RATIO / 2, HALF_CURSOR_WIDTH - LINE_WIDTH * Y_RATIO / 2, LINE_WIDTH * X_RATIO, LINE_WIDTH * Y_RATIO);
	
	return can.toDataURL();
}

var claimed = UNCLAIMED;

function claim(){
	if(room){
		socket.emit('claim');
	}
}

socket.on('claim', function(c){
	claimed = c;
	setRoomName();
});

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

out(TIPS[Math.floor(Math.random() * TIPS.length)], 3000);