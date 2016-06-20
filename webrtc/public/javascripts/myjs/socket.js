var body_x=0;
var body_y=0;


// socket.on('isWriteboard',function(content){
//     if(content.roomId==roomId)
//     {
//         isWriteboard=1;
//     }
// });

socket.on("color",function(content){
    if(content.roomId==roomID)
    {
        context_up.strokeStyle = content.color;
        context_down.strokeStyle = content.color;
        document.getElementById("color").value = content.color;
    }
});

socket.on('body_x',function(content){
    if(content.roomId==roomID)
	{
        body_x = content.data;
    }
});
socket.on('body_y',function(content){
    if(content.roomId==roomID)
	{
        body_y = content.data;
	    window.scrollTo(body_x,body_y);
    }
});


var pencil_x_downs;
var pencil_y_downs;
var pencil_x_moves;
var pencil_y_moves;
socket.on('pencil_x_down',function(content){
    if(content.roomId==roomID)
    {
        pencil_x_downs = content.data;
    }
});
socket.on('pencil_y_down',function(content){
    if(content.roomId==roomID)
	{
        pencil_y_downs = content.data;
        context_down.beginPath();
        context_down.moveTo(pencil_x_downs-canvas_down.offsetLeft+body_x,pencil_y_downs-canvas_down.offsetTop+body_y);
    }
});
socket.on('pencil_x_move',function(content){
    if(content.roomId==roomID)
	{
        pencil_x_moves = content.data;
    }
});
socket.on('pencil_y_move',function(content){
    if(content.roomId==roomID)
	{
        pencil_y_moves = content.data;
	    context_down.lineTo(pencil_x_moves-canvas_down.offsetLeft+body_x,pencil_y_moves-canvas_down.offsetTop+body_y);
        context_down.stroke();
    }
});


var circle_x_downs;
var circle_y_downs;
var circle_x_ups;
var circle_y_ups;
var circle_x_moves;
var circle_y_moves;
socket.on('circle_x_down',function(content){
    if(content.roomId==roomID)
	{
        circle_x_downs = content.data;
    }
});
socket.on('circle_y_down',function(content){
    if(content.roomId==roomID)
    {
        circle_y_downs = content.data;
    }
});
socket.on('circle_x_move',function(content){
    if(content.roomId==roomID)
	{
        circle_x_moves = content.data;
    }
});
socket.on('circle_y_move',function(content){
    if(content.roomId==roomID)
	{
        circle_y_moves = content.data;
	    context_up.clearRect(0,0,width,height);
        context_up.beginPath();
        context_up.arc(circle_x_downs-canvas_down.offsetLeft+body_x,circle_y_downs-canvas_down.offsetTop+body_y,circle_x_moves-circle_x_downs,0,Math.PI * 2,false);
        context_up.closePath();
        context_up.stroke();
    }
});
socket.on('circle_x_up',function(content){
    if(content.roomId==roomID)
	{
        circle_x_ups = content.data;
    }
});
socket.on('circle_y_up',function(content){
    if(content.roomId==roomID)
	{
        circle_y_ups = content.data;
	    context_down.beginPath();
        context_down.arc(circle_x_downs-canvas_down.offsetLeft+body_x,circle_y_downs-canvas_down.offsetTop+body_y,circle_x_ups-circle_x_downs,0,Math.PI * 2,false);
        context_down.stroke();
        context_down.closePath();
        document.onmousemove = null;
        document.onmouseup = null;
    }
});


var square_x_downs;
var square_y_downs;
var square_x_ups;
var square_y_ups;
var square_x_moves;
var square_y_moves;
socket.on('square_x_down',function(content){
    if(content.roomId==roomID)
	{
        square_x_downs = content.data;
    }
});
socket.on('square_y_down',function(content){
    if(content.roomId==roomID)
	{
        square_y_downs = content.data;
    }
});
socket.on('square_x_move',function(content){
    if(content.roomId==roomID)
	{
        square_x_moves = content.data;
    }
});
socket.on('square_y_move',function(content){
    if(content.roomId==roomID)
	{
        square_y_moves = content.data;
	    context_up.clearRect(0,0,width,height);
        context_up.beginPath();
        context_up.moveTo(square_x_downs-canvas_down.offsetLeft+body_x,square_y_downs-canvas_down.offsetTop+body_y);
        context_up.lineTo(square_x_moves-canvas_down.offsetLeft+body_x,square_y_downs-canvas_down.offsetTop+body_y); 
        context_up.lineTo(square_x_moves-canvas_down.offsetLeft+body_x,square_y_moves-canvas_down.offsetTop+body_y);   
        context_up.lineTo(square_x_downs-canvas_down.offsetLeft+body_x,square_y_moves-canvas_down.offsetTop+body_y);
        context_up.lineTo(square_x_downs-canvas_down.offsetLeft+body_x,square_y_downs-canvas_down.offsetTop+body_y);
        context_up.stroke();
        context_up.closePath();
    }

});
socket.on('square_x_up', function(content) {
    if(content.roomId==roomID)
	{
        square_x_ups = content.data;
    }
});
socket.on('square_y_up', function(content) {
    if(content.roomId==roomID)
	{
        square_y_ups = content.data;
        context_down.beginPath();
        context_down.moveTo(square_x_downs-canvas_up.offsetLeft+body_x,square_y_downs-canvas_up.offsetTop+body_y);
        context_down.lineTo(square_x_ups-canvas_up.offsetLeft+body_x,square_y_downs-canvas_up.offsetTop+body_y);
        context_down.lineTo(square_x_ups-canvas_up.offsetLeft+body_x,square_y_ups-canvas_up.offsetTop+body_y);
        context_down.lineTo(square_x_downs-canvas_up.offsetLeft+body_x,square_y_ups-canvas_up.offsetTop+body_y);
        context_down.lineTo(square_x_downs-canvas_up.offsetLeft+body_x,square_y_downs-canvas_up.offsetTop+body_y);
        context_down.stroke();
        context_down.closePath();
    }
});


