//接收到客户端发送文件请求
var redisManager=require('../database/redisManager.js').getRedisManager();
var hbaseManager=require('../database/hbaseManager.js').getHbaseManager();
var querystring = require("qs");


function FileManager(){

}

FileManager.prototype.FileListen= function (RTCServer) {
    RTCServer.on("send_file_from_client", function(data, socket){
        var json = querystring.parse(data);
        var filePath = './public/storeUpload/'+json.roomId+'/';
        hbaseManager.saveFileToDir(filePath,json,socket);
        var eventName = '_new_Shared_File';
        var fileInfo = {fileName:json.fileName, filePath:filePath+json.fileName};
        //告知房间内所有人有新的共享文件
        RTCServer.broadcastInRoom(eventName,socket.room, fileInfo);
    });

    //获取所有的已经共享文件
    RTCServer.on('get_all_shared_files',function(data, socket){
        var json = querystring.parse(data);
        console.log("get_all_shared_files");
        redisManager.sendAllSharedFile(json.roomId, socket);
    });


};



exports.getFileManager= function () {
    var manager=new FileManager();
    return   manager;
};