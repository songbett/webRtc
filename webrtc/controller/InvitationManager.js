/*
 监听信令 __login __getInvitations
 */

var querystring=require("qs");
var redisManager=require('../database/redisManager.js').getRedisManager();
var hbaseManager=require('../database/hbaseManager.js').getHbaseManager();


function InvitationManager(){

}


InvitationManager.prototype.invitationListener= function (RTCServer) {
    var errorCb= function (rtc) {
        return function (error) {
            if(error){
                rtc.emit("error",error);
            }
        };
    };

    RTCServer.on('__login', function (data,socket) {
        var that=this;
        that.InvitationManager.addUser(data.roomId,socket.id,data.userId, function (oldsocket) {
            if(oldsocket){
                delete (that.roomSockets[oldsocket]);
                redisManager.updatesocket(data.roomId,data.userId,socket.id)
            }
            socket.room=data.roomId;
            that.roomSockets[socket.id]=socket;
           // console.log(socket.id);
            //console.log(that.roomSockets);
            that.broadcastToOnline('_someone_login',{userId:data.userId,socketId:socket.id});
        });
    });
    //如果存在oldsocket,就把舊的刪掉，没有oldsocket,就储存一遍，然后广播给其他用户

    RTCServer.on('__getInvitations', function (data, socket) {
        console.log('__getInvitations', data.socketId);
        var soc = this.roomSockets[data.socketId];
        console.log("soc"+soc);
        if (soc) {
            soc.send(JSON.stringify({
                "eventName": "_getInvitations",
                "data": ""
            }), errorCb);
        }
    });



};

InvitationManager.prototype.addUser= function (roomId,socketId,userId,callback) {
    redisManager.checksome(roomId,userId, function (value) {
        if(value["socketid"]){
            console.log("浏览器刷新");
            callback(value["socketid"]);
        }
        else{
            console.log("保存到redis的roomid-"+roomId+"-socketId-"+socketId+"-userId-"+userId);
            redisManager.addOnlineUser(roomId,socketId,userId, function (err,success) {
                if(err){
                    console.log(err+"保存redis错误");
                }
                callback();
            });
        }
    });

};

/*---操作数据库---*/
InvitationManager.prototype.setInvitation = function(req,res)
{
    var that = this;
    var date = new Date();
    var invitation = {
        invitationId:req.body['userId']+"-"+req.body['roomId']+"-"+date.getTime(),
        roomId:req.body['roomId'],
        senderId:req.body['senderId'],
        userId:req.body['userId'],
        invitationTime:req.body['invitationTime'],
        invitationOver:'0',
        invitationAccept:'0'
    };
    console.log("邀请来了1");

    hbaseManager.setInvitationTo(invitation,function(err){
        console.log("邀请来了2");
        console.log("err"+err);
        if(err)
        {
            res.send({'success':false});
        }
        console.log("邀请来了5");
        res.send({'success':true});
    });
    console.log("邀请来了6");

    res.send({'success':true});
};





InvitationManager.prototype.getInvitations = function(req,res)
{
    var that=this;
    console.log("有人邀请");
    hbaseManager.getInvitationsFrom(req.session.user.userId,function(err,values){
        console.log("err"+err);
        if(err)
        {
            res.send({'success':false});
        }
        res.send({'success':true,'invitations':values});
    });
};







exports.getInvitationManager= function () {
    var invitationManager=new InvitationManager();
    return invitationManager;
};

