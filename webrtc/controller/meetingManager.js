var hbaseManager=require('../database/hbaseManager.js').getHbaseManager();
var redisManager=require('../database/redisManager.js').getRedisManager();
var querystring=require("qs");
var redis=require("redis");
var conf=require('../config.js');
var redisPort = conf.redisPort;
var redisHost = conf.redisHost;



function meetingManager(){

}

meetingManager.prototype.meetingListen= function (RTCServer) {
    var errorCb = function(rtc)
    {
        return function(error) {
            if (error) {
                rtc.emit("error", error);
            }
        };
    };

    RTCServer.on('__ice_candidate', function (data,socket) {
        var json=querystring.parse(data);
        var receiver=this.roomSockets[json.socketId];
        if(receiver){
            receiver.send(JSON.stringify({
                "eventName":"_ice_candidate",
                "data":{
                    "label":data.label,
                    "candidate":data.candidate,
                    //这里socket是邀请者
                    "socketId":socket.id
                }
            }),errorCb);
        }
    });

    RTCServer.on('__offer', function (data,socket) {
        var json=querystring.parse(data);
        var receiver=this.roomSockets[json.socketId];
        if(receiver){
            receiver.send(JSON.stringify({
                "eventName":"_offer",
                "data":{
                    "sdp":json.sdp,
                    "socketId":socket.id
                }
            }),errorCb);
        }
        this.emit('offer',socket,data);
    });

    RTCServer.on('__answer', function(data, socket) {
        var json = querystring.parse(data);
        var sender = this.roomSockets[json.socketId];
        if (sender) {
            sender.send(JSON.stringify({
                "eventName": "_answer",
                "data": {
                    "sdp": data.sdp,
                    "socketId": socket.id
                }
            }), errorCb);
            this.emit('answer', socket, data);
        }
    });

    //监听_join事件(需要解决同时加入问题)
    RTCServer.on('__join', function (data, socket) {
        var that = this;
        //获取房间或房间初始化
        {
            var json = querystring.parse(data);
            var curRoom;
            var roomId = json.roomId;
            var userId = json.userId;
            socket.room = roomId;
        }
        //相互告知，进入加入会议，并最后加入房间
        {
                redisManager.getAllUserSocketId(roomId,function(socketIds){
                //告知已在房间内的用户新加入用户的信息
                var info = {userId: userId, socketId: socket.id};
                var eventName = '_new_peer';
                for(var i = 0;i < socketIds.length;i++)
                {
                    //console.log("第"+i+"个socketid"+socketIds[i]);
                    if(socketIds[i] == socket.id)
                    {
                        continue;
                    }
                    that.roomSockets[socketIds[i]].send(JSON.stringify({
                        eventName:eventName,
                        data:info
                    }));
                }
                //告知新加入的用户房间内的信息
                if(socketIds.length>=1) {
                        redisManager.getUserIdSocketId(roomId, function (uidsid) {
                        var eventName = '_peers';
                        var infos = [];
                        for (var i = 0; i < socketIds.length; i++) {
                            if (socketIds[i] == socket.id) {
                                continue;
                            }
                            var info = {userId: uidsid[socketIds[i]], socketId: socketIds[i]};
                            infos.push(JSON.stringify(info));
                            console.log(infos);
                        }
                        socket.send(JSON.stringify({
                            eventName:eventName,
                            data:infos
                        }));
                    });
                }
                redisManager.addMember(roomId,socket.id,userId);
                that.roomSockets[socket.id]=socket;
            });
        }
    });

    RTCServer.on('__remove',function(data,socket){
        var that = this;
        var json = querystring.parse(data);
        var soc = this.roomSockets[json.socketId];
        console.log("踢人");
        if(soc)
        {
            soc.send(JSON.stringify({
                "eventName": "_be_removed",
                "data": {
                    "socketId": socket.id
                }
            }), errorCb);
        }
    });

};


//需要提出redis的函数
meetingManager.prototype.generateRoom = function (req, res) {
    //var room_Id=0;
    redisManager.createRoom(function (success,roomId) {
        console.log("创建房间号"+roomId);
        //room_Id=roomId;
        console.log("要保存"+roomId+"主持人");
        redisManager.setRoomManager(roomId,req.session.user.userId);
        //hbasemanager保存主持人
        hbaseManager.saveRoomAndHost(req.session.user.userId,roomId);
        res.send({'success':success,'roomId':roomId});
    });

};

meetingManager.prototype.joinRoom = function (req, res) {
   redisManager.joinRoom(req,res);
};


exports.getMeetingManager= function () {
    var MeetingManager=new meetingManager();
    return MeetingManager;
};





