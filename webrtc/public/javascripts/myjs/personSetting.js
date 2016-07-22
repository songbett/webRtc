/**
 * Created by song on 2016/7/10.
 */
$(document).ready(function () {
    var $popBoxs=$(".pop-box");
    var $passwordChange=$(".password-change a");
    var $emailChange=$(".email-change");
    var $questionChange=$(".question-change");
    var $closePopbox=$(".close-popbox");
    var $ensures=$(".ensure");
    var $cancels=$(".cancel");
    var userId=$(".userId").text();

    var index={
        //�󶨵ĵ���¼�
        clickEvent : function(){
            //�ر�popbox
            for(var i=0;i<$popBoxs.length;i++){
                $closePopbox[i].tmis=i;
                $($closePopbox[i]).on("click",function(){
                    console.log(this.tmis);
                    $($popBoxs[this.tmis]).hide();
                    $(".pop-box input").val("");
                    $("#mask").hide();
                });
            }
            //����޸�����
            $passwordChange.on("click",function(){
                $($popBoxs[0]).show();
                $("#mask").show();

            });
            //����޸�����
            $emailChange.on("click", function () {
                $($popBoxs[1]).show();
                $("#mask").show();
            });
            //��������ܱ�
            $questionChange.on("click",function(){
                $($popBoxs[2]).show();
                $("#mask").show();
            });
            //关闭sucess-box
            $(".success-close").on("click",function(){
                $("#success-box").hide();
                $("#mask").hide();
            });
        },
        //���pop-box��ȡ��
        clickCancel : function () {
            for(var i=0;i<$cancels.length;i++){
                $cancels[i].tmis=i;
                $($cancels[i]).on("click",function(){
                    $($popBoxs[this.tmis]).hide();
                    $(".pop-box input").val("");
                    $("#mask").hide();
                });
            }
        },
        //���pop-box��ȷ��
        clickEnsure : function () {
            for(var i=0;i<$ensures.length;i++){
                $ensures[i].tmis=i;
                $($ensures[i]).on("click",function(){
                    if(this.tmis==0){
                        //�޸������¼�
                        index.changePassword();
                    }
                    if(this.tmis==1){
                        //�޸������¼�
                        index.changeEmail();
                    }
                    if(this.tmis==2){
                        //�����ܱ�����
                        index.changeQuestion();
                    }
                });
            }
        },
        changePassword : function () {
            var originPassword=$(".origin-password").val();
            var newPassword=$(".new-password").val();
            var newPasswordAgain=$(".new-password-again").val();
            console.log(originPassword);
            if(originPassword==""){
                $(".password-error-tips span").text("原密码不能为空");
                $(".password-error-tips").show();
            }else if(newPassword==""){
                $(".password-again-error-tips span").text("新密码不能为空");
                $(".password-again-error-tips").show();
            }else if(newPassword!=newPasswordAgain){
                $(".password-again-error-tips span").text("两次密码不一致");
                $(".password-again-error-tips").show();
            }else{
                var data={"originPassword":originPassword,"newPassword":newPassword,"userId":userId};
                $.ajax({
                    url : '/personSetting-changePassword',
                    type : 'POST',
                    data : data,
                    dataType : 'json',   //不是跨域强制jsonp会返回error被error函数捕捉
                    success : function(data){
                        console.log(data);
                        if(data.success==false){
                            $(".password-again-error-tips span").text(data.info);
                            $(".password-again-error-tips").show();
                        }
                        if(data.success==true){
                            $($popBoxs[0]).hide();
                            $("#success-box").show();
                        }
                    },
                    error : function(){
                        $(".password-again-error-tips span").text("修改错误");
                        $(".password-again-error-tips").show();
                    }
                });
            }
        },
        changeEmail : function(){
            var newEmail=$(".new-email").val();
            if(newEmail==""){
                $(".email-error-tips span").text("邮箱不能为空");
                $(".email-error-tips").show();
            }else{
                var data={"newEmail":newEmail,"userId":userId};
                $.ajax({
                    url : '/personSetting-changeEmail',
                    type : 'POST',
                    data : data,
                    dataType : 'json',
                    success : function(data){
                        if(data.success==true){
                            $($popBoxs[1]).hide();
                            $("#success-box").show();
                        }
                        if(data.success==false){
                            $(".email-again-error-tips span").text(data.info);
                            $(".email-again-error-tips").show();
                        }
                    },
                    error : function(){
                        $(".email-again-error-tips span").text("修改错误");
                        $(".email-again-error-tips").show();
                    }
                });
            }
        },
        changeQuestion : function(){
            var select1=$(".select1").val();
            var select2=$(".select2").val();
            var select3=$(".select3").val();
            var question1=$(".question1").val();
            var question2=$(".question2").val();
            var question3=$(".question3").val();

            if(select1=="请选择您的密保问题"||select1=="请选择您的密保问题"||select1=="请选择您的密保问题"){
                $(".question-error-tips span").text("请补全您的问题");
                $(".question-error-tips").show();
            }else if(question1==""||question2==""||question3==""){
                $(".question-error-tips span").text("回答不能为空");
                $(".question-error-tips").show();
            }else{
                var data={"userId":userId,"select1":select1,"select2":select2,"select3":select3,"question1":question1,"question2":question2,"question3":question3};
                console.log(data);
                $.ajax({
                    url : '/personSetting-changeQuestion',
                    type : 'POST',
                    data : data,
                    dataType : "json",
                    success : function(data){
                        console.log(data);
                        if(data.success==true){
                            $($popBoxs[2]).hide();
                            $("#success-box").show();
                        }
                        if(data.success==false){
                            $(".question-error-tips span").text(data.info);
                            $(".question-error-tips").show();
                        }
                    },
                    error : function(){
                        $(".question-error-tips span").text("设置错误");
                        $(".question-error-tips").show();
                    }

                });
            }

        },
        init : function(){
            this.clickEvent();
            this.clickCancel();
            this.clickEnsure();
        }
    };

    index.init();
});
