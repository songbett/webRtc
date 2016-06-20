var width = 1250;
var height = 1130;
var x_down;
var y_down;
var x_up;
var y_up;
var x_move;
var y_move;
var canvas_up;
var canvas_down;
var context_up;
var context_down;
var rubber = false;
//var socket = io.connect("https://125.216.251.189:3011");
// var socket = io.connect("https://116.56.129.233:3011");
var socket = io.connect("https://192.168.3.1:3000");
var body = document.getElementById("body");
var roomID ;
var content;
var isWriteboard =0;
var hasHistoryColor = 0;
var historyColor = "";


function scroll()
{
	if(isWriteboard == 1)
	{
		content = {data:body.scrollLeft,roomId:roomID};
        socket.emit('body_x', content);
        content = {data:body.scrollTop,roomId:roomID};
        socket.emit('body_y', content);
    }
}

function Request(strName)
{
    var strHref = document.location.href;
    var intPos = strHref.indexOf("?");
    var strRight = strHref.substr(intPos + 1);
    var arrTmp = strRight.split("&");
    for(var i = 0; i < arrTmp.length; i++ ) 
    {
        var arrTemp = arrTmp[i].split("=");
        if(arrTemp[0].toUpperCase() == strName.toUpperCase()) return arrTemp[1];
    }
    return 0;
}

function addcanvas()
{
    alert("101");
	isWriteboard = 1;
	roomID = Request("roomId");
	content = {data:true,roomId:roomID};
	socket.emit("addcanvas",content);
	$(".topSlideVideoBtn").hide();
	$(".topSlideWriteboardBtn").show();
	$(".header").hide();
	$("#chatContent").hide();
	$(".pdf-file").hide();
	$(".myVedio").hide();
    var add = "<canvas id='canvas_up' style='border:1px solid #c3c3c3'></canvas>";
    add = add+"<canvas id='canvas_down' style='border:1px solid #c3c3c3'></canvas>";
    $(".writeboard").append(add);
    init();

}
// 初始化画布
function init()
{

	document.getElementById('body').style.height = height.toString()+"px";
    canvas_up = document.getElementById("canvas_up");
    canvas_up.width = width;
    canvas_up.height = height;
    context_up = canvas_up.getContext("2d");
    canvas_down = document.getElementById("canvas_down");
    canvas_down.width = width;
    canvas_down.height = height;
    context_down = canvas_down.getContext("2d");
    document.getElementById('color').onchange = function()
	{
		historyColor = document.getElementById("color").value;
		content = {color:historyColor,roomId:roomID};
		socket.emit("color",content);
    }
    context_up.strokeStyle = historyColor;
    context_down.strokeStyle = historyColor;
}

// 涂鸦
function pencil(color)
{
	canvas_down.onmousedown = function(e)
	{
		var e = e || window.event;
		x_down = e.clientX;
		y_down = e.clientY;
		content = {data:x_down,roomId:roomID};
		socket.emit('pencli_x_down', content);
		content = {data:y_down,roomId:roomID};
        socket.emit('pencil_y_down', content);
		context_down.beginPath();
		if(historyColor == "")
		{
			historyColor = 'black';
		}
		else
		{
			if(color == null)
			{
				color = historyColor;
			}
			historyColor = color;
		}
        context_down.strokeStyle = historyColor;
        context_up.strokeStyle = historyColor;
		document.getElementById('color').onchange = function(){
			pencil(document.getElementById("color").value);
			var Color_color = document.getElementById("color").value;
			content = {color:Color_color,roomId:roomID};
		    socket.emit("color",content);
		    document.getElementById("color").value = Color_color;
		}
		context_down.moveTo(x_down-canvas_down.offsetLeft+body.scrollLeft,y_down-canvas_down.offsetTop+body.scrollTop);
		document.onmousemove = function(e)
		{
			var e = e || window.event;
			x_move = e.clientX;
			y_move = e.clientY;
			content = {data:x_move,roomId:roomID};
			socket.emit('pencil_x_move', content);
			content = {data:y_move,roomId:roomID};
            socket.emit('pencil_y_move', content);
			context_down.lineTo(x_move-canvas_down.offsetLeft+body.scrollLeft,y_move-canvas_down.offsetTop+body.scrollTop);
			context_down.stroke();
		}
		document.onmouseup = function(e)
		{
			document.onmousemove = null;
            document.onmouseup = null;
		}
	}
}

