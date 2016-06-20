/**
 * Created by Fa on 2015/11/01
 */

 //recordId = sender + receiver
 function oneChatRecord(recordId,sender,message,time){
 	this.recordId = recordId;
 	this.sender = sender;
 	this.message = message;
 	this.time = time;
 }

 module.exports = oneChatRecord;