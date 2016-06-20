var UserManager=require('./UserManager.js');
var ChatManager=require('./chatManager.js');
var InvitationManager=require("./InvitationManager.js");
var meetingManager=require("./meetingManager.js");
var fileManager=require("./FileManager.js");
var redis=require("redis");
var RedisSessions=require("redis-sessions");
var conf=require('../config.js');
var redisPort = conf.redisPort;
var redisHost = conf.redisHost;
var rs=new RedisSessions({host:redisHost,port:redisPort});
var redisManager=require('../database/redisManager.js').getRedisManager();
var util=require('util');
var events=require("events");
/*
var clients = [];
var users = [];
*/

util.inherits(RtcServer,events.EventEmitter); //原型继承node的event事件触发

var errorCb= function (rtc) {
  return function (error) {
      if(error){
          rtc.emit("error",error);
      }
  }
};





function RtcServer(){
    this.userManager=new UserManager.getUserManager();
    this.InvitationManager=new InvitationManager.getInvitationManager();
    this.InvitationManager.invitationListener(this);
    this.ChatManager=new ChatManager.getChatManager();
    this.ChatManager.onechatListen(this);
    this.MettingManager=new meetingManager.getMeetingManager();
    this.MettingManager.meetingListen(this);
    this.FileManager=new fileManager.getFileManager();
    this.FileManager.FileListen(this);
    //保存房间的成员socket
    this.roomSockets={};



}


RtcServer.prototype.init= function (socket) {
    //console.log(this);
    var that=this;
    socket.on('message', function (data) {
        var json=JSON.parse(data);
        console.log(data);
        that.emit(json.eventName,json.data,socket);
    });

    socket.on('disconnect', function () {
        console.log(socket.id+"断开连接");
        that.removeSocket(socket);
    });

    socket.on('line_x_down', function(content) {
            socket.broadcast.emit('line_x_down', content);//这个是传递给除发送方外的其他人
        });
        socket.on('line_y_down', function(content) {
            socket.broadcast.emit('line_y_down', content);//这个是传递给除发送方外的其他人
        });
        //广播鼠标移动的数据
        socket.on('line_x_move', function(content) {
            socket.broadcast.emit('line_x_move', content);//这个是传递给除发送方外的其他人
        });
        socket.on('line_y_move', function(content) {
            socket.broadcast.emit('line_y_move', content);//这个是传递给除发送方外的其他人
        });
        //广播鼠标起来的数据
        socket.on('line_x_up', function(content) {
            socket.broadcast.emit('line_x_up', content);//这个是传递给除发送方外的其他人
        });
        socket.on('line_y_up', function(content) {
            socket.broadcast.emit('line_y_up', content);//这个是传递给除发送方外的其他人
        });
        /*****************************************************************************/
        socket.on('circle_x_down', function(content) {
            socket.broadcast.emit('circle_x_down', content);//这个是传递给除发送方外的其他人
        });
        socket.on('circle_y_down', function(content) {
            socket.broadcast.emit('circle_y_down', content);//这个是传递给除发送方外的其他人
        });
        //广播鼠标移动的数据
        socket.on('circle_x_move', function(content) {
            socket.broadcast.emit('circle_x_move', content);//这个是传递给除发送方外的其他人
        });
        socket.on('circle_y_move', function(content) {
            socket.broadcast.emit('circle_y_move', content);//这个是传递给除发送方外的其他人
        });
        //广播鼠标起来的数据
        socket.on('circle_x_up', function(content) {
            socket.broadcast.emit('circle_x_up', content);//这个是传递给除发送方外的其他人
        });
        socket.on('circle_y_up', function(content) {
            socket.broadcast.emit('circle_y_up', content);//这个是传递给除发送方外的其他人
        });
        /***************************************************************************/
        socket.on('pencil_x_down', function(content) {
            socket.broadcast.emit('pencil_x_down', content);//这个是传递给除发送方外的其他人
        });
        socket.on('pencil_y_down', function(content) {
            socket.broadcast.emit('pencil_y_down', content);//这个是传递给除发送方外的其他人
        });
        //广播鼠标移动的数据
        socket.on('pencil_x_move', function(content) {
            socket.broadcast.emit('pencil_x_move', content);//这个是传递给除发送方外的其他人
        });
        socket.on('pencil_y_move', function(content) {
            socket.broadcast.emit('pencil_y_move', content);//这个是传递给除发送方外的其他人
        });
        /***************************************************************************/
        socket.on('square_x_down', function(content) {
            socket.broadcast.emit('square_x_down', content);//这个是传递给除发送方外的其他人
        });
        socket.on('square_y_down', function(content) {
            socket.broadcast.emit('square_y_down', content);//这个是传递给除发送方外的其他人
        });
        //广播鼠标移动的数据
        socket.on('square_x_move', function(content) {
            socket.broadcast.emit('square_x_move', content);//这个是传递给除发送方外的其他人
        });
        socket.on('square_y_move', function(content) {
            socket.broadcast.emit('square_y_move', content);//这个是传递给除发送方外的其他人
        });
        //广播鼠标起来的数据
        socket.on('square_x_up', function(content) {
            socket.broadcast.emit('square_x_up', content);//这个是传递给除发送方外的其他人
        });
        socket.on('square_y_up', function(content) {
            socket.broadcast.emit('square_y_up', content);//这个是传递给除发送方外的其他人
        });
        socket.on('rubber',function(content)
        {
            socket.broadcast.emit('rubber',content);
        });
        //处理滚动的坐标
        socket.on('body_x',function(content)
        {
            socket.broadcast.emit('body_x',content);
        });
        socket.on('body_y',function(content)
        {
            socket.broadcast.emit('body_y',content);
        });
        socket.on('page',function(content){
            socket.broadcast.emit('page',content);
        });
        socket.on('filepath',function(content){
            socket.broadcast.emit('filepath',content);
        });

        socket.on("addcanvas",function(content){
            socket.broadcast.emit('addcanvas',content);
            console.log("111");
        });

        socket.on("pdflist",function(content){
            socket.broadcast.emit("pdflist",content);
        });

        socket.on("color",function(content){
            socket.broadcast.emit("color",content);
            console.log(content.color);
        });


};