// 圆形
function circle(color)
{
	canvas_down.onmousedown = function(e)
	{
		var e = e || window.event;
		x_down = e.clientX;
		y_down = e.clientY;
		content = {data:x_down,roomId:roomID};
		socket.emit('circle_x_down',content);
		content = {data:y_down,roomId:roomID};
        socket.emit('circle_y_down',content);
		if(historyColor == "")
		{
			historyColor = 'black';
		}
		else
		{
			if(color == null)
			{
				color = historyColor;
			}
			historyColor = color;
		}
        context_up.strokeStyle = historyColor;
        context_down.strokeStyle = historyColor;
		document.getElementById('color').onchange = function(){
			// context_down.strokeStyle = this.value.toString();
			circle(document.getElementById("color").value);
			var Color_color = document.getElementById("color").value;
			content = {color:Color_color,roomId:roomID};
		    socket.emit("color",content);
		    document.getElementById("color").value = Color_color;
		}
		document.onmousemove = function(e)
		{
			context_up.clearRect(0,0,width,height);
			context_up.beginPath();
			var e = e || window.event;
			x_move = e.clientX;
			y_move = e.clientY;
			content = {data:x_move,roomId:roomID};
			socket.emit('circle_x_move',content);
			content = {data:y_move,roomId:roomID};
            socket.emit('circle_y_move',content);
			context_up.arc(x_down-canvas_up.offsetLeft+body.scrollLeft,y_down-canvas_up.offsetTop+body.scrollTop,x_move-x_down,0,Math.PI*2,false);
			context_up.closePath();
			context_up.stroke();
		}
		document.onmouseup = function(e)
		{
			var e = e || window.event;
			x_up = e.clientX;
			y_up = e.clientY;
			content = {data:x_up,roomId:roomID};
			socket.emit('circle_x_up', content);
			content = {data:y_up,roomId:roomID};
            socket.emit('circle_y_up', content);
			context_down.beginPath();
			context_down.arc(x_down-canvas_down.offsetLeft+body.scrollLeft,y_down-canvas_down.offsetTop+body.scrollTop,x_move-x_down,0,Math.PI*2,false);
			context_down.stroke();
			context_down.closePath();
			document.onmousemove = null;
			document.onmouseup = null;
		}
	}
}

// 矩形
function square(color)
{
	canvas_down.onmousedown = function(e)
	{
		var e = e || window.event;
		x_down = e.clientX;
		y_down = e.clientY;
		content = {data:x_down,roomId:roomID};
		socket.emit('square_x_down', content);
		content = {data:y_down,roomId:roomID};
        socket.emit('square_y_down', content);
        if(historyColor == "")
		{
			historyColor = 'black';
		}
		else
		{
			if(color == null)
			{
				color = historyColor;
			}
			historyColor = color;
		}
        context_up.strokeStyle = historyColor;
        context_down.strokeStyle = historyColor;

		document.getElementById('color').onchange = function(){
			// context_down.strokeStyle = this.value.toString();
			square(document.getElementById("color").value);
			var Color_color = document.getElementById("color").value;
			content = {color:Color_color,roomId:roomID};
		    socket.emit("color",content);
		    document.getElementById("color").value = Color_color;
		}
		document.onmousemove = function(e)
		{
			context_up.clearRect(0,0,width,height);
			context_up.beginPath();
			context_up.moveTo(x_down-canvas_up.offsetLeft+body.scrollLeft,y_down-canvas_up.offsetTop+body.scrollTop);
			var e = e || window.event;
			x_move = e.clientX;
			y_move = e.clientY;
			content = {data:x_move,roomId:roomID};
			socket.emit('square_x_move', content);
			content = {data:y_move,roomId:roomID};
            socket.emit('square_y_move', content);
			context_up.lineTo(x_move-canvas_up.offsetLeft+body.scrollLeft,y_down-canvas_up.offsetTop+body.scrollTop);
			context_up.lineTo(x_move-canvas_up.offsetLeft+body.scrollLeft,y_move-canvas_up.offsetTop+body.scrollTop);
			context_up.lineTo(x_down-canvas_up.offsetLeft+body.scrollLeft,y_move-canvas_up.offsetTop+body.scrollTop);
			context_up.lineTo(x_down-canvas_up.offsetLeft+body.scrollLeft,y_down-canvas_up.offsetTop+body.scrollTop);
			context_up.closePath();
			context_up.stroke();
		}
		document.onmouseup = function(e)
		{
			var e = e || window.event;
			x_up = e.clientX;
			y_up = e.clientY;
			content = {data:x_up,roomId:roomID};
			socket.emit('square_x_up', content);
			content = {data:y_up,roomId:roomID};
            socket.emit('square_y_up', content);
			context_down.beginPath();
			context_down.moveTo(x_down-canvas_up.offsetLeft+body.scrollLeft,y_down-canvas_up.offsetTop+body.scrollTop);
            context_down.lineTo(x_up-canvas_up.offsetLeft+body.scrollLeft,y_down-canvas_up.offsetTop+body.scrollTop);
            context_down.lineTo(x_up-canvas_up.offsetLeft+body.scrollLeft,y_up-canvas_up.offsetTop+body.scrollTop);
            context_down.lineTo(x_down-canvas_up.offsetLeft+body.scrollLeft,y_up-canvas_up.offsetTop+body.scrollTop);
            context_down.lineTo(x_down-canvas_up.offsetLeft+body.scrollLeft,y_down-canvas_up.offsetTop+body.scrollTop);
			context_down.stroke();
			context_down.closePath();
			document.onmousemove = null;
			document.onmouseup = null;
		}
	}
}

