
/**
 * Created by Fa on 15-10-20
 */

 var redis = require('redis');
 var redis_host = 'localhost';
 var redis_port = 6379;
 var RedisSessions = require('redis-sessions');
 var rs=new RedisSessions({host:redis_host,port:redis_port});
var hbaseManager=require('./hbaseManager.js').getHbaseManager();


 function redisManager(){

 }

 //添加新进入的用户
 redisManager.prototype.addOnlineUser = function(roomId,socketId,userId,callback){
 	var redis_client = redis.createClient(redis_port,redis_host);
 	redis_client.on('error',function(err){
 		console.log(err);
 	});
 	redis_client.hset(roomId,socketId,userId,function(err,success){
 		callback(err,success);
 	});
 	redis_client.quit();
 	
 };


 //获得特定房间内特定用户的userId
 redisManager.prototype.getOnlineUserId = function(roomId,socketId,callback){
 	redis_client = redis.createClient(redis_port,redis_host);
 	redis_client.on('error',function(err){
 		console.log(err);
 	});
 	redis_client.hget(roomId,socketId,function(err,value){
		console.log("get到redis的roomid-"+roomId+"-socketId-"+socketId+"-userId-"+value);
 		callback(err,value);
 	});

 	redis_client.quit();
 };


//检查房间的某个用户
redisManager.prototype.checksome = function(roomId,userId,callback){
	redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on('error',function(err){
		console.log(err);
	});
	var user={};
	redis_client.hgetall(roomId,function(err,value){
		for(var socketId in value)
		{
			if(value[socketId] === userId)
			{
				user["socketid"]=socketId;
				user["userid"]=value[socketId];
			}
		}
		redis_client.quit();
		callback(user);
	});
};


redisManager.prototype.updatesocket= function (roomId,userId,newSocketId) {
	redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on('error',function(err){
		console.log(err);
	});
	//处理更新
	var oldSocketId;
	redis_client.hgetall(roomId,function(err,value){
		for(var socketId in value)
		{
			if(value[socketId] === userId)
			{
				oldSocketId = socketId;
			}
		}
		//console.log('oldSocketId is :' + oldSocketId);
		if(oldSocketId == null){
			//console.log('好像还没有这个用户哦！');
			redis_client.hset(roomId,newSocketId,userId,function(err,success){
				//console.log('新增用户信息缓存：' + success);
			});
		}
		else
		{
			redis_client.hdel(roomId,oldSocketId,function(err,success){
				//console.log('删除旧用户缓存：' + success);
			});
			redis_client.hset(roomId,newSocketId,userId,function(err,success){
				//console.log('更新用户信息缓存：' + success);
			});
		}
	});
};

 //获得房间内所有用户的userId与socketId
 redisManager.prototype.getAllOnlineUser = function(req,res){
 	var users = [];
 	//console.log(req.body['roomId']);
 	redis_client = redis.createClient(redis_port,redis_host);
 	redis_client.on('error',function(err){
 		console.log(err);
 	});
 	redis_client.hgetall(req.body['roomId'],function(err,value){
 		for(var socketId in value)
 		{
 			if(value[socketId] === req.session.user.userId)
 			{
 				continue;
 			}
 			var user = {userId:value[socketId],socketId:socketId};
 			users.push(user);
 		}
 		redis_client.quit();
 		res.send({'success':true,'users':users});

 	});
 };

 //从房间内删除一个用户
 redisManager.prototype.setUserOffLine = function(roomId,socketId){
 	redis_client = redis.createClient(redis_port,redis_host);
 	redis_client.on('error',function(err){
 		console.log(err);
 	});
 	redis_client.hdel(roomId,socketId,function(err,success){
 		console.log(success);
 	});
 	redis_client.quit();
 };

 //获得特定房间内所有用户的socketId
 redisManager.prototype.getAllUserSocketId = function(roomId,callback){
 	redis_client = redis.createClient(redis_port,redis_host);
 	redis_client.on('error',function(err){
 		console.log("error:"+err);
 	});
 	redis_client.hkeys(roomId,function(err,values){
 		callback(values);
 		redis_client.quit();
 	});
 };

 //获得特定房间内所有用户的userId与socketId
 redisManager.prototype.getUserIdSocketId = function(roomId,callback){
 	redis_client = redis.createClient(redis_port,redis_host);
 	redis_client.on('error',function(err){
 		console.log(err);
 	});
 	redis_client.hgetall(roomId,function(err,values){
 		callback(values);
 		redis_client.quit();
 	});
 };

 redisManager.prototype.addMember = function(roomId,socketId,userId){
 	redis_client = redis.createClient(redis_port,redis_host);
 	redis_client.on('error',function(err){
 		console.log(err);
 	});
 	redis_client.hset(roomId,socketId,userId,redis.print);
 };

//发出邀请时储存邀请缓存
redisManager.prototype.setOneChatInvite = function(data,callback){
	redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on('error',function(err){
		console.log(err);
	});

	redis_client.sismember('Invite',data.receiver,function(err,exist){
		if(exist){
			var date = new Date().getTime().toLocaleString();
			redis_client.hexists(data.receiver,data.sender,function(err,exist){
				if(exist)
				{

					redis_client.hdel(data.receiver,data.sender,function(err,success){
						console.log(err);
						console.log('删除旧邀请：' + success);
					});
					redis_client.hset(data.receiver,data.sender,date,function(err,success){
						console.log(err);
						console.log('更新邀请：' + success);
					});
				}
				else
				{
					redis_client.hset(data.receiver,data.sender,date,function(err,success){
						console.log(err);
						console.log('新增邀请');
					});
				}

			});
			redis_client.quit();
		}
		else
		{
			var date = new Date().getTime().toLocaleString();
			redis_client.sadd('Invite',data.receiver);
			redis_client.hset(data.receiver,data.sender,date);
			redis_client.quit();
			callback("success");
		}
	});
};
//接受邀请后删除邀请缓存
redisManager.prototype.delOneChatInvitation = function(data){
	redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on('error',function(err){
		console.log(err);
	});
	redis_client.hdel(data.receiver,data.sender,function(err,success){
		console.log('delOneChatInvitation :' + success);
	});
};

