/**
 * Created by song on 2016/7/12.
 */
$(document).ready(function(){

    var questionsData;
    var userId;

    var index={
        clickButtons : function(){
            $("#button1").on("click",function(){
               index.getQuestions();
            });
            $("#button2").on("click",function(){
               index.answerQuestions();
            });
        },
        getQuestions : function(){
            userId=$(".userId").val();
            var data={"userId":userId};
            $.ajax({
                url : '/getQuestions',
                type : 'POST',
                data : data,
                dataType : 'json',
                success : function(data){
                    console.log(data);
                    if(data.success==false){
                        $(".error-info").text(data.info).show();
                    }else{
                        $(".error-info").hide();
                        questionsData=data;
                        console.log(data.info.reply1.question1);
                        $(".question1 span").text(data.info.reply1.question1);
                        $(".question2 span").text(data.info.reply2.question2);
                        $(".question3 span").text(data.info.reply3.question3);
                        $(".questions-wrap").show();
                        $("#button1").hide();
                        $("#button2").show();
                    }
                },
                error : function(){
                    $(".error-info").text("查询错误").show();
                }
            })
        },
        answerQuestions : function(){
            var answer1=$(".answer1").val();
            var answer2=$(".answer2").val();
            var answer3=$(".answer3").val();

            if(answer1==questionsData.info.reply1.answer1&&answer2==questionsData.info.reply2.answer2&&answer3==questionsData.info.reply3.answer3){
                $(".pop-box").show();
                $("#mask").show();
            }else{
                $(".error-info").text("答案错误").show();
            }
        },
        clickCancel : function(){
            $(".cancel").on("click",function(){
                $(".pop-box input").val("");
                $(".pop-box").hide();
                $("#mask").hide();
            });
            $(".close-popbox").on("click",function(){
                $(".pop-box").hide();
                $("#mask").hide();
            });

        },
        clickConfirm : function(){
            $(".ensure").on("click",function(){
                var newPassword=$(".new-password").val();
                console.log(newPassword);
                if(newPassword==""){
                    $(".password-error-tips span").text("密码不能为空");
                    $(".password-error-tips").show();
                }else{
                    var data={"newPassword":newPassword,"userId":userId};
                    $.ajax({
                        url : "/resetPassword",
                        type : "POST",
                        data : data,
                        dataType : "json",
                        success : function(data){
                            if(data.success==true){
                                $(".pop-box").hide();
                                $("#success-box").show();
                            }else{
                                $(".password-error-tips span").text(data.info);
                                $(".password-error-tips").show();
                            }
                        },
                        error : function(){
                            $(".password-error-tips span").text("修改密码错误");
                            $(".password-error-tips").show();
                        }
                    })
                }
            })
        },
        clickReturnIndex : function(){
            $(".success-close").on("click",function(){
                window.location.href="/";
            });
        },
        init : function(){
            this.clickButtons();
            this.clickCancel();
            this.clickConfirm();
            this.clickReturnIndex();
        }
    };
    index.init();
});