const MSG_PER_SEC = 20;

const WIDTH = 2000;
const HEIGHT = 2000;

const LINE_WIDTH = 4;

var canvas = document.getElementById("canvas");

var X_RATIO = 1;
var Y_RATIO = 1;
var ctx = null;

canvas.width = WIDTH;
canvas.height = HEIGHT;

ctx = canvas.getContext("2d");
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

canvas.addEventListener("mousedown", function (e) {
	drawing = true;
	p = getMousePos(e);
	lP = p;
	point(p);
	lines.push([p]);
}, false);

canvas.addEventListener("mouseup", function (e) {
	drawing = false;
	point(p);
}, false);

canvas.addEventListener("mousemove", function (e) {
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

canvas.addEventListener("touchstart", function (e) {
	var mouseEvent = new MouseEvent("mousedown", {
		clientX: e.touches[0].clientX,
		clientY: e.touches[0].clientY
	});
	canvas.dispatchEvent(mouseEvent);
}, false);

canvas.addEventListener("touchend", function (e) {
	var mouseEvent = new MouseEvent("mouseup", {});
	canvas.dispatchEvent(mouseEvent);
}, false);

canvas.addEventListener("touchmove", function (e) {
	var touch = e.touches[0];
	var mouseEvent = new MouseEvent("mousemove", {
		clientX: touch.clientX,
		clientY: touch.clientY
	});
	canvas.dispatchEvent(mouseEvent);
}, false);

document.body.addEventListener("touchstart", function (e) {
	if (e.target == canvas) {
		e.preventDefault();
	}
}, false);

document.body.addEventListener("touchend", function (e) {
	if (e.target == canvas) {
		e.preventDefault();
	}
}, false);

document.body.addEventListener("touchmove", function (e) {
	if (e.target == canvas) {
		e.preventDefault();
	}
}, false);



var socket = io.connect('https://sharedboardgm.herokuapp.com/');//io.connect('localhost');//
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