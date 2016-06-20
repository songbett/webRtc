var hbase = require('hbase');
var xml_digester = require("xml-digester");
var fs = require('fs');



var hbase_port = 8090;
var hbase_host = '116.56.129.233';
var redis_port = 6379;
var redis_host = '127.0.0.1';


exports.client = hbase({
    host: hbase_host,
    port: hbase_port
});
exports.redisPort = redis_port;
exports.redisHost = redis_host;
exports.rsapp = "myapp";
