(function(){
	var LIMIT = 400;
	var LIST;
	var isHoverButton = false;
	function buttonOverAnimate(){
		var width=3068;
		var original=236;
		var times=width/original;
		var originalTimes=times;
		var times_=0.1/times;
		function change(){
			$("#game-start").css("background-position-x", original*times+"px");
			$("#game-start").css("transform","scale("+(1+times_*(originalTimes-times))+")");
			times--;
			if(times>-1&&isHoverButton) setTimeout(function(){change();},30);
			else if(!isHoverButton) {
				$("#game-start").css("background-position-x", "3068px");
				$("#game-start").css("transform","scale(1)");
			}
		}
		change();
	}
	function buttonOverAnimate2(context){
		var times=10;
		var times_=0.1/10;
		function change(){
			$(context).css("transform","scale("+(1+times_*(10-times))+")");
			times--;
			if(times>-1&&$(context).hasClass('hover')) setTimeout(function(){change();},30);
			else if(!$(context).hasClass('hover')) {
				$(context).css("transform","scale(1)");
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
		$(".server-item").each(function(index,item){
			$(item).mouseover(function(){
				$(this).addClass('hover');
				buttonOverAnimate2(this);
			});
			$(item).mouseout(function(){
				$(this).removeClass('hover');
				$(this).css("transform","scale(1)");
			});
		});
		$("#game-start").mouseover(function(){
			isHoverButton=true;
			buttonOverAnimate();
		});
		$("#game-start").mouseout(function(){
			isHoverButton=false;
			$("#game-start").css("background-position-x", "3068px");
			$("#game-start").css("transform","scale(1)");
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
		$("#server-refresh").click(function(e){
			seekServers();
		});
		setInterval(function(){
			$("#server-refresh").click();
		}, 60000);
		seekServers();
		setCenterImage();
	});
	var currentImageNum=0;
	function changeCenterImage(num){
		isInterval = num==undefined;
		num = num || currentImageNum;
		$($(".centerImage")[num-1<0?$(".centerImage").length-1:num-1]).animate({opacity: "0"});
		$($(".centerImage")[num]).animate({opacity: "1"});
		if($($(".centerImage")[num]).attr("url"))
			$(".centerImage").css("cursor","pointer");
		else
			$(".centerImage").css("cursor","");
		$(".centerPanel").unbind();
		$(".centerPanel").click(function(){
			if($($(".centerImage")[num]).attr("url")) {
				window.open($($(".centerImage")[num]).attr("url"));
			}
		});
		currentImageNum++;
		if(currentImageNum>=$(".centerImage").length) currentImageNum=0;
		if(isInterval) setTimeout(changeCenterImage,5000);
	}
	function setCenterImage(){
		$(".centerImage").each(function(index,item){
			if(index==0) $(item).css("opacity","1");
			else $(item).css("opacity","0");
			$(item).css("top","-"+index*350+"px");
			$(".centerImage-List").append($("<div>").addClass("centerImage-Item").attr("image-number",index).click(function(){
				changeCenterImage($(this).attr("image-number"));
			}));
		});
		$(".centerImage-List").css("top","-"+((($(".centerImage").length-1)*350)+25)+"px");
		changeCenterImage();
	}
	function seekServers(){
		$.get("/servers", function(data){
			var sum = 0;
			
			LIST = data.list;
			LIMIT = data.max;
			data.list.forEach(function(v, i){
				var status = (v === null) ? "x" : "o";
				var people = (status == "x") ? "-" : (v + " / " + LIMIT);
				var limp = v / LIMIT * 100;
				var $e;
				
				sum += v || 0;
				var statusText;
				if(status == "o"){
					statusText="원활";
					if(limp >= 99){
						status = "q";
						statusText="혼잡";
					}
					else if(limp >= 90) {
						status = "p";
						statusText="보통";
					}
				} else if(status == "x")
					statusText = "X";
				$($(".server-item")[i]).empty();
				$($(".server-item")[i]).attr('id', "server-" + i)
					.append($("<div>").addClass("server-name").html(L['server_' + i]))
					.append($("<div>").addClass("server-enter").html(L['serverEnter']))
					.append($("<div>").addClass("server-status")
						.append($("<div>").addClass("server-status-circle ss-" + status))
						.append($("<label>").addClass("server-status-text").html(statusText))
						.append($("<label>").addClass("server-status-players").html(people)))
					.append(
						$("<div>").addClass("server-people graph")
						.append($("<div>").addClass("graph-bar").width(limp + "%"))
					);
				if(status != "x") $($(".server-item")[i]).click(function(e){
					location.href = "/?server=" + i;
				}); else $($(".server-item")[i]).children(".server-enter").html("접속불가");
				$("#server-players").html("총 " + sum +"명 접속");
			});
			
		});
	}
})();