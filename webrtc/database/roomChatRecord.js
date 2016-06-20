/**
 * Created by Fa on 2015/11/05
 */

 function roomChatRecord(roomId,sender,message,time){
 	this.roomId = roomId;
 	this.sender = sender;
 	this.message = message;
 	this.time = time;
 }

 module.exports = roomChatRecord;