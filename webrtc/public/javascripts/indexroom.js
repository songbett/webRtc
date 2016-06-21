/*
 进入大房间的脚本
*/

var indexClient= function () {

    //webRtc接口之一：WebRTC使用RTCPeerConnection来在浏览器之间传递流数据，这个流数据通道是点对点的，不需要经过服务器进行中转
    var PeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
    var webkitURL = (window.URL || window.webkitURL || window.msURL || window.oURL);
    //webRtc接口之一：MediaStream：通过MediaStream的API能够通过设备的摄像头及话筒获得视频、音频的同步流
    var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
    var nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription); // order is very important: "RTCSessionDescription" defined in Nighly but useless
    var moz = !! navigator.mozGetUserMedia;
    //使用Google的stun服务器
    var iceServer = {
        "iceServers": [{
            "url": "stun:stun.l.google.com:19302"
        }]
    };
    // {"url": "turn:700@121.42.157.14",credential:'700pass'}
    /*事件处理器*/
    function EventEmitter(){
        this.events={};
    }

    //绑定事件函数
    EventEmitter.prototype.on= function (eventName, callback) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(callback);
    };
    //触发事件函数
    EventEmitter.prototype.emit = function (eventName, _) {
        var events = this.events[eventName],
            args = Array.prototype.slice.call(arguments, 1),
            i, m;

        if (!events) {
            return;
        }
        for (i = 0, m = events.length; i < m; i++) {
            events[i].apply(null, args);
        }
    };

    function IndexClient(){
        /**********房间用到的类变量**********/

        //本地Socket.io连接
        this.socket = null;
        //本地media stream
        this.localMediaStream = null;

        //保存所有与本地相连的peer connection，键为socketid
        this.peerConnections={};
        //保存所有与本地连接的socket
        this.connections=[];

        //初始时已经连接的数目
        this.initializedStreams={};
        //保存所有的data channel，键为socket id，值通过PeerConnection实例的createChannel创建
        this.dataChannels = {};
        this.firstconnect = true;
        this.vediosocketId=null;

    }

