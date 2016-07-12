/*
 ???????? __setInviteChat
 */
var querystring=require("qs");
var redisManager=require('../database/redisManager.js').getRedisManager();
var hbaseManager=require('../database/hbaseManager.js').getHbaseManager();
var SessionRecord = require('../database/SessionRecord.js');




function chatManager(){

}


chatManager.prototype.onechatListen= function (RTCServer) {
    var errorCb = function(rtc)
    {
        return function(error) {
            if (error) {
                rtc.emit("error", error);
            }
        };
    };

    RTCServer.on('__setInviteChat', function (data,socket) {
        var that=this;
        var chatInvitation={"sender":socket.id,"receiver":data.socketId}; //发送者与接受者通过socketId辨别
        //储存进缓存
        that.ChatManager.setChatInvite(chatInvitation, function (result) {
            if(result==="success"){
                //通知邀请者开始连接
                socket.send(JSON.stringify({
                    "eventName":"_beginConnect",
                    "data":data.socketId   //被邀请者的socketId
                }),errorCb);
            }
            var receiver=that.roomSockets[data.socketId];   //被邀请者的socketId
            if(receiver){
                //通知被邀请者开始连接
                receiver.send(JSON.stringify({"eventName":"_getInviteChat","data":socket.id}),errorCb);
            }
        });
    });

    RTCServer.on('one_record', function (data,socket) {
        var that=this;
        var ntime=new Date().getTime();
        var json=querystring.parse(data);
        var record={recordId:json.id+ntime,sender:json.sender,message:json.msg,time:json.time};
        that.ChatManager.saverecord(record);
    });

    //???????????????????
    RTCServer.on('get_oneRecord', function(data, socket){
        var that=this;
        var json = querystring.parse(data);
        that.ChatManager.getMessages(json.SRId,function(messages)
        {
            var data = {"msg":messages,"id":json.id};
            socket.send(JSON.stringify({"eventName":"one_messageRecord","data":data}));
        });
    });

    RTCServer.on('__vedioInvitation',function(data,socket){
        var that = this;
        //console.log('__vedioInvitation  '+data.socketId);
        var soc = that.roomSockets[data.socketId];
        if (soc) {
            soc.send(JSON.stringify({
                "eventName": "_vedioInvitation",
                "data": {
                    "userId":data.userId,
                    "senderSocketId":socket.id,
                    "socketId":data.socketId}
            }), errorCb);
        }
    });

    RTCServer.on('__vedioInvitationRefuse',function(data,socket){
        //data.socketId为邀请者，data.Id为委邀请者
        console.log("拒绝");
        console.log(data);
        var that = this;
        //console.log('__vedioInvitationRefuse  '+data.socketId);
        var soc = that.roomSockets[data.socketId];
        console.log("拒绝socket");
        console.log(soc);
        if (soc) {
            soc.send(JSON.stringify({
                "eventName": "_vedioInvitationRefuse",
                "data": {
                    "userId":data.userId,
                    "socketId":data.socketId,
                    "Id":data.Id}
            }), errorCb);
        }
    });

    //????????????????
    RTCServer.on('record', function(data, socket){
        console.log("record");
        var json = querystring.parse(data);
        var time = new Date().getTime();
        var record=new SessionRecord(json.roomId+"-"+time+"-"+json.sender,json.msg,json.time);
        RTCServer.ChatManager.save(record);
    });

    //???????????????????
    RTCServer.on('getRecord', function(data, socket){
        var json = querystring.parse(data);
        RTCServer.ChatManager.getMeetingMessages(json.roomId,function(messages)
        {
            socket.send(JSON.stringify({"eventName":"messageRecord","data":messages}));
        });

    });


};




//保存缓存
chatManager.prototype.setChatInvite=function(data,callback){
    redisManager.setOneChatInvite(data, function (success) {
        if(success){
            callback("success");
        }
    });
};

chatManager.prototype.getMessages= function (SRId,callback) {
    hbaseManager.getOneChatRecord(SRId,callback)
};



chatManager.prototype.saverecord= function (record) {
    hbaseManager.saveOneChatRecord(record);
};


chatManager.prototype.save=function(record)
{
    hbaseManager.save(record);
};

chatManager.prototype.getMeetingMessages=function(roomId,callback)
{
    hbaseManager.getMessages(roomId,callback);
};

exports.getChatManager= function () {
    var ChatManager=new chatManager();
    return ChatManager;
};