var line_x_downs;
var line_y_downs;
var line_x_ups;
var line_y_ups;
var line_x_moves;
var line_y_moves;
socket.on('line_x_down', function(content) {
    if(content.roomId==roomID)
    {
        line_x_downs = content.data;
    }
});
socket.on('line_y_down', function(content) {
    if(content.roomId==roomID)
	{   
        line_y_downs = content.data;
    }
});
socket.on('line_x_move', function(content) {
    if(content.roomId==roomID)
    { 
        line_x_moves = content.data;
    }
});
socket.on('line_y_move', function(content) {
    if(content.roomId==roomID)
    { 
        line_y_moves = content.data;
        context_up.clearRect(0,0,width,height);
        context_up.beginPath();
        context_up.moveTo(line_x_downs-canvas_down.offsetLeft+body_x,line_y_downs-canvas_down.offsetTop+body_y);
        context_up.lineTo(line_x_moves-canvas_down.offsetLeft+body_x,line_y_moves-canvas_down.offsetTop+body_y);     
        context_up.stroke();
        context_up.closePath();
    }
});
socket.on('line_x_up', function(content) {
    if(content.roomId==roomID)
    {
        line_x_ups = content.data;
    }
});
socket.on('line_y_up', function(content) {
    if(content.roomId==roomID)
    {
	    line_y_ups = content.data;
        context_down.beginPath();
        context_down.moveTo(line_x_downs-canvas_down.offsetLeft+body_x,line_y_downs-canvas_down.offsetTop+body_y);
        context_down.lineTo(line_x_ups-canvas_down.offsetLeft+body_x,line_y_ups-canvas_down.offsetTop+body_y);
        context_down.stroke();
        context_down.closePath();
    }
});


socket.on('rubber',function(content){
    if(content.roomId==roomID)
    {
        rubber = content.data;
        if(rubber === true)
        {
            context_up.closePath();
            context_down.closePath();
            context_down.clearRect(0,0,width,height);
            context_up.clearRect(0,0,width,height);
            rubber = false;
        }
        else
        {
            return false;
        }
    }
});

socket.on('filepath',function(content)
{
    
    if(roomID===content.roomId)
    {
       context_up.closePath();
       context_down.closePath();
       context_down.clearRect(0,0,width,height);
       context_up.clearRect(0,0,width,height);
       $("#pdf").remove();
        path = content.data;
        var add="<embed  id='pdf' onmousewheel='return false' onscroll='return false' width='1250px' height='1130px' name='plugin' src='"+path+"' type='application/pdf' >";
       $(".pdf").append(add);
       $(".pdfBtn").hide();
   }
});

socket.on('page',function(content){
    if(roomID===content.roomId)
    {
        image = content.image;
        page = content.data;
        showimage();
    }
});

socket.on('addcanvas',function(content){
    roomID = Request("roomId");
    if(content.roomId==roomID)
    {
        if(content.data===true&&isWriteboard==0)
        {
            isWriteboard = 1;
            $(".topSlideVideoBtn").hide();
            $(".topSlideWriteboardBtn").show();
            $(".header").hide();
            $(".remoteContains").hide();
            $("#chatContent").hide();
            $(".pdf-file").hide();
            $(".myVedio").hide();
            var add = "<canvas id='canvas_up' style='border:1px solid #c3c3c3'></canvas>";
            add = add+"<canvas id='canvas_down' style='border:1px solid #c3c3c3'></canvas>";
            $(".writeboard").append(add);
            init();
        }
        else if(content.data===false)
        {
            $(".topSlideVideoBtn").show();
            $(".topSlideWriteboardBtn").hide();
            $(".header").show();
            $("#pdf").remove();
            $("#canvas_up").remove();
            $("#canvas_down").remove();
            $(".myVedio").show();
            $("#pdflist").hide();
            $(".pdfBtn").hide();
            isWriteboard = 0;
        }
    }

});

socket.on("pdflist",function(content){
    if(content.roomId==roomID)
    {
        file = content.data;
    }
});