//继承自事件处理器，提供绑定事件和触发事件的功能
    IndexClient.prototype = new EventEmitter();

    IndexClient.prototype.sendMessage= function (event,message) {
        var socket=this.socket;
        socket.send(JSON.stringify({eventName:event,data:message})); //触发RTCserver的socket.on(message)
    };

    //开始点对点连接
    IndexClient.prototype.beginPeerConnection= function (socketId) {
        //soccketId是被邀请者
        var that=this;
        that.createPeerConnection(socketId);
        that.createDataChannel(socketId);
        that.sendOffer(socketId);
    };



    IndexClient.prototype.createPeerConnection= function (socketId) {
        //soccketId是被邀请者
        var that=this;
        //再次连接
        var renegotiating = false;
        //创建PeerConnection实例
        var pc=new PeerConnection(iceServer);
        //初始化已连接数目为0
        that.initializedStreams[socketId]=0;
        //保存所有与本地相连的peer connection，键为socketid
        that.peerConnections[socketId]=pc;
        //发送ICE候选到其他客户端
        pc.onicecandidate= function (evt) {
            if(renegotiating)return;
            else{
                if(evt.candidate){
                    that.socket.send(JSON.stringify({
                        eventName:"__ice_candidate",
                        data:{
                            "label":evt.candidate.sdpMLineIndex,
                            "candidate":evt.candidate.candidate,
                            "socketId":socketId
                        }
                    }));
                    renegotiating=true;
                    that.emit("pc_get_ice_candidate",evt.candidate,socketId,pc);
                }
            }
        };

        pc.onopen = function() {
            that.emit("pc_opened", socketId, pc);
        };

        pc.onaddstream = function(evt) {
            that.initializedStreams[socketId]++;
            that.emit('pc_add_stream', evt.stream, socketId,pc);
        };

        pc.ondatachannel = function(evt) {
            that.addDataChannel(socketId, evt.channel);
            that.emit('pc_add_data_channel', evt.channel, socketId, pc);
        };
        return pc;
    };

    IndexClient.prototype.closePeerConnection= function (pc) {
      if(!pc)return;
        pc.close();
    };

    IndexClient.prototype.closePCById= function (socketId) {
        this.closePeerConnection(this.peerConnections[socketId]);
        delete  this.peerConnections[socketId];
        delete  this.dataChannels[socketId];
    };




    IndexClient.prototype.createDataChannel= function (socketId, label) {
        //alert(label);
        var pc, key, channel;
        pc = this.peerConnections[socketId];
        if (!socketId) {
            this.emit("data_channel_create_error", socketId, new Error("attempt to create data channel without socket id"));
        }
        if (!(pc instanceof PeerConnection)) {
            this.emit("data_channel_create_error", socketId, new Error("attempt to create data channel without peerConnection"));
        }
        try {
            channel = pc.createDataChannel(label);
        } catch (error) {
            this.emit("data_channel_create_error", socketId, error);
        }
        return this.addDataChannel(socketId, channel);
    };


    IndexClient.prototype.addDataChannel= function (socketId,channel) {
        var that=this;
        channel.onopen = function() {
            that.emit('data_channel_opened', channel, socketId);
        };

        channel.onclose = function(event) {
            delete that.dataChannels[socketId];
            that.emit('data_channel_closed', channel, socketId);
        };

        channel.onmessage= function (message) {
            var json;
            json = JSON.parse(message.data);
            if (json.type === '__file') {
                if(json.signal != null){
                    alert(json.message);
                }else {
                    //console.log(json.fileBuffer);
                    if (window.confirm("是否接受" + json.fileName + " ？")) {
                        var fileInfo = json.fileName,
                            hyperlink = document.createElement("a"),
                            mouseEvent = new MouseEvent('click', {
                                view: window,
                                bubbles: true,
                                cancelable: true
                            });
                        hyperlink.href = json.fileBuffer;
                        hyperlink.target = '_blank';
                        hyperlink.download = fileInfo;
                      //  console.log(hyperlink);
                        hyperlink.dispatchEvent(mouseEvent);
                        (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
                      //  console.log(json.senderSocket);
                        that.dataChannels[json.senderSocket].send(JSON.stringify({
                            type: "__file",
                            signal: 'answer',
                            message: '已发送'
                        }));
                    } else {
                        that.dataChannels[json.senderSocket].send(JSON.stringify({
                            type: "__file",
                            signal: 'answer',
                            message: '对方拒绝接收'
                        }));
                    }
                }

            }
            if(json.type==='__msg'){
                that.emit('data_channel_message', channel, socketId, json.data);
            }
            if(json.type==='vedio'){
                alert("sa");
                that.peerConnections[that.vediosocketId].addStream(that.localMediaStream);
            }
        };

        channel.onerror = function(err) {
            that.emit('data_channel_error', channel, socketId, err);
        };

        this.dataChannels[socketId]=channel;
        return channel;
    };
    //好像没调用
    IndexClient.prototype.sendTextMessage= function (message,socketId) {
        //socketid为对方的socketId
        //alert(this.dataChannels[socketId].readyState.toLowerCase());
        if(this.dataChannels[socketId].readyState.toLowerCase()==='open'){
            //alert(this.dataChannels[socketId]);
            this.dataChannels[socketId].send(JSON.stringify({
                type:"__msg",
                data:message
            }));
        }
        else{
            alert(this.dataChannels[socketId].readyState.toLowerCase());
        }
    };

    //信令交换部分
    IndexClient.prototype.sendOffer= function (socketId) {
        var pc,
            that=this,
            pcCreateOfferCbGen= function (pc, socketId) {
                return function (session_desc) {
                    pc.setLocalDescription(session_desc);
                    that.socket.send(JSON.stringify({
                        "eventName":"__offer",
                        "data":{
                            "sdp":session_desc,
                            "socketId":socketId
                        }
                    }));
                }
            },
            pcCreateOfferErrorCb = function(error) {
                console.log(error);
            };
        pc = that.peerConnections[socketId];
        pc.createOffer(pcCreateOfferCbGen(pc, socketId), pcCreateOfferErrorCb);
    };



    IndexClient.prototype.receiveOffer= function (socketId,sdp) {
        //发送者的socketid
        this.sendAnswer(socketId,sdp);
    };

    IndexClient.prototype.sendAnswer= function (socketId,sdp) {
        var that=this;
        var pc;
        pc=this.peerConnections[socketId];
        pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
        pc.createAnswer(function (session_desc) {
            pc.setLocalDescription(session_desc);
            that.socket.send(JSON.stringify({
                "eventName":"__answer",
                "data":{
                    "socketId":socketId,
                    "sdp":session_desc
                }
            }));
        }, function (error) {
            console.log(error)
        });
    };

    IndexClient.prototype.receiveAnswer= function (socketId,sdp) {
        var pc,that = this;
        pc = this.peerConnections[socketId];
        pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
    };




    //websocket连接后台
    IndexClient.prototype.login= function (server,IndexRoom) {
        var that=this;
        var socket;
        if(that.firstconnect){
            socket=that.socket=io.connect(server);
            that.sendMessage('__login',IndexRoom,socket);
            that.firstconnect=false;
        }else {
            socket.reconnect();
        }
        //将受到消息，触发事件
        //socket.on('message',function(){})接收socket.send()传来的数据
        socket.on('message', function (message) {
            var json=JSON.parse(message);
            if(json.eventName){
                that.emit(json.eventName,json.data);
            }else{
                that.emit("socket_receive_message",socket,json);
            }
        });

        socket.onerror= function (error) {
            that.emit("socket_error",error,socket);
        };
        console.log(socket);
        console.log(this);
        this.on('_someone_login', function (data) {
            //更新所有的socket，还没做，会导致数据通道不能正常
            //socket.reconnect();
            console.log(that);
            console.log(data);
            that.emit('someone_login',data);
        });

        this.on('_someone_logout', function (data,userId) {
            delete  that.initializedStreams[data];
            that.closePCById(data);
            that.emit('someone_logout',data);
            for(var i in this.connections) {
                if(this.connections[i]==userId){
                    this.connections.splice(i,1);
                }
            }
        });

        this.on('_getInvitations',function(data){
            alert("_getInvitations");
            that.emit('getInvitations',data);
        });



        this.on('_offer', function (data) {
            that.receiveOffer(data.socketId,data.sdp);
            that.emit('get_offer',data);
        });

        this.on('_answer', function(data) {
            that.receiveAnswer(data.socketId, data.sdp);
            that.emit('get_answer', data);
        });


        //////////////单人聊天的信令//////////


        //通知邀请者
        this.on('_beginConnect', function (data) {
            that.beginPeerConnection(data);
        });
        //通知被邀请者
        this.on("_ice_candidate", function (data) {
            var candidate=new nativeRTCIceCandidate(data);
            var pc =that.peerConnections[data.socketId];
            pc.addIceCandidate(candidate);
            that.emit("get_ice_candidate",candidate);
        });

        this.on('_getInviteChat', function (data) {
            that.createPeerConnection(data);
            that.emit('getInviteChat',data);
        });

        this.on('_vedioInvitation',function(data){
            that.emit('vedioInvitation',data);
        });

        this.on('_vedioInvitationRefuse',function(data){
            that.emit('vedioInvitationRefuse',data);
        });
    };

    IndexClient.prototype.addStream = function(socketId,options,callback) {
        var that = this;
        if(that.localMediaStream)
        {
            that.peerConnections[socketId].addStream(that.localMediaStream);
            callback(that.localMediaStream);
        }
        else if (getUserMedia) {
            getUserMedia.call(navigator, options, function (stream) {
                    that.localMediaStream = stream;
                    that.peerConnections[socketId].addStream(that.localMediaStream);
                    callback(stream);
                },
                function (error) {
                    alert(error);
                    that.emit("stream_create_error", new Error('WebRTC is not yet supported in this browser.'));
                });
        }
    };

    IndexClient.prototype.attachStream = function(stream, domId) {
        var element = document.getElementById(domId);
        if (navigator.mozGetUserMedia) {
            element.mozSrcObject = stream;
            element.play();
        } else {
            element.src = webkitURL.createObjectURL(stream);
        }
        element.src = webkitURL.createObjectURL(stream);
    };

    IndexClient.prototype.sendVedioInvitation = function(socketId,userId,callback)
    {
        //socketId是对方的socketId，userId是自己的用户名
        var that = this;
        that.vediosocketId=socketId;
        that.addStream(socketId, {
            "video": true,
            //{
            //    mandatory: {
            //        minWidth: 1280,
            //        minHeight: 720
            //    }
            //},
            "audio": true
        }, function (stream) {
            that.sendMessage('__vedioInvitation', {socketId: socketId, userId: userId});
            callback(stream);
        });
    };

    IndexClient.prototype.acceptVedioInvitation = function(socketId,options,callback) {
        var that = this;
        that.addStream(socketId,options,function(stream){
            //alert(socketId);
            that.sendOffer(socketId);
            that.dataChannels[socketId].send(JSON.stringify({
                type:'vedio'
            }));
            callback(stream);
        });
    };

    IndexClient.prototype.refuseVedioInvitation = function(socketId,userId)
    {
        var that = this;
        that.sendMessage('__vedioInvitationRefuse', {socketId: socketId, userId: userId});
    };
    //这个函数需要重新写，但好像有用
    IndexClient.prototype.removeVedio = function(socketId) {
        var that = this;
        var num = 0;
        //that.peerConnections[socketId].removeStream(that.localMediaStream);
        delete that.initializedStreams[socketId];
        that.sendOffer(socketId);
        for (var socketId in that.initializedStreams)
        {
            num +=that.initializedStreams[socketId];
        }
        that.localMediaStream.stop();
        that.localMediaStream=null;
        //if(num===0)
        //{
        //    //that.localMediaStream.stop();
        //    console.log("last one");
        //    that.localMediaStream = null;
        //}
    };

    //文件传输有问题， 不能传很大的文件，只能传很小的文件
    IndexClient.prototype.sendFileToOther= function (dom,socketId) {
        var file=dom.files[0];
        if(file.size/(1024*1024)>100){
            alert("文件不能超过100M");
        }
        var reader=new FileReader();
        var sender=this.socket.id;
        reader.readAsDataURL(file);
        var thiz=this;
        var binaryString;
        var filename=file.name;
        reader.onload= function(evt) {
            binaryString=this.result;
            thiz.dataChannels[socketId].send(JSON.stringify({
                type:"__file",
                fileBuffer:binaryString,
                fileName:filename,
                senderSocket:sender
            }));
        };

    };
    
    
    

    return new IndexClient();
};