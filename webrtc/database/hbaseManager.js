/**
 * Created by Fa on 15-10-20.
 */
 var hbase = require('hbase');
 var hbase_port = 8090;
 //var hbase_host = '116.56.129.233';
 //var hbase_host="110.64.90.191";
  //var hbase_host = '121.42.157.14';
   var hbase_host = '192.168.3.216';
  //var hbase_host = '121.42.157.14';
  var hbase_client = hbase({
 	host:hbase_host,
 	port:hbase_port
 });
 var fs = require('fs');
 var redis = require('redis');
var conf = require("../config.js");
var redisPort = conf.redisPort;
var redisHost = conf.redisHost;



 function hbaseManager(){

 }

 hbaseManager.prototype.saveUser = function(userId,userPassword,userEmail,callback) {
 	var table = hbase_client.getTable("User");
 	table.create('InfoCF',function(err,success){
 		this.getRow(userId).put(['InfoCF:Password','InfoCF:Email'], [userPassword,userEmail],function(err,success){
 			console.log('insert one colunm');
 			console.log(success);
 			callback(success);   //若数据成功储存，success为true,否则为false
 		});
 	});
 };

 hbaseManager.prototype.getUser = function getUser(userId, callback) {

    var user;
    var table = hbase_client.getTable("User");
    table.getRow(userId).exists(function(err,exist){
        //console.log(exist);
        if(exist){
            this.get('InfoCF:Password',function(err,value){
                //console.log(value[0].$);
                user = {
                    userId:userId,
                    userPassword:value[0].$
                };
                callback(err,user);
            });
        }
        else{
            callback(err, null);
        }
    });
};


//储存单人聊天记录 record为oneChatRecord的实例 recordId = sender + receiver + time
hbaseManager.prototype.saveOneChatRecord = function(record){
    var oneChatRecord = {
        recordId:record.recordId,
        sender:record.sender,
        message:record.message,
        time:record.time
    };
    console.log(oneChatRecord);

    var table = hbase_client.getTable("One_Chat_Record");
    table.create('cf',function(err,success){
        this.getRow(oneChatRecord.recordId)
            .put(['cf:sender','cf:message','cf:time'],[oneChatRecord.sender,oneChatRecord.message,oneChatRecord.time],function(err,success){
                console.log('insert one colunm');
                console.log(success);
            });
    });
};

//获得单人聊天记录
hbaseManager.prototype.getOneChatRecord = function(SRId,callback){
    var scanner = hbase_client.getScanner('One_Chat_Record');
    var records = [];
    scanner.create({filter: {"op": "EQUAL", "type": "RowFilter",
            "comparator": {"value": SRId, "type": "RegexStringComparator"}}},
        function (err, success) {
            this.get(function (err, cells) {
                if(cells) {
                    for (var i = 0; i < cells.length; i += 3) {
                        var record = {
                            msg: cells[i].$,
                            sender: cells[i + 1].$,
                            time: cells[i + 2].$
                        };
                        records.push(JSON.stringify(record));
                    }
                    callback(records);
                }
            });
        });
};

