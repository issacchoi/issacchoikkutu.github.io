(function(){
	var $stage;
	var LIMIT = 400;
	var LIST;
	
	$(document).ready(function(){
		$stage = {
			list: $("#server-list"),
			total: $("#server-total"),
			start: $("#game-start"),
			ref: $("#server-refresh"),
			refi: $("#server-refresh>i")
		};
		
		var hour = new Date().getHours();
		var NIGHT = (hour<5 || hour>19)?true:false;
		var GAMEBG = "/img/kkutu/gamebg_korea.png";
		$("#Background").attr('src', "").addClass("jt-image").css({
			'background-image': "url("+GAMEBG+")",
			'background-size': "200px 200px"
		});
		$stage.start.prop('disabled', true).on('click', function(e){
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
		$stage.ref.on('click', function(e){
			if($stage.refi.hasClass("fa-spin")){
				return alert(L['serverWait']);
			}
			$stage.refi.addClass("fa-spin");
			setTimeout(seekServers, 1000);
		});
		setInterval(function(){
			$stage.ref.trigger('click');
		}, 60000);
		seekServers();
	});
	function seekServers(){
		$.get("/servers", function(data){
			var sum = 0;
			
			$stage.list.empty();
			LIST = data.list;
			LIMIT = data.max;
			data.list.forEach(function(v, i){
				var status = (v === null) ? "x" : "o";
				var people = (status == "x") ? "-" : (v + " / " + LIMIT);
				var limp = v / LIMIT * 100;
				var $e;
				
				sum += v || 0;
				if(status == "o"){
					if(limp >= 99) status = "q";
					else if(limp >= 90) status = "p";
				}
				$stage.list.append($e = $("<div>").addClass("server").attr('id', "server-" + i)
					.append($("<div>").addClass("server-status ss-" + status))
					.append($("<div>").addClass("server-name").html(L['server_' + i]))
					.append($("<div>").addClass("server-people graph")
						.append($("<div>").addClass("graph-bar").width(limp + "%"))
						.append($("<label>").html(people))
					)
					.append($("<div>").addClass("server-enter").html(L['serverEnter']))
				);
				if(status != "x") $e.on('click', function(e){
					location.href = "/?server=" + i;
				}); else $e.children(".server-enter").html("-");
			});
			$stage.total.html("&nbsp;" + L['TOTAL'] + " " + sum + L['MN']);
			$stage.refi.removeClass("fa-spin");
			$stage.start.prop('disabled', false);
		});
	}
})();