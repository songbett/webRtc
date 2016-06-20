/**
 * Created by 定坤 on 2016/6/20.
 */
var IndexClient = indexClient();

IndexClient.on('someone_login', function (data) {
    //如果当前窗口的id等于广播的id，说明该窗口就是登录窗口，什么都不用做；如果不是登录窗口，则要让该窗口执行getOnlineUsers，来获得已登录用户列表
    if(data.userId===$("#userId").text()){
        //还不懂
        //window.location.replace("https://"+window.location.host+'/NotFound');
        console.log("已经");
    }
    else{
//                add(data);
        console.log("后来");
        getOnlineUsers();
    }
});