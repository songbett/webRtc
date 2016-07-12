var rsapp=require("../config.js").rsapp;
var redis=require("redis");
var RedisSessions=require("redis-sessions");
var conf=require('../config.js');
var redisPort = conf.redisPort;
var redisHost = conf.redisHost;
var rs=new RedisSessions({host:redisHost,port:redisPort});
var hbaseManager=require('../database/hbaseManager.js').getHbaseManager();
var redisManager=require('../database/redisManager.js').getRedisManager();
function UserManager(){

}

UserManager.prototype.hasnotlogin= function (req,res,next) {
    rs.get({
            app: rsapp,
            token: req.session.token},
        function (err, resp) {
            if (!req.session.user || !req.session.token || resp.id != req.session.user.userId) {
                req.session.user = null;
                req.session.token = null;
                return res.redirect('/login');
            }
            return next();
        });
};

//进会议室之间的检查是否存在缓存
UserManager.prototype.meetingchecklogin = function (req, res, next) {
    rs.get({
            app: rsapp,
            token: req.session.token},
        function (err, resp) {
            if (!req.session.user || !req.session.token || resp.id != req.session.user.userId) {
                req.session.user = null;
                req.session.token = null;
                return res.send({'success': false});
            }
            next();
        });
};




  UserManager.prototype.haslogin= function (req,res,next) {
    rs.get({
            app: rsapp,
            token: req.session.token},
        function (err, resp) {
            if (req.session.user!=null && req.session.token!=null && resp.id === req.session.user.userId) {
                return res.redirect('/');
            }
            next();
        });
};

UserManager.prototype.login= function (req,res) {
    if (req.session.user && req.session.token) {
        req.session.user = null;
        rs.kill({
                app: rsapp,
                token: req.session.token
            },
            function (err, resp) {
                req.session.token = null;
            });
    }
    hbaseManager.getUser(req.body.username, function (err, user) {
        if (user) {
            if (user.userPassword === req.body.password) {
                rs.soapp({app: rsapp, dt: 3600}, function (err, resp) {
                    for (var i = 0; i < resp.sessions.length; i++) {
                        if (resp.sessions[i].id === user.userId) {
                            rs.killsoid({app: rsapp, id: user.userId}, function (err, resp) {
                            });
                        }
                    }
                    if (err) {
                        console.log(err);
                        res.redirect('/login');
                    }
                    else {
                        req.session.user = user;
                        rs.create({app: rsapp, id: user.userId, ip: "127.0.0.1", ttl: 3600}, function (err, resp) {
                            req.session.token = resp.token;
                            rs.set({app: rsapp, token: resp.token, d: user}, function (err, resp) {
                                if (err) {
                                    console.log('登录失败');
                                    res.redirect('/login');
                                }
                                console.log("登录成功");
                                res.redirect('/');
                            });
                        });
                    }
                });
            }
            else {
                console.log("密码错误");
                req.error="密码错误";
                //res.redirect('/login');
                res.render('login.ejs',{'msg': "密码错误"});
            }
        }
        else {
            console.log("不存在该用户");
            res.render('login.ejs',{'msg': "不存在该用户"});
        }
    });
};

UserManager.prototype.regist= function (req,res) {
    var newuser={
        userId:req.body['username'],
        userPassword:req.body['password'],
        userEmail:req.body['email'],
        userPasswordRepeat:req.body['password-repeat']
    };
    if(newuser.userPassword != newuser.userPasswordRepeat) {
        var error = 'two time password is different';
        console.log(error);
        //res.write("两次密码不一致");
        res.render('regist.ejs',{'msg': "两次密码不一致"});  //用了这个就不要用res.end()了
    }else{
        hbaseManager.getUser(req.body['username'], function (err,user) {
            if(user){
                err='user already exist';
                console.log(err);
                res.render('regist.ejs',{'msg': "用户已存在"});
            }else if(err){
                console.log("error exist");
                res.render('regist.ejs',{'msg': "注册错误"});
            }else {
                hbaseManager.saveUser(newuser.userId,newuser.userPassword,newuser.userEmail, function (success) {
                    if(success===true){
                        var user={
                            userId:newuser.userId,
                            Password:newuser.userPassword
                        };
                        req.session.user=user;
                        rs.create({
                                app:rsapp,
                                id:newuser.userId,
                                ip:"127.0.0.1",
                                ttl:"3600"}, function (err,resp) {
                                req.session.token=resp.token;
                                rs.set({
                                        app:rsapp,
                                        token:resp.token,
                                        d:user},function(err,resp){
                                        if(err){
                                            res.redirect('/login');
                                        }
                                        //console.log(resp.d.userId);
                                        res.redirect('/');
                                    }
                                )
                            }
                        );

                    }
                    else{
                        console.log("regist error");
                        res.redirect('/regist');
                    }
                });
            }
        });
    }
};


UserManager.prototype.toLogout= function (req,res,next) {
    redisManager.checksome('Index',req.session.user.userId, function (user) {
        if(user){
            socketId=user['socketid'];
            userId=user['userid'];
            //redisManager.setUserOffLine('Index',socketId, function (err, success) {
            //    if(err){
            //        console.log("缓存没删除成功");
            //    }
            //    if(success){
            //        console.log("缓存删除成功");
            //    }
            //});
        }else{
            console.log("not exist in cache");
        }

    });
        rs.kill({
            app: rsapp,
            token: req.session.token},
        function (err, resp) {
            //console.log(resp);
            var client = redis.createClient(redisPort, redisHost);
            client.del(req.session.user.userId);
            req.session.user = null;
            res.redirect('/login');
        });
};


UserManager.prototype.getallusers= function (req,res) {
    redisManager.getAllOnlineUser(req,res);

};

UserManager.prototype.changePassword=function (req,res){
    var originPassword=req.body.originPassword;
    var newPassword=req.body.newPassword;
    var userId=req.body.userId;
    console.log("旧密码");
    console.log(originPassword);

    hbaseManager.getUser(userId, function (err, user) {
        if (user) {
            if (user.userPassword === req.originPassword) {
                hbaseManager.changeUserPassword(userId,newPassword, function (data) {

                });
            }
        }
    });

}

UserManager.prototype.changeEmail=function(req,res){
    var newEmail=req.body.newEmail;
}

UserManager.prototype.changeQuestion=function(req,res){
    var select1=req.body.select1;
    var select2=req.body.select2;
    var select3=req.body.select3;
    var question1=req.body.question1;
    var question2=req.body.question2;
    var question3=req.body.question3;

    var replys={
        reply1 : {
            question1 : select1,
            answer1 : question1
        },
        reply2 : {
            question2 : select2,
            answer2 : question2
        },
        reply3 : {
            question3 : select3,
            answer3 : question3
        }
    };
    var replysJson=JSON.stringify(replys);
    console.log(replysJson);
}



exports.getUserManager= function () {
    var userManager=new UserManager();
    return userManager;
};