//储存单人聊天文件记录
hbaseManager.prototype.saveOneChatFile = function(path,json,socket){
    if(!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
    path = path + json.filename;
    fs.writeFile(path,json.fileBuffer,'binary',function(err){
        if(err){
            console.log('保存文件出错');
        }
        console.log('保存文件'+path);

        var table = hbase_client.getTable("One_Chat_File");
        table.create('FileCF',function(err,success){
            this.getRow(json.sender+'_'+json.receiver+Date.now())
                .put(['FileCF:path','FileCF:sender','FileCF:time'],[path,json.sender,(new Date()).Format('yyyy-MM-dd')],function(err,success){
                    console.log('hbase插入FileCF成功');
                    console.log(success);
                });
        });
        //这部分原本属于redis操作 为了避免调用上的重复还是写在了一起
        var oneChatFile = {
            filename:json.filename,
            filepath:path
        };
        var redis_client = redis.createClient(redis_port,redis_host);
        redis_client.on('error',function(err){
            console.log('保存文件到redis错误');
        });
        redis_client.sadd(json.sender + json.receiver + '_file',JSON.stringify(oneChatFile));
        redis_client.quit();

        socket.send(JSON.stringify({
            "eventName":"_uploadFileFinished",
            "data":{"filename":json.filename}
        }));

    });
};

//获得单人聊天文件
hbaseManager.prototype.getOneChatFile = function(sender,receiver,callback){
    var scanner = hbase_client.getScanner('One_Chat_File');
    var files = [];
    scanner.create({filter: {"op": "EQUAL", "type": "RowFilter",
            "comparator": {"value": sender+receiver, "type": "RegexStringComparator"}}},
        function (err, success) {
            this.get(function (err, cells) {
                if(cells) {
                    for (var i = 0; i < cells.length; i += 3) {
                        var file = {
                            path: cells[i].$,
                            sender: cells[i + 1].$,
                            time: cells[i + 2].$
                        };
                        files.push(JSON.stringify(file));
                    }
                    callback(files);
                }
            });
        });
};


//////////
hbaseManager.prototype.setInvitationTo = function (invitation, callback) {
    var table = hbase_client.getTable("Invitation_Store");
    console.log("邀请来了3");
    table.create('InvitationCF', function (err, success) {
        this.getRow(invitation.invitationId)
            .put(['InvitationCF:RoomId', 'InvitationCF:SenderId', 'InvitationCF:UserId', 'InvitationCF:InvitationTime', 'InvitationCF:InvitationOver','InvitationCF:InvitationAccept'],
            [invitation.roomId, invitation.senderId, invitation.userId, invitation.invitationTime, invitation.invitationOver,invitation.invitationAccept], function (err1, success1) {
                console.log('insert one column');

                callback(err1,success1);
            });
        console.log("邀请来了4");
    });
    console.log("邀请来了8")
};


//////////
hbaseManager.prototype.setInvitationAccepted = function (userId, roomId) {
    var scanner = hbase_client.getScanner('Invitation_Store');
    var invitationID = userId+'-'+roomId;
    scanner.create({filter: {op: "EQUAL", type: "RowFilter", comparator: {value: invitationID, "type": "RegexStringComparator"}}},
        function (err, success) {
            this.get(function (err, cells) {
                //console.log(cells);
                this.delete();
                if (cells) {
                    var table = hbase_client.getTable('Invitation_Store');
                    table.create('InvitationCF', function (err, success) {
                        for(var i = 0; i < cells.length / 6; i++) {
                            //console.log('cells i = '+i);
                            (function(i){
                                //console.log('middle + '+i+'  '+cells[6 * i].key);
                                table.getRow(cells[6 * i].key)
                                    .put('InvitationCF:InvitationAccept', '1', function (err, success) {
                                        console.log('set Invitation to Accept');
                                        console.log(success);
                                    });
                            })(i);
                            //console.log("after i "+i);
                        }
                    });
                }
            });
        });
};

//////////
hbaseManager.prototype.getInvitationsFrom = function (userId, callback)
{
    var scanner = hbase_client.getScanner('Invitation_Store');
    scanner.create({filter: {op: "EQUAL", type: "RowFilter", comparator: {value: userId, "type": "RegexStringComparator"}}},
        function (err, success) {
            this.get(function (err, cells) {
                //console.log(cells);
                this.delete();
                var values = [];
                if (cells) {
                    for (var i = 0; i < cells.length / 6; i++) {
                        var invitation = {
                            invitationId: cells[6 * i].key,
                            invitationAccept: cells[6 * i].$,
                            invitationOver: cells[6 * i+1].$,
                            invitationTime: cells[6 * i + 2].$,
                            roomId: cells[6 * i + 3].$,
                            senderId: cells[6 * i + 4].$,
                            userId: cells[6 * i + 5].$
                        };
                        values.push(invitation);
                    }
                }
                callback(err, values);
            });
        });
};

///////
hbaseManager.prototype.save = function (record) {
    var sessionRecord = {
        recordId: record.recordId,
        message: record.message,
        time:record.time
    };
    console.log(sessionRecord);
    var table = hbase_client.getTable("mytable");
    table.create('cf', function (err, success) {
        this.getRow(sessionRecord.recordId)
            .put('cf:time', sessionRecord.time, function (err, success) {
                console.log('insert one column');
                console.log(success);
            });

        this.getRow(sessionRecord.recordId)
            .put('cf:message', sessionRecord.message, function (err, success) {
                console.log('insert one column');
                console.log(success);
            });
    });
};

////////
hbaseManager.prototype.getMessages = function getMessages(roomId,callback) {
    var msgs = '';
    var scanner = hbase_client.getScanner('mytable');
    scanner.create({filter: {"op": "EQUAL", "type": "RowFilter",
            "comparator": {"value": roomId, "type": "RegexStringComparator"}}},
        function (err, success) {
            this.get(function (err, cells) {
                console.log(cells);
                if(cells) {
                    for (var i = 0; i < cells.length; i += 2) {
                        //不能读取.$
                        msgs += cells[i + 1].$ + '\n' + cells[i].$ + '\n';
                    }
                    var mgs = msgs.split('\n');
                    msgs = '';
                    var l = mgs.length - 1;
                    for (var i = 0; i < l; i++) {
                        msgs += mgs[i] + '\n';
                    }
                    console.log(msgs);
                    callback(msgs);
                }
            });
        });
};

hbaseManager.prototype.saveFileToDir = function(path,json,socket)
{
    if(!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
    path = path + json.fileName;
    fs.writeFile(path, json.fileBuffer, 'binary',function(err){
        if(err){
            console.log('保存文件出错');
        }
        console.log('保存文件 '+path);
        var table = hbase_client.getTable("File_Store");
        table.create('FileCF', function (err, success) {
            this.getRow(json.roomId+'_'+json.userId+'_'+Date.now()).put(['FileCF:sender','FileCF:path','FileCF:time'],
                [json.userId,path,(new Date()).Format('yyyy-MM-dd')],function(err,success) {
                    console.log('hbase 插入FileCF 成功');
                    console.log(success);
                })
        });
        //添加到redis做缓存
        var roomFile = {
            fileName:json.fileName,
            filePath:path
        };
        var redis_client = redis.createClient(redisPort,redisHost);
        redis_client.on('error', function (err) {
            console.log('saveFileToRedis错误');
        });
        redis_client.sadd(json.roomId + '_file', JSON.stringify(roomFile));
        redis_client.quit();
        socket.send(JSON.stringify({
            "eventName": "_uploadFileFinished",
            "data": {
                "fileName": json.fileName
            }
        }));
    });
};


Date.prototype.Format = function(fmt)
{
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
};


hbaseManager.prototype.saveRoomAndHost = function(hostId,roomId) {
    var meetingTime=(new Date()).Format('yyyy-MM-dd');
    var table = hbase_client.getTable("RoomHost");
    table.create('HostCF',function(err,success){
        this.getRow(roomId).put(['HostCF:hostId','HostCF:meetingTime'], [hostId,meetingTime],function(err,success){
            if(err){
                console.log(err+"保存主持人出错");
            }
            else
                console.log(success);
        });
    });
};
hbaseManager.prototype.getRoomHost = function (roomId, callback) {

    var host;
    var table = hbase_client.getTable("RoomHost");
    table.getRow(roomId).exists(function(err,exist){
        //console.log(exist);
        if(exist){
            this.get(['HostCF:hostId','HostCF:meetingTime'],function(err,value){
                //console.log(value[0].$);
                host = {
                    roomId:roomId,
                    hostId:value[0].$,
                    meetingTime:value[1].$
                };
                callback(err,host);
            });
        }
        else{
            callback(err, null);
        }
    });
};





 exports.getHbaseManager = function(){
 	var hManager = new hbaseManager();
 	return hManager;
 };