RtcServer.prototype.broadcastToOnline= function (eventName,info) {
    var that=this;
    for(var socketId in that.roomSockets){
        //执行socket.send
        //后端的socket.send发送数据给前端的socket.on('message')接收，反过来，前端的socket.send发送的数据也会给后端的socket.on('message')接收
        that.roomSockets[socketId].send(JSON.stringify({
            eventName:eventName,
            data:info
        }));
        console.log(eventName);
       //that.roomSockets[socketId].broadcast.emit(eventName,info);
    }
};

//在Room内发送消息
RtcServer.prototype.broadcastInRoom = function (eventName,roomId,socketId,userId)
{
    var that = this;
    redisManager.getAllUserSocketId(roomId,function(socketIds){
        //告知已在房间内的用户新加入用户的信息
        console.log("房间里有"+socketIds.length+"人");
        redisManager.setUserOffLine(roomId,socketId);
        for(var i = 0;i < socketIds.length;i++)
        {

            that.roomSockets[socketIds[i]].send(JSON.stringify({
                eventName:eventName,
                socketId:socketId,
                userId:userId
            }));
            console.log("传给房间的每个人告诉他们"+userId+"退出会议");
        }

    });

};



//感觉没处理完全
RtcServer.prototype.removeSocket= function (socket) {
    var that=this;
    var roomId =socket.room;
    if(roomId){

        if(roomId==='Index'){
            //设置邀请过期还没写
            redisManager.getOnlineUserId('Index',socket.id, function (err,value) {
                userId=value;

                console.log(userId+"退出大房间.socket为"+socket.id);
                redisManager.setUserOffLine('Index',socket.id);
                delete  that.roomSockets[socket.id];
                that.broadcastToOnline('_someone_logout',socket.id,userId);
            });

        }
        else{

            console.log(roomId+socket.id);
            redisManager.getOnlineUserId(roomId,socket.id, function (err,value) {
                userId=value;
                console.log(userId+"退出"+roomId+"房间");

                delete  that.roomSockets[socket.id];
                redisManager.isManager(roomId,userId, function (temp) {
                    if(temp){
                        //管理员退出
                        console.log(userId+"管理员退出视频聊天");
                        that.broadcastInRoom('_manager_logout',roomId,socket.id,userId);
                    }
                    else{
                        //非管理员退出
                        console.log(userId+"退出视频聊天");
                        that.broadcastInRoom('_someone_logoutroom',roomId,socket.id,userId);
                    }
                });
            });
        }
    }
};


module.exports.listen= function (server) {
    var io=require("socket.io").listen(server,{log:false});
    var rtc=new RtcServer();
    io.sockets.on('connection', function (socket) {
        console.log("socket connect");
        rtc.init(socket);
    });

};