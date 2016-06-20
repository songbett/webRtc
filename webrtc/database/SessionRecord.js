/**
 聊天消息的数据结构
 */

function SessionRecord(recordId,message,time) {
    this.recordId = recordId;
    this.message = message;
    this.time = time;
}

module.exports = SessionRecord;