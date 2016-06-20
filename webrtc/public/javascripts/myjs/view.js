var filename;
var path;
var page=1;
var file = new Array();
var image = new Array();


function refresh()
{
	image[page] = canvas_down.toDataURL("image/png");
	content = {data:path,roomId:roomID};
	socket.emit("filepath",content);
	content = {data:page,roomId:roomID,image:image};
    socket.emit("page",content);
    content = {data:file,roomId:roomID};
    socket.emit("pdflist",content);
}

function showimage()
{     
	var show_image = new Image();  
    show_image.onload = function()
    {
    	context_down.drawImage(show_image,0,0);
    }
    show_image.src=image[page];
}

function saveimage()
{
	image[page] = canvas_down.toDataURL("image/png");
	context_up.closePath();
    context_down.closePath();
    context_down.clearRect(0,0,width,height);
    context_up.clearRect(0,0,width,height);
}

function changehost()
{
	if(changehostBtn.value == "主讲人")
    {
    	$("#drawBtn").show();
        changehostBtn.value = "听众";
        // socket.emit('isHost',1);
        // alert("you are host");
        // isForbitScroll(1);
    }
    else if(changehostBtn.value == "听众")
    {
        $("#drawBtn").hide();
        changehostBtn.value = "主讲人";
        // socket.emit('isHost',0);
        // alert("you are not host");
        // draw('forbit');//////////////////////////////
        // isForbitScroll(0);
    }
}

function hidepdflist()
{
	$("#pdflist").toggle("clip",400);
    $("#sendfile").hide();
}

function showpdfbyname(fileName)
{

	page=1;
	context_up.closePath();
    context_down.closePath();
    context_down.clearRect(0,0,width,height);
    context_up.clearRect(0,0,width,height);
	image = new Array();
	roomID = Request("roomId");
	filename=fileName;
	path='/storeUpload/'+roomID+'/'+filename+"#page="+page;
	alert(path);
	content = {data:path,roomId:roomID};
    socket.emit("filepath",content);
    content = {data:page,roomId:roomID,image:image};
    socket.emit("page",content);
    $("#pdf").remove();
    var add="<embed  id='pdf' onmousewheel='return false' onscroll='return false' width='1250px' height='1130px' name='plugin' src='"+path+"' type='application/pdf' >";
    $(".pdf").append(add);
    $("#pdflist").hide();
    $("#sendfile").hide();
    $(".pdfBtn").show();
}

$(document).ready(function()
{
	$("#next").click(function(){
		saveimage();
		$("#pdf").remove();
		page=page+1;
		path="/storeUpload/"+roomID+"/"+filename+"#page="+page;
		// path="/"+roomID+"/"+filename;
		content = {data:path,roomId:roomID};
		socket.emit("filepath",content);
		content = {data:page,roomId:roomID,image:image};
		socket.emit("page",content);
		var add="<embed  id='pdf' onmousewheel='return false' onscroll='return false' width='1250px' height='1130px' name='plugin' src='"+path+"' type='application/pdf' >";
		$(".pdf").append(add);
		showimage();
	});

	$("#last").click(function(){
		saveimage();
		$("#pdf").remove();
		if(page>1)
		{
			page=page-1;
		}
		else
		{
			alert("本页是第一页");
		}
		path="/storeUpload/"+roomID+"/"+filename+"#page="+page;
		content = {data:path,roomId:roomID};
		socket.emit("filepath",content);
		content = {data:page,roomId:roomID,image:image};
		socket.emit("page",content);
		var add="<embed  id='pdf' onmousewheel='return false' onscroll='return false' width='1250px' height='1130px' name='plugin' src='"+path+"' type='application/pdf' >";
		$(".pdf").append(add);
		showimage();
	});

})