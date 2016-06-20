
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes/index');
var http = require('http');
var https=require('https');
var path = require('path');
var fs=require('fs');
var RTCServer=require('./controller/RtcServer');


var app = express();

var RedisStore = require('connect-redis')(express.session);
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


app.use(express.cookieParser());
app.use(express.session({
  secret: "keyboard cat" ,
  store:new RedisStore({
    host:'127.0.0.1',
    port:'6379',
    db:'mydb',  //此属性可选。redis可以进行分库操作。若无此参数，则不进行分库
    ttl:3600
  })
}));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//app.get('/', routes.index);
//app.get('/users', user.list);

var options={
  key:fs.readFileSync('./privatekey.pem').toString(),
  cert:fs.readFileSync('./certificate.pem').toString()
};




var server=https.createServer(options,app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


RTCServer.listen(server);
routes.index(app);