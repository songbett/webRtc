


var meetingClient= function () {

    var PeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
    var webkitURL = (window.URL || window.webkitURL || window.msURL || window.oURL);
    var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
    var nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription); // order is very important: "RTCSessionDescription" defined in Nighly but useless
    var moz = !! navigator.mozGetUserMedia;
    var iceServer = {
        "iceServers": [{
            "url": "stun:stun.l.google.com:19302"
        }]
    };


/*                       �¼�������           */


    function EventEmitter() {
        this.events = {};
    }

//���¼�����
    EventEmitter.prototype.on = function (eventName, callback) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(callback);
    };

//�����¼�����
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

    function MeetingClient(){

        //����Socket.io����
        this.socket = null;
        //����media stream
        this.localMediaStream = null;
        this.firstconnect=true;
        //���������뱾��������peer connection�� ��Ϊsocket id��ֵΪPeerConnection����
        this.peerConnections = {};
        //�������е�data channel����Ϊsocket id��ֵͨ��PeerConnectionʵ����createChannel����
        this.dataChannels = {};
        //�������з��ļ���data channel���䷢�ļ�״̬
        this.fileChannels = {};
        //���������뱾�����ӵ�socket��id
        this.connections = [];
        //�������е�data channel����Ϊsocket id��ֵͨ��PeerConnectionʵ����createChannel����
        //this.dataChannels = {};
        //��ʼʱ��Ҫ�������ӵ���Ŀ
        this.numStreams = 0;
        //��ʼʱ�Ѿ����ӵ���Ŀ
        this.initializedStreams = 0;

    }

    MeetingClient.prototype = new EventEmitter();

    MeetingClient.prototype.connect= function (server,room) {
        var that=this;
        var socket;
        if(that.firstconnect){
            socket=that.socket=io.connect(server);
            that.firstconnect=false;

        }
        else{

            socket.reconnect();
        }

        //������Ϣ�������¼�
        socket.on('message', function(message) {
            var json = JSON.parse(message);
            if (json.eventName) {
                that.emit(json.eventName, json.data);
            } else {
                that.emit("socket_receive_message", socket, json);
            }
        });

        socket.onerror = function(error) {
            that.emit("socket_error", error, socket);
        };

        socket.on('disconnect',function(data) {
            var pcs = that.peerConnections;
            for (var i in pcs) {
                that.closePeerConnection(pcs[i]);
            }
            that.peerConnections = {};
            that.dataChannels = {};
            that.fileChannels = {};
            that.connections = [];
            that.fileData = {};
        });

        this.on('ready', function() {
            that.sendMessage('__join', room);
        });

        //Ϊ�¼���ڵ㽨������
        this.on('_new_peer',function(data){
            //alert('_new_peer');
            that.connections.push(JSON.stringify(data));
            var pc = that.createPeerConnection(data.socketId);
            pc.addStream(that.localMediaStream);
            //��û����/////////////
            that.emit('new_peer',data);
        });
        this.on('_peers',function(data){
            //alert('_peers');
            that.connections = data;
            that.createPeerConnections();
            that.addStreams();
            that.addDataChannels();
            that.sendOffers();
            //��û����/////////////
            that.emit('peers',data);
        });

        this.on("_ice_candidate", function(data) {
            var candidate = new nativeRTCIceCandidate(data);
            var pc = that.peerConnections[data.socketId];
            pc.addIceCandidate(candidate);
            //��ûд
            that.emit('get_ice_candidate', candidate);
        });

        this.on('_offer', function(data) {
            that.receiveOffer(data.socketId, data.sdp);
            that.emit("get_offer", data);
        });

        this.on('_answer', function(data) {
            that.receiveAnswer(data.socketId, data.sdp);
            that.emit('get_answer', data);
        });

        this.on('_be_removed',function(data){
            that.emit('socket_closed',socket);
        });

        //�ļ��ϴ���ɣ�֪ͨ�ϴ���
        this.on("_uploadFileFinished", function(data){
            //console.log("uploadSuccess");
            that.emit("stop_progressbar");
        });

        //�ļ��ϴ���ɹ㲥�ط�����Ա
        this.on("_new_Shared_File", function(data){
            that.emit('new_Shared_File',data);
        });

        //��ȡ���й����ļ�
        this.on('_get_all_shared_files',function(data){
            //console.log("_get_all_shared_files+ "+data.files) ;
            that.emit('all_shared_files',data.files);
        });

        //ĳ���˳���Ƶ
        this.on('_someone_logoutroom', function (data) {
            alert(data.userId+"_someone_logoutroom");
            for(var i in this.connections) {
                if(this.connections[i].socketid==data.socketId){
                    this.connections.splice(i,1);
                }
            }
            delete  that.peerConnections[data.socketId];
            that.emit('someone_logoutroom',data.userId);
        });
        //����Ա���˳���Ƶ
        this.on('_manager_logout', function (data) {
            alert(data.userId+'_manager_logout');
            this.connections=[];
            that.peerConnections={};
            that.emit('manager_logout',data.userId);
        });

        //������ϵ���б�
        this.on('_someone_login', function (data) {
            that.emit('someone_login',data);
            });

        this.on('_someone_logout', function (data,userId) {
            that.emit('someone_logout',data);
            });
        this.emit('connected',socket);
    };

    //���û��߳�����
    MeetingClient.prototype.removeUser = function (socketId) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__remove",
            "data": {
                "socketId": socketId
            }
        }));
    };

    MeetingClient.prototype.sendMessage = function (event, message) {
        var socket = this.socket;
        socket.send(JSON.stringify({eventName: event, data: message}));
    };


    /*************************��������*******************************/
        //����������
    MeetingClient.prototype.createStream = function(options) {
        var that = this;
        if (getUserMedia) {
            this.numStreams++;
            getUserMedia.call(navigator, options, function(stream) {
                    that.localMediaStream = stream;
                    that.initializedStreams++;
                    that.emit("stream_created", stream);
                    if(that.initializedStreams === that.numStreams){
                    }
                    if (that.initializedStreams === that.numStreams) {
                        that.emit("ready");
                    }
                },
                function(error) {
                    that.emit("stream_create_error", error);
                });
        } else {
            that.emit("stream_create_error", new Error('WebRTC is not yet supported in this browser.'));
        }
    };

    //�����󶨵�video��ǩ���������
    MeetingClient.prototype.attachStream = function(stream, domId) {
        var element = document.getElementById(domId);
        if (navigator.mozGetUserMedia) {
            element.mozSrcObject = stream;
            element.play();
        } else {
            element.src = webkitURL.createObjectURL(stream);
        }
        element.src = webkitURL.createObjectURL(stream);
    };

    //����������ӵ����е�PeerConnectionʵ����
    MeetingClient.prototype.addStreams = function() {
        var connection;
        for (connection in this.peerConnections) {
            this.peerConnections[connection].addStream(this.localMediaStream);
        }
    };


    /***********************��Ե����Ӳ���*****************************/

        //�����������û����ӵ�PeerConnections
    MeetingClient.prototype.createPeerConnections = function() {
        var i, m;
        var that = this;
        for (i = 0, m = that.connections.length; i < m; i++) {
            var json = JSON.parse(that.connections[i]);
            this.createPeerConnection(json.socketId);
        }
    };

    MeetingClient.prototype.createPeerConnection = function(socketId) {
        var that = this;
        var pc = new PeerConnection(iceServer);
        var renegotiating = false;
        this.peerConnections[socketId] = pc;
        pc.onicecandidate = function(evt) {
            if(renegotiating) return;
            else {
                if (evt.candidate)
                    that.socket.send(JSON.stringify({
                        eventName: "__ice_candidate",
                        data: {
                            "label": evt.candidate.sdpMLineIndex,
                            "candidate": evt.candidate.candidate,
                            "socketId": socketId
                        }
                    }));
                that.emit("pc_get_ice_candidate", evt.candidate, socketId, pc);
                renegotiating = true;
            }
        };

        pc.onopen = function() {
            that.emit("pc_opened", socketId, pc);
        };

        pc.onaddstream = function(evt) {
            for(var i=0;i< that.connections.length;i++)
            {
                var json = JSON.parse(that.connections[i]);
                if(socketId===json.socketId)
                {
                    that.emit('pc_add_stream', evt.stream, socketId, json.userId,pc);
                    break;
                }
            }
        };
        pc.ondatachannel = function(evt) {
            that.addDataChannel(socketId, evt.channel);
            that.emit('pc_add_data_channel', evt.channel, socketId, pc);
        };

        return pc;
    };


    /***********************���������*******************************/

        //������PeerConnection����Offer��������
    MeetingClient.prototype.sendOffers = function() {
        var i, m,
            pc,
            that = this,
            pcCreateOfferCbGen = function(pc, socketId) {
                return function(session_desc) {
                    pc.setLocalDescription(session_desc);
                    that.socket.send(JSON.stringify({
                        "eventName": "__offer",
                        "data": {
                            "sdp": session_desc,
                            "socketId": socketId
                        }
                    }));
                };
            },
            pcCreateOfferErrorCb = function(error) {
                console.log(error);
            };
        for (i = 0, m = this.connections.length; i < m; i++) {
            var json = JSON.parse(this.connections[i]);
            pc = this.peerConnections[json.socketId];
            pc.createOffer(pcCreateOfferCbGen(pc, json.socketId), pcCreateOfferErrorCb);
        }
    };

    //���յ�Offer�����������Ϊ��Ӧ����answer��������
    MeetingClient.prototype.receiveOffer = function(socketId, sdp) {
        //var pc = this.peerConnections[socketId];
        this.sendAnswer(socketId, sdp);
    };

    //����answer��������
    MeetingClient.prototype.sendAnswer = function(socketId, sdp) {
        var pc = this.peerConnections[socketId];
        var that = this;
        pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
        pc.createAnswer(function(session_desc) {
            pc.setLocalDescription(session_desc);
            that.socket.send(JSON.stringify({
                "eventName": "__answer",
                "data": {
                    "socketId": socketId,
                    "sdp": session_desc
                }
            }));
        }, function(error) {
            console.log(error);
        });
    };

    //���յ�answer��������󽫶Է���session����д��PeerConnection��
    MeetingClient.prototype.receiveAnswer = function(socketId, sdp) {
        var pc = this.peerConnections[socketId];
        pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
    };



    /***********************����ͨ������*******************************/

    //�����е�PeerConnections����Data channel
    MeetingClient.prototype.addDataChannels = function() {
        var connection;
        for (connection in this.peerConnections) {
            this.createDataChannel(connection);
        }
    };

    //��ĳһ��PeerConnection����Data channel
    MeetingClient.prototype.createDataChannel = function(socketId, label) {
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


    //ΪData channel����Ӧ���¼��ص�����
    MeetingClient.prototype.addDataChannel = function(socketId, channel) {
        var that = this;
        channel.onopen = function() {
            that.emit('data_channel_opened', channel, socketId);
        };

        channel.onclose = function(event) {
            delete that.dataChannels[socketId];
            that.emit('data_channel_closed', channel, socketId);
        };

        channel.onmessage = function(message) {
            var json;
            json = JSON.parse(message.data);
            if (json.type === '__file') {
                /*that.receiveFileChunk(json);*/
                that.parseFilePacket(json, socketId);
            } else {
                that.emit('data_channel_message', channel, socketId, json.data);
            }
        };

        channel.onerror = function(err) {
            that.emit('data_channel_error', channel, socketId, err);
        };

        this.dataChannels[socketId] = channel;
        return channel;
    };



    //��Ϣ�㲥
    MeetingClient.prototype.broadcast = function(message) {
        var socketId;
        for (socketId in this.dataChannels) {
            this.sendTextMessage(message, socketId);
        }
    };

    //发送消息
    MeetingClient.prototype.sendTextMessage = function(message, socketId) {
        if (this.dataChannels[socketId].readyState.toLowerCase() === 'open') {
            this.dataChannels[socketId].send(JSON.stringify({
                type: "__msg",
                data: message
            }));
        }
        else{
            alert(this.dataChannels[socketId].readyState.toLowerCase());
        }
    };


    //�ϴ��ļ���������
    MeetingClient.prototype.sendFileToServer = function(dom,roomId,userId,progressbar){
        //console.log(roomId+'  '+userId);
        if(typeof dom ==='string'){
            dom = document.getElementById(dom);
        }
        if(!dom){
            console.log("��");
            return;
        }
        if(!dom.files || !dom.files[0]){
            console.log("ûѡ��file");
        }
        var file = dom.files[0];
        if(file.size/(1024*1024) > 100){
            alert("�ϴ��ļ����ܳ���100M");
            return;
        }
        progressbar = document.getElementById(progressbar);
        var socket = this.socket;
        var reader = new FileReader();
        /*reader.onprogress = function(e){
         if(e.lengthComputable){
         var progress = parseInt( ((e.loaded / e.total) * 100), 10 );
         progressbar.setAttribute("style","width:"+progress+"%");
         console.log("�ϴ�����"+progress);
         }
         };
         reader.onloadend = function(e){
         progressbar.parentNode.setAttribute("style","display: none");
         }*/
        reader.readAsBinaryString(file);
        console.log("file is "+file.name+"from socketId: "+socket.id);
        //������Ϻ�
        reader.onload = function loaded(evt){
            var binaryString = this.result;
            progressbar.setAttribute("style","");
            console.log("��ʼ�����ļ� "+file.name+"size "+file.size+" "+file.type,+"len "+binaryString.length);
            socket.send(JSON.stringify({
                eventName: "send_file_from_client",
                data: {
                    fileBuffer:binaryString,
                    fileName:file.name,
                    roomId:roomId,
                    userId:userId
                }}));
        }
    };

    //����������û������Ѿ�����������ļ�
    MeetingClient.prototype.getAllSharedFile = function(roomId){
        var socket = this.socket;
        console.log('���������ļ�');
        socket.send(JSON.stringify({
            eventName: "get_all_shared_files",
            data: {
                roomId:roomId
            }}));
    };



    return new MeetingClient();

};
