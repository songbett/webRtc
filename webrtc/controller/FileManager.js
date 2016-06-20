//���յ��ͻ��˷����ļ�����
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
        //��֪���������������µĹ����ļ�
        RTCServer.broadcastInRoom(eventName,socket.room, fileInfo);
    });

    //��ȡ���е��Ѿ������ļ�
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