// 线条
function line(color)
{
	canvas_down.onmousedown = function(e)
	{
		var e = e || window.event;
		x_down = e.clientX;
		y_down = e.clientY;
		content = {data:x_down,roomId:roomID};
		socket.emit('line_x_down', content);
		content = {data:y_down,roomId:roomID};
        socket.emit('line_y_down', content);
        if(historyColor == "")
		{
			historyColor = 'black';
		}
		else
		{
			if(color == null)
			{
				color = historyColor;
			}
			historyColor = color;
		}
        context_up.strokeStyle = historyColor;
        context_down.strokeStyle = historyColor;

		document.getElementById('color').onchange = function(){
			// context_down.strokeStyle = this.value.toString();
			line(document.getElementById("color").value);
			var Color_color = document.getElementById("color").value;
			content = {color:Color_color,roomId:roomID};
		    socket.emit("color",content);
		    document.getElementById("color").value = Color_color;
		}
		document.onmousemove = function(e)
		{
			context_up.clearRect(0,0,width,height);
			context_up.beginPath();
			context_up.moveTo(x_down-canvas_up.offsetLeft+body.scrollLeft,y_down-canvas_up.offsetTop+body.scrollTop);
			var e = e || window.event;
			x_move = e.clientX;
			y_move = e.clientY;
			content = {data:x_move,roomId:roomID};
			socket.emit('line_x_move', content);
			content = {data:y_move,roomId:roomID};
            socket.emit('line_y_move', content);
			context_up.lineTo(x_move-canvas_up.offsetLeft+body.scrollLeft,y_move-canvas_up.offsetTop+body.scrollTop); 
			context_up.closePath();
			context_up.stroke();
		}
		document.onmouseup = function(e)
		{
			var e = e || window.event;
			x_up = e.clientX;
			y_up = e.clientY;
			content = {data:x_up,roomId:roomID};
			socket.emit('line_x_up', content);
			content = {data:y_up,roomId:roomID};
            socket.emit('line_y_up', content);
			context_down.beginPath();
			context_down.moveTo(x_down-canvas_up.offsetLeft+body.scrollLeft,y_down-canvas_up.offsetTop+body.scrollTop);
            context_down.lineTo(x_up-canvas_up.offsetLeft+body.scrollLeft,y_up-canvas_up.offsetTop+body.scrollTop);
			context_down.stroke();
			context_down.closePath();
			document.onmousemove = null;
			document.onmouseup = null;
		}
	}
}

// 白板
function writeboard()
{
	context_up.closePath();
    context_down.closePath();
    context_down.clearRect(0,0,width,height);
    context_up.clearRect(0,0,width,height);
    content = {data:true,roomId:roomID};
    socket.emit("rubber",content);
}

function exitWriteboard()
{
	content = {data:false,roomId:roomID};
	socket.emit("addcanvas",content);
	$(".topSlideVideoBtn").show();
	$(".topSlideWriteboardBtn").hide();
	$(".header").show();
	$(".remoteContains").show();
    $("#pdf").remove();
    $("#canvas_up").remove();
    $("#canvas_down").remove();
    $(".myVedio").show();
    $("#pdflist").hide();
    $(".pdfBtn").hide();
    isWriteboard = 0;
}