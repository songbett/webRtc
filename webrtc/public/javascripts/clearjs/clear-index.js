/**
 * Created by 定坤 on 2016/6/20.
 */

    //引入indexClient变量，关于主页里面的相关操作
    var IndexClient = indexClient();

 /**联系人列表更新操作**/

    //从缓存中获取已登录用户并添加到首页的联系人列表
    var getOnlineUsers = function () {
        $.ajax({
            type: "POST",
            url: '/getOnlineUsers',  //ajax请求后端，后端从redis缓存中 取数据
            data: {"roomId": 'Index'},
            success: function (data) {
                var userLi= $('#onlineUsers li');
                var userLiLength=$(userLi).length;
                for(var i=1;i<=userLiLength;i++){
                    $(userLi[i]).remove();
                }
                //先把列表全部删除
                console.log(data);
                if (data.success) {
                    for (var i = 0; i < data.users.length; i++) {
                        console.log("长度"+data.users.length);
//                            if (data.users[i].userId === $('#userId').text()) {
//
//                            }
//                            else {
                        //更新列表
                        add(data.users[i]);
                        //储存用户信息在connections中
                        IndexClient.connections.push(JSON.stringify(data.users[i]));
//                            }
                    }

                } else {
                    alert("Sorry Error!!");
                    $("#cancel1").click();
                }
            }
        });
    };

    //添加联系人列表
    function add(data) {
        $('#onlineUsers').append('<li id="' + data.socketId + '"  name="' + data.userId + '" class="list-group-item onlineUser" style="background-color: #f9f9f9;filter: Alpha(opacity=90); -moz-opacity: 90;opacity:0.9;" onclick="javascript:setInviteChat(\'' + data.socketId + '\',\'' + data.userId + '\')">' +
            data.userId+'&nbsp;&nbsp;' + '<span style="background-color:#F8C301;font-size:15px;margin:1px 4px;color:#ffffff;">' + '</span>' +
            '</li>');
    }
    getOnlineUsers();

