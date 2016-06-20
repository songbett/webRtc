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
                    //����socket��������
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

    //����_join�¼�(��Ҫ���ͬʱ��������)
    RTCServer.on('__join', function (data, socket) {
        var that = this;
        //��ȡ����򷿼��ʼ��
        {
            var json = querystring.parse(data);
            var curRoom;
            var roomId = json.roomId;
            var userId = json.userId;
            socket.room = roomId;
        }
        //�໥��֪�����������飬�������뷿��
        {
                redisManager.getAllUserSocketId(roomId,function(socketIds){
                //��֪���ڷ����ڵ��û��¼����û�����Ϣ
                var info = {userId: userId, socketId: socket.id};
                var eventName = '_new_peer';
                for(var i = 0;i < socketIds.length;i++)
                {
                    //console.log("��"+i+"��socketid"+socketIds[i]);
                    if(socketIds[i] == socket.id)
                    {
                        continue;
                    }
                    that.roomSockets[socketIds[i]].send(JSON.stringify({
                        eventName:eventName,
                        data:info
                    }));
                }
                //��֪�¼�����û������ڵ���Ϣ
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
        console.log("����");
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


//��Ҫ���redis�ĺ���
meetingManager.prototype.generateRoom = function (req, res) {
    //var room_Id=0;
    redisManager.createRoom(function (success,roomId) {
        console.log("���������"+roomId);
        //room_Id=roomId;
        console.log("Ҫ����"+roomId+"������");
        redisManager.setRoomManager(roomId,req.session.user.userId);
        //hbasemanager����������
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