//检查是否有自己的邀请
redisManager.prototype.checkInvitation = function(data,callback){
	redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on('error',function(err){
		console.log(err);
	});
	redis_client.sismember('Invite',data.receiver,function(err,exist){
		if(exist)
		{
			redis_client.hgetall(data.receiver,function(err,value){
				callback(true,value);
			});
			redis_client.quit();
		}
		else
		{
			redis_client.quit();
			callback(false,null);
		}
	});
};


//生成房间号并缓存
redisManager.prototype.createRoom = function(callback){
	var date = new Date();
	var roomId = 'Room' + date.getTime();
	redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on('error',function(err){
		console.log("Error " + err);
	});
	redis_client.sadd('Rooms',roomId,function(err,success){
		if(success == 1){
			var success = true;
			callback(success,roomId);
		}
		else{
			var success = false;
			callback(success,roomId);
		}
	});
	redis_client.quit();
};

//判断是不是管理员
redisManager.prototype.isManager = function(roomId,userId,callback){
	var redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on("error",function(err){
		console.log(err+'isManager redis错误');
	});
	this.replacestr(roomId, function (realroomId) {
		roomId=realroomId;
	});
	redis_client.get(roomId,function(err,value){

		console.log(roomId+"去你妹的"+value+"查找的是"+userId);
		if(value){

			if(userId==value){

				callback(true);
			}
			else
				callback(false);
		}
		else
			callback(false);
	});
};


redisManager.prototype.setRoomManager = function(roomId,hostName){
	var redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on("error",function(err){
		console.log(err+'roomManager redis错误');
	});
	console.log("转换前的roomId"+roomId);
	this.replacestr(roomId, function (realroomId) {
		roomId=realroomId;
	});
	console.log("转换后的roomId"+roomId);
	redis_client.set(roomId,hostName,function(err,success){
		if(err){
			console.log("插入房间-主持人缓存失败：redis");
		}
		else
			console.log("插入房间-主持人缓存成功：redis");
		redis_client.get(roomId, function (err,value) {
			console.log(roomId+"去你的"+value);
		});
	});
};

redisManager.prototype.delRoomManager = function(roomId){
	var redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on("error",function(err){
		console.log(err+'delRoomManager redis错误');
	});
	this.replacestr(roomId, function (realroomId) {
		roomId=realroomId;
	});
	redis_client.del(roomId,function(err,success){
		if(err){
			console.log("删除房间-主持人缓存失败：redis");
		}
		else
			console.log("删除房间-主持人缓存成功：redis");
	});
};



//删除房间 并删除房间内所有人的信息
redisManager.prototype.delRoom = function(roomId,callback){
	redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on('error',function(err){
		console.log("Error "+ err);
	});
	redis_client.srem('Rooms',roomId);
	redis_client.hkeys(roomId,function(err,values){
		for(var i=0;i<values.length;i++){
			var socketId = values[i];
			redis_client.hdel(roomId,socketId);
		}
	});
	redis_client.quit();
};

//用户确认接受邀请进入房间时的跳转控制
redisManager.prototype.joinRoom = function(req,res){
	var that = this;
	redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on('error',function(err){
		console.log("Error " + err);
	});
	//首先查看是否存在这个房间号
	redis_client.sismember('Rooms',req.query.roomId,function(err,exist){
		if (exist) {
			//若存在房间号，再查看对应房间内有没有该用户
			redis_client.hvals(req.query.roomId,function(err,values){
				console.log(values);
				for(var i = 0;i<values.length;i++){
					if(values[i] === req.session.user.userId){
						/******如果缓存内对应房间已经有这个用户，决定这里的页面跳转******/
						res.redirect('/room?roomId='+req.query.roomId);
					}
				}
				redis_client.quit();
				//还没写
				redis_client.hset(req.query.roomId,req.session.user.userId);
				hbaseManager.setInvitationAccepted(req.session.user.userId,req.query.roomId);
				return res.render('room', {'roomId': req.query.roomId, 'userId': req.session.user.userId});
			});
		}
		//如果压根没有这个房间号
		else{
			/*********决定这里的页面跳转*********/
			res.redirect('/NotFound');
		}
	});
};


redisManager.prototype.sendAllSharedFile = function(roomId, socket)
{
	var redis_client = redis.createClient(redis_port,redis_host);
	redis_client.on("error", function (err) {
		console.log(err + 'sendAllSharedFile Redis错误');
	});
	redis_client.smembers(roomId+'_file', function(err, values){
		if(err){
			console.log('sendAllSharedFile smember 错误'+err.toString());
		}
		console.log('room '+roomId+'拥有文件：'+values);
		redis_client.quit();
		socket.send(JSON.stringify({
			"eventName": "_get_all_shared_files",
			"data": {
				"files": values
			}
		}));

	});
};

redisManager.prototype.replacestr=function (roomId,callback) {
	var realRoomId="Room_"+roomId.substring(4);
	callback(realRoomId);
};



 redisManager.prototype.print = function(){
 	console.log('this is redis');
 };

 exports.getRedisManager = function(){
 	var rManager = new redisManager();
 	return rManager;
 };