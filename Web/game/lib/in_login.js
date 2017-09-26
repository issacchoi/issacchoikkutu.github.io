(function(){
	$(document).ready(function(){
		var fbStatus;
		var fbTimer = setInterval(function(){
			if(!FB) return;
			try{
				FB.getLoginStatus(function(res){
					fbStatus = res;
				});
			}catch(e){
				return;
			}
			clearInterval(fbTimer);
		}, 400);
        Kakao.init('<KAKAO CODE>');
        $(".with-kakao").on("click",function(a){
            Kakao.Auth.login({
                success: function(b) {
                    $.post("/login/kakao", { at: b.access_token }, onLoggedIn);
                },
                fail: function(err) {
                    alert(JSON.stringify(err));
                }
            });
        });
        $(".with-twitter").on('click', function(e){
            redirect("/login/twitter_token");
        });
		$(".with-naver").on('click', function(e){
			var url = "https://nid.naver.com/oauth2.0/authorize?";

			url += "response_type=code&";
			url += "client_id=<NAVER CODE>&";
			url += "redirect_uri="+encodeURI("http://kkutu.co.kr")+"&";
			url += "state="+encodeURI($("#stateKey").html())+"&";

			redirect(url);
		});
		$(".with-facebook").on('click', function(e){
			if(!FB){
				alert("Please wait... (1)");
				return;
			}
			if(!fbStatus){
				FB.getLoginStatus(function(res){ fbStatus = res; });
				alert("Please wait... (2)");
				return;
			}

			if(fbStatus.status == "connected"){
				redirect("/?before="+encodeURI($("#before").html())+"&token="+fbStatus.authResponse.accessToken);
			}else{
				FB.login(function(res){
					if(res.authResponse){
						redirect("/?before="+encodeURI($("#before").html())+"&token="+res.authResponse.accessToken);
					}else{
						history.back();
					}
				});
			}
		});


		function attachSignin(element) {
			auth2.attachClickHandler(element, {},
				function(user) {
					var ar = user.getAuthResponse(true);

					console.log(ar);
					$.post("/login/google?before="+encodeURI($("#before").html()), { it: ar.id_token, at: ar.access_token }, onLoggedIn);
				}, function(error) {
					alert(JSON.stringify(error));
				});
		}
		gapi.load('auth2', function(){
			auth2 = gapi.auth2.init({
			client_id: '<GOOGLE CODE>',
			cookiepolicy: 'single_host_origin',
			});
			attachSignin(document.getElementsByClassName('with-google')[0]);
		});
		function onLoggedIn(res){
			if(res.error) return alert("ERROR " + res.error);
			redirect("/register?before="+encodeURI($("#before").html()));
		}
		function redirect(to){
			$.post("/session/set", { bm: $.cookie('bm') }, function(res){
				$.cookie('prevpage', document.referrer);
				location.href = to;
			});
		}
	});
})();
