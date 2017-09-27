/**
Rule the words! KKuTu Online
Copyright (C) 2017 JJoriping(op@jjo.kr)
Copyright (C) 2017 KKuTu Korea(op@kkutu.co.kr)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

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
