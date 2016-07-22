
/*
 * GET home page.
 */
var userManager=require('../controller/UserManager.js').getUserManager();
var meetingManager=require('../controller/meetingManager.js').getMeetingManager();
var invitationManager=require('../controller/InvitationManager.js').getInvitationManager();


module.exports.index= function (app) {


    app.get('/', userManager.hasnotlogin);
    app.get('/', function (req,res) {
        res.render('index',{userId:req.session.user.userId});
   });

    app.get('/personSetting', function (req,res) {
       res.render('personSetting',{userId:req.session.user.userId});
    });
    app.post('/personSetting-changePassword',userManager.changePassword);
    app.post('/personSetting-changeEmail',userManager.changeEmail);
    app.post('/personSetting-changeQuestion',userManager.changeQuestion);

    app.get('/forgetPassword',function(req,res){
        res.render('forgetPassword');
    })
    app.post('/getQuestions',userManager.getQuestions);
    app.post('/resetPassword',userManager.resetPassword);


    app.get('/login', function (req,res) {
      res.render('login',{'msg':''});
    });
    app.post('/login',userManager.haslogin);
    app.post('/login',userManager.login);

    app.get('/regist', function (req,res) {
        res.render('regist.ejs',{msg:" "});
    });
    app.post('/regist',userManager.regist);

    app.get('/logout',userManager.hasnotlogin);
    app.get('/logout',userManager.toLogout);

    app.post('/getOnlineUsers',userManager.getallusers);

    app.get('/NotFound', function (req,res) {
       res.render('NotFound');
    });

    app.post('/meeting', userManager.meetingchecklogin);
    app.post('/meeting',meetingManager.generateRoom);

    app.get('/room',userManager.hasnotlogin);
    app.get('/room',meetingManager.joinRoom);

    app.post('/setInvitation',invitationManager.setInvitation);
    app.post('/getInvitations',invitationManager.getInvitations);

    app.get('/NotFound',function(req, res){
        res.render('NotFound');
    });

    app.get('/getFile',function(req, res){
        console.log('into getFile');
        var _filePath = req.query.path;
        console.log(_filePath);
        res.download(_filePath);
    });





};