/**聊天操作**/


    //用户待接收消息数
    var off_line_msg_num = {};
    //用户待接收消息
    var off_line_msg = {};
    //用户不在对话焦点时的消息数
    var lost_focus_msg_num = {};

    //邀请聊天
    var setInviteChat= function (socketId,userId) {
        //socketId和userId都是列表中用户的，而不是本窗口的
        //显示对话框
        create(socketId,userId);
        //发信令
        IndexClient.sendMessage("__setInviteChat",{socketId:socketId});
        if (typeof (off_line_msg_num[socketId]) == "undefined" || off_line_msg_num[socketId] == null) {
            off_line_msg[socketId] = [];
            off_line_msg_num[socketId] = 0;
            lost_focus_msg_num[socketId] = 0;
        }
        else if (off_line_msg_num[socketId] != 0) {
            for (var i = 0; i < off_line_msg[socketId].length; i++) {
                getChat(socketId, off_line_msg[socketId][i]);
            }
            off_line_msg[socketId] = [];
            off_line_msg_num[socketId] = 0;
            lost_focus_msg_num[socketId] = 0;
            $('li#' + socketId + ' span').html("");
            $('li#li' + socketId + ' span').html("");
            delContact(socketId);
            contactShow();
        }
    };



    //创建聊天
    var dialogId = 1;
    var z = 10;
    var num = 1; //聊天框数
    var idTemp;
    function create(id, uId) {
        //id是对方socketId,uId是userId
        $("#allChat1").click(function () {
            z++;
            $("#allChat1").css('z-index', z);
        });
        //若聊天框已经存在，则将该用户的左边栏显示
        if (document.getElementById('pane' + id)) {
            $("\#chat" + dialogId + " a[href='\#pane" + id + "']").tab('show');
        }
        else {
            if (num <= 8) {
                //增加聊天框左边栏新用户
                $('#chat' + dialogId).append(
                    "<li id='li" + id + "' style='border:1px solid #e0e0e0;border-radius:5px;background-color:#ffffff' onclick='javascript:flushMsgNum(\"" + id + "\")'>" +
                    "<a href='#pane" + id + "' data-toggle='tab'>" +
                    "<span class='badge pull-right'></span> " + uId + "</a></li>"
                );
                num++;
                //创建聊天框
                $("#tab-content" + dialogId).append(
                    "<div class='tab-pane' id='pane" + id + "'>" +
                    "<div id='main" + id + "' class='chatMain' style='float:left;'>" +
                    "<div class='ChatHead' id='chatHead" + id + "'>" +
                    "<div style='float:left;margin-top:10px;margin-left:10px;'>" +
                    "<p >" + uId + "</p>" + "</div>" +
                    "<div style='float:right;margin-right: 8px;margin-top:10px;'>" +
                    "<button type='button' class='close' aria-hidden='true' style='float:right' id='butt" + id + "'>&times;</button>" +
                    "</div>" + "</div>" + "<div id='ChatBody'>" +
                    "<div class='ChatContent' id='chat" + id + "'></div>" +
                    "<div class='handler'>" +
                    "<div class='handlerIcon'><a class='btn_addPic' data-toggle='tooltip' title='上传文件' style='position:relative;'>" +
                    "<input id='fileInput' onchange='javascript:sendFileToOther(this,\""+id+"\")' type='file' class='filePrew'/>" +
                    "<i class='icon-upload-alt icon-large'></i></a></div>"
                    + "<div class='handlerIcon'><a onclick='javascript:setVedioInvitation(\""+id+"\",\""+uId+"\")' data-toggle='tooltip' title='视频'>" +
                    "<i class='icon-facetime-video icon-large'></i></a></div>"
                    + "<div class='handlerIcon'><a data-toggle='tooltip' title='聊天记录' id='record" + id + "'>" +
                    "<i class='icon-time icon-large'></i></a></div>"
                    + "</div>"
                    + "<div id='ChatBtn" + id + "'>"
                    + "<form action='' name='chata" + id + "' method='post'>"
                    + "<div>"
                    + "<textarea id='ChatText" + id + "' rows='4' cols='66' style='border-color:#e5e5e5;margin-left: 5px;'></textarea>"
                    + "</div>"
                    + "<div style='padding: 4px 5px 10px;width:100%;margin-top:6px;'>"
                    + "<div style='float:right;'>"
                    + "<button type='button' class='btn btn-primary' style='width:120px;height:30px;' id='send" + id + "'>发送</button>"
                    + "</div>" + "<div style='float:right' >"
                    + "<button type='button' class='btn btn-default' style='width:100px;height:30px;margin-right:5px;'id='close" + id + "'>关闭</button>"
                    + "</div>" + "<div style='clear:both;'></div>"
                    + "</div>" + "</form>" + "</div>" + "</div>" + "</div>" + "</div>"
                    + "<div style='clear:both;'></div>");

                //显示聊天框
                $("\#chat" + dialogId + " a[href='\#pane" + id + "']").tab('show');

                //拖拉聊天框
                $("#allChat" + dialogId).draggable({ handle: '.ChatHead', containment: 'body' ,scroll: false});

                //发送消息
                $('#send' + id).click(
                    function () {
                        var text = $('#ChatText' + id).val();
                        var p = document.createElement("p");
                        if (text != "" && text.trim() != "") {
                            p.innerText = text;
                            //id为对方的socketId
                            chat(id, p.innerText);
                            $('#ChatText' + id).val("");
                        }
                        var h = $("#chat" + id).scrollTop();
                        $("#chat" + id).scrollTop(h + 500);
                    }
                );

                $(document).keypress(function (event) {
                    //enter键发送,ctrl+enter换行
                    if (event.ctrlKey && event.keyCode == 10) {
                        var text = $('#ChatText' + id).val();
                        var newText = text + "\r\n";
                        $('#ChatText' + id).val("" + newText);
                    }
                    else if (event.which == 13) {
                        event.preventDefault();
                        $('#send' + id).click();
                        var h = $("#chat" + id).scrollTop();
                        $("#chat" + id).scrollTop(h + 500);
                    }
                });

                /*聊天记录框*/
                $("#record" + id).click(function () {
                    if ($("#chatRecord" + id).is(":visible")) {
                        $("#chatRecord" + id).remove();
                    }
                    else {
                        $("#pane" + id).append(
                            "<div class='pull-left' style='height:100%;width:400px;background-color: #f9f9f9;position:absolute;margin-left:500px;z-index:100' id='chatRecord" + id + "'>" +
                            "<button type='button' class='close' id='closeRecord" + id + "'><span aria-hidden='true'>&times;</span><span class='sr - only'></span></button>" +
                            "<div class='chatRecordPane' style='height:510px;' id='chatRecordSee" + id + "'></div>" +
                            "</div>"
                        );
                        $("#closeRecord" + id).click(
                            function () {
                                $("#chatRecord" + id).remove();
                            }
                        );
                        msgRecordShow(id);
                    }
                });

                $(function () {

                    //点击关闭按钮
                    $('#close' + id).click(
                        function () {
                            $('#pane' + id).remove();
                            var i = $('#li' + id).parent().parent().parent().attr('id');
                            $('#li' + id).remove();
                            $("#" + i + "  a:first").tab('show');
                            num--;
                            $("#chatRecord" + id).remove();
                            IndexClient.sendMessage("__shutChat", {socketId: id});
                            if(IndexClient.localMediaStream) {
                                IndexClient.removeVedio(id);
                            }
                        }
                    );

                    //点击右上方的×
                    $('#butt' + id).click(
                        function () {
                            $('#pane' + id).remove();
                            var i = $('#li' + id).parent().parent().parent().attr('id');
                            $('#li' + id).remove();
                            $("#" + i + "  a:first").tab('show');
                            num--;
                            $("#chatRecord" + id).remove();
                            IndexClient.sendMessage("__shutChat", {socketId: id});
                            if(IndexClient.localMediaStream) {
                                IndexClient.removeVedio(id);
                            }
                        }
                    );
                });
                idTemp = id;
            }

            if (num > 8) {
                dialogId++;
                z++;
                createDialog();
                create(idTemp, uId);
            }
        }

        //超过8个聊天框，重新建一个聊天窗口
        function createDialog() {
            $(document.body).append(
                "<div class='chatDiv' id='allChat" + dialogId + "'>"
                + "<div id='dialogContain' style='float: left;height: 100%;'>"
                + "<ul class='nav nav-pills nav-stacked' id='chat" + dialogId + "'>"
                + "<li>&nbsp;</li>"
                + "<li>&nbsp;</li>"
                + "<li>&nbsp;</li>"
                + "</ul>" + "</div>"
            + "<div style='float:left;'>"
            + "<div class='tab-content' id='tab-content" + dialogId + "'>"
            + "</div>" + "</div>"
            + "<div style='clear:both;'></div>" + "</div>"
        );
            $('#allChat' + dialogId).css('z-index', z);
            $('#allChat' + dialogId).click(function () {
                z++;
                $('#allChat' + dialogId).css('z-index', z);
            });
            num = 0;
        }
    }




