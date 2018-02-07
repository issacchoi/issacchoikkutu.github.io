/**
Rule the words! KKuTu Online
Copyright (C) 2017 JJoriping(op@jjo.kr)
Copyright (C) 2017-2018 KKuTu Korea(admin@kkutu.co.kr)

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
	var LIMIT = 400;
	var LIST;
	var isHoverButton = false;
	function buttonOverAnimate(){
		var width=5200;
		var original=260;
		var times=width/original;
		var originalTimes=times;
		var times_=0.1/times;
		function change(){
			$("#game-start").css("background-position-x", original*times+"px");
			//$("#game-start").css("transform","scale("+(1+times_*(originalTimes-times))+")");
			times--;
			if(times>-1&&isHoverButton) setTimeout(function(){change();},1000/originalTimes);
			else if(!isHoverButton) {
				$("#game-start").css("background-position-x", width);
				//$("#game-start").css("transform","scale(1)");
			}
		}
		change();
	}
	function buttonOverAnimate2($a){
		var times=10;
		var times_=0.1/10;
		function change(){
			$a.css("transform","scale("+(1+times_*(10-times))+")");
			times--;
			if(times>-1&&$a.hasClass('hover')) setTimeout(function(){change();},30);
			else if(!$a.hasClass('hover')) {
				$a.css("transform","scale(1)");
			}
		}
		change();
	}

	$(document).ready(function(){

		var GAMEBG = "/img/kkutu/gamebg_korea.png";
		$("#Background").attr('src', "").addClass("jt-image").css({
			'background-image': "url("+GAMEBG+")",
			'background-size': "200px 200px"
		});
		$("#game-start").mouseover(function(){
			isHoverButton=true;
			buttonOverAnimate();
		});
		$("#game-start").mouseout(function(){
			isHoverButton=false;
			$("#game-start").css("background-position-x", "5200px");
		});
		$("#game-start").click(function(e){
			var i, j;

			for(i=0.9; i<1; i+=0.01){
				for(var j=0;j<LIST.length;j++){
					if(LIST[j] < i * LIMIT){
						$("#server-" + j).click();
						return;
					}
				}
			}
			alert("접속 가능한 서버가 없습니다! 혹시 로그인을 안하셨다면, 로그인을 하신 후 시도해주세요!");
		});
		$(".server-item").each(function(){
			$(this).mouseover(function(){
				$(this).find(".server-head").addClass('hover');
				buttonOverAnimate2($(this).find(".server-head"));
			});
			$(this).mouseout(function(){
				$(this).find(".server-head").removeClass('hover');
				$(this).find(".server-head").css("transform","scale(1)");
			});
		});
		$("#kkuko-status-refresh").click(function(e){
			seekServers();
		});
		setInterval(function(){
			seekServers();
		}, 60000);
		seekServers();
		setslideImage();
	});
	var currentImageNum=0;
	function changeslideImage(num){
		isInterval = num==undefined;
		num = num || currentImageNum;
		for(var i=0;i<$(".slideImage").length;i++)
			if(num != i) $($(".slideImage")[i]).animate({opacity: "0"});
		var $this = $($(".slideImage")[num]);
		$this.animate({opacity: "1"});
		if($this.attr("url"))
			$(".slideImage").css("cursor","pointer");
		else
			$(".slideImage").css("cursor","");
		$this.unbind();
		if($this.attr("url"))
			$this.click(function(){
					window.open($this.attr("url"));
			});
		currentImageNum++;
		if(currentImageNum>=$(".slideImage").length) currentImageNum=0;
		if(isInterval) setTimeout(changeslideImage,4000);
	}
	function setslideImage(){
		$(".slideImage").each(function(index,item){
			if(index==0) $(item).css("opacity","1");
			else $(item).css("opacity","0");
			$(item).css("top","-"+index*270+"px");
			$(".slideImage-List").append($("<div>").addClass("slideImage-Item").attr("image-number",index).click(function(){
				changeslideImage($(this).attr("image-number"));
			}));
		});
		$(".slideImage-List").css("top","-"+((($(".slideImage").length-1)*270)+25)+"px");
		changeslideImage();
	}
	function seekServers(){
		$.get("/servers", function(data){
			var sum = 0;

			LIST = data.list;
			LIMIT = data.max;
			data.list.forEach(function(v, i){
				var status = (v === null) ? "x" : "o";
				var people = (status == "x") ? "" : (v + "/" + LIMIT);
				var limp = v / LIMIT * 100;
				var $e;

				sum += v || 0;
				var statusText;
				if(status == "o"){
					statusText="매우 원활";
					if(limp >= 75){
						status = "r";
						statusText="혼잡";
					}
					else if(limp >= 40) {
						status = "q";
						statusText="보통";
					}
					else if(limp >= 15) {
						status = "p";
						statusText="원활";
					}
				} else if(status == "x")
					statusText = "서버닫힘";
				$($(".server-item")[i]).empty();
				$($(".server-item")[i]).attr('id', "server-" + i)
					.append($("<div>").addClass("server-status-bar ssb-" + status))
					.append($("<div>").addClass("server-head")
						.append($("<div>").addClass("server-name").html(L['server_' + i]))
						.append($("<div>").addClass("server-enter").html(L['serverEnter'])))
					.append($("<div>").addClass("server-status sss-" + status)
						.append($("<label>").addClass("server-status-players").html(people))
						.append($("<label>").addClass("server-status-text").html(statusText)));
				if(status != "x") $($(".server-item")[i]).click(function(e){
					location.href = "/?server=" + i;
				});
				$("#kkuko-status-players").html("▼ 총 " + sum +"명이 접속하고 있습니다. ");
			});

		});
	}
})();
