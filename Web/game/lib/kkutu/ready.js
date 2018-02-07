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

$(document).ready(function(){
	document.onkeyup = function(e){
		if(e.keyCode == 231){
			kkAlert("시스템 정책에 의해 연결이 끊어졌습니다. 카페에 문의해주세요.");
			if(ws){
				ws.close();
			}
	}
	};

	var i;

	$data.PUBLIC = $("#PUBLIC").html() == "true";
	$data.URL = $("#URL").html();
	$data.version = $("#version").html();
	$data.server = location.href.match(/\?.*server=(\d+)/)[1];
	$data.shop = {};
	$data._okg = 0;
	$data._playTime = 0;
	$data._kd = "";
	$data._timers = [];
	$data._obtain = [];
	$data._wblock = {};
	$data._shut = {};
	$data._lastchat = "";
	$data._tcnt = 0;
	$data.usersR = {};
	$data.users = {};
	EXP.push(getRequiredScore(1));
	for(i=2; i<MAX_LEVEL; i++){
		EXP.push(EXP[i-2] + getRequiredScore(i));
	}
	EXP[MAX_LEVEL - 1] = Infinity;
	EXP.push(Infinity);
	$stage = {
		loading: $("#Loading"),
		lobby: {
			userListTitle: $(".UserListBox .product-title"),
			userList: $(".UserListBox .product-body"),
			roomListTitle: $(".RoomListBox .product-title"),
			roomList: $(".RoomListBox .product-body"),
			createBanner: $("<div>").addClass("rooms-item rooms-create").append($("<div>").html(L['newRoom']))
		},
		chat: $("#Chat"),
		chatLog: $("#chat-log-board"),
		talk: $("#TalkX"),
		chatBtn: $("#ChatBtn"),
		menu: {
			help: $("#HelpBtn"),
			setting: $("#SettingBtn"),
			community: $("#CommunityBtn"),
			newRoom: $("#NewRoomBtn"),
			setRoom: $("#SetRoomBtn"),
			quickRoom: $("#QuickRoomBtn"),
			spectate: $("#SpectateBtn"),
			shop: $("#ShopBtn"),
			dict: $("#DictionaryBtn"),
			wordPlus: $("#WordPlusBtn"),
			invite: $("#InviteBtn"),
			practice: $("#PracticeBtn"),
			ready: $("#ReadyBtn"),
			start: $("#StartBtn"),
			exit: $("#ExitBtn"),
			exitresv: $("#ExitResvBtn"),
			notice: $("#NoticeBtn"),
			replay: $("#ReplayBtn"),
			leaderboard: $("#LeaderboardBtn"),
			userlist: $("#CurrentUserBtn")
		},
		dialog: {
			setting: $("#SettingDiag"),
				settingTheme: $("#setting-theme"),
				settingServer: $("#setting-server"),
				settingOK: $("#setting-ok"),
			community: $("#CommunityDiag"),
				commFriends: $("#comm-friends"),
				commFriendAdd: $("#comm-friend-add"),
			room: $("#RoomDiag"),
				roomOK: $("#room-ok"),
			quick: $("#QuickDiag"),
				quickOK: $("#quick-ok"),
			result: $("#ResultDiag"),
				resultOK: $("#result-ok"),
				resultSave: $("#result-save"),
			practice: $("#PracticeDiag"),
				practiceOK: $("#practice-ok"),
			dict: $("#DictionaryDiag"),
				dictInjeong: $("#dict-injeong"),
				dictSearch: $("#dict-search"),
			wordPlus: $("#WordPlusDiag"),
				wordPlusOK: $("#wp-ok"),
			invite: $("#InviteDiag"),
				inviteList: $(".invite-board"),
				inviteRobot: $("#invite-robot"),
			roomInfo: $("#RoomInfoDiag"),
				roomInfoJoin: $("#room-info-join"),
			profile: $("#ProfileDiag"),
				profileShut: $("#profile-shut"),
				profileHandover: $("#profile-handover"),
				profileKick: $("#profile-kick"),
				profileReport: $("#profile-report"),
				profileLevel: $("#profile-level"),
				profileDress: $("#profile-dress"),
				profileWhisper: $("#profile-whisper"),
			report: $("#ReportDialog"),
				reportOK: $("#report-ok"),
			newnick: $("#NewNickDialog"),
				newnickOK: $("#newnick-ok"),
			kickVote: $("#KickVoteDiag"),
				kickVoteY: $("#kick-vote-yes"),
				kickVoteN: $("#kick-vote-no"),
			purchase: $("#PurchaseDiag"),
				purchaseOK: $("#purchase-ok"),
				purchaseNO: $("#purchase-no"),
			replay: $("#ReplayDiag"),
				replayView: $("#replay-view"),
			leaderboard: $("#LeaderboardDiag"),
				lbTable: $("#ranking tbody"),
				lbPage: $("#lb-page"),
				lbNext: $("#lb-next"),
				lbMe: $("#lb-me"),
				lbPrev: $("#lb-prev"),
			dress: $("#DressDiag"),
				dressOK: $("#dress-ok"),
			charFactory: $("#CharFactoryDiag"),
				cfCompose: $("#cf-compose"),
			injPick: $("#InjPickDiag"),
				injPickAll: $("#injpick-all"),
				injPickNo: $("#injpick-no"),
				injPickOK: $("#injpick-ok"),
			chatLog: $("#ChatLogDiag"),
			obtain: $("#ObtainDiag"),
				obtainOK: $("#obtain-ok"),
			help: $("#HelpDiag"),
			message: $("#MessageDiag"),
			notice: $("#NoticeDialog"),
				noticeOK: $("#notice-ok"),
				noticeNolook: $("#notice-nolook"),
			theme: $("#ThemeSelectDialog"),
				themeClassic: $("#theme-classic"),
				themeKkuko: $("#theme-kkuko"),
		},
		box: {
			chat: $(".ChatBox"),
			userList: $(".UserListBox"),
			roomList: $(".RoomListBox"),
			shop: $(".ShopBox"),
			quest: $(".QuestBox"),
			room: $(".RoomBox"),
			game: $(".GameBox"),
			me: $(".MeBox")
		},
		game: {
			display: $(".jjo-display"),
			hints: $(".GameBox .hints"),
			cwcmd: $(".GameBox .cwcmd"),
			pqcmd: $(".GameBox .pqcmd"),
			bb: $(".GameBox .bb"),
			items: $(".GameBox .items"),
			chain: $(".GameBox .chain"),
			round: $(".rounds"),
			here: $(".game-input").hide(),
			hereText: $("#game-input"),
			history: $(".history"),
			roundBar: $(".jjo-round-time .graph-bar"),
			turnBar: $(".jjo-turn-time .graph-bar")
		},
		yell: $("#Yell").hide(),
		balloons: $("#Balloons")
	};
	if(!$.cookie("nnl")) showDialog($stage.dialog.notice);
	if(_WebSocket == undefined){
		loading(L['websocketUnsupport']);
		alert(L['websocketUnsupport']);
		return;
	}
	$data.opts = $.cookie('kks');
	if($data.opts){
		applyOptions(JSON.parse($data.opts));
	} else {
		applyOptions([]);
	}
	$data.selectedBGM = $data.opts.sb === undefined ? "original" : $data.opts.sb;
	$data._soundList = [
		{ key: "k", value: "/media/kkutu/"+$data.selectedBGM+"/k.mp3" },
		{ key: "lobby", value: "/media/kkutu/"+$data.selectedBGM+"/LobbyBGM.mp3" },
		{ key: "jaqwi", value: "/media/kkutu/"+$data.selectedBGM+"/JaqwiBGM.mp3" },
		{ key: "jaqwiF", value: "/media/kkutu/"+$data.selectedBGM+"/JaqwiFastBGM.mp3" },
		{ key: "game_start", value: "/media/kkutu/"+$data.selectedBGM+"/game_start.mp3" },
		{ key: "round_start", value: "/media/kkutu/"+$data.selectedBGM+"/round_start.mp3" },
		{ key: "fail", value: "/media/kkutu/"+$data.selectedBGM+"/fail.mp3" },
		{ key: "timeout", value: "/media/kkutu/"+$data.selectedBGM+"/timeout.mp3" },
		{ key: "lvup", value: "/media/kkutu/"+$data.selectedBGM+"/lvup.mp3" },
		{ key: "Al", value: "/media/kkutu/"+$data.selectedBGM+"/Al.mp3" },
		{ key: "success", value: "/media/kkutu/"+$data.selectedBGM+"/success.mp3" },
		{ key: "missing", value: "/media/kkutu/"+$data.selectedBGM+"/missing.mp3" },
		{ key: "mission", value: "/media/kkutu/"+$data.selectedBGM+"/mission.mp3" },
		{ key: "kung", value: "/media/kkutu/"+$data.selectedBGM+"/kung.mp3" },
		{ key: "horr", value: "/media/kkutu/"+$data.selectedBGM+"/horr.mp3" },
	];
	for(i=0; i<=10; i++) $data._soundList.push(
		{ key: "T"+i, value: "/media/kkutu/"+$data.selectedBGM+"/T"+i+".mp3" },
		{ key: "K"+i, value: "/media/kkutu/"+$data.selectedBGM+"/K"+i+".mp3" },
		{ key: "As"+i, value: "/media/kkutu/"+$data.selectedBGM+"/As"+i+".mp3" }
	);

	MOREMI_PART = $("#MOREMI_PART").html().split(',');
	AVAIL_EQUIP = $("#AVAIL_EQUIP").html().split(',');
	RULE = JSON.parse($("#RULE").html());
	OPTIONS = JSON.parse($("#OPTIONS").html());
	MODE = Object.keys(RULE);
	mobile = $("#mobile").html() == "true";
	if(mobile) TICK = 200;
	$data._timePercent = false ? function(){
		return $data._turnTime / $data.turnTime * 100 + "%";
	} : function(){
		var pos = $data._turnSound.audio ? $data._turnSound.audio.currentTime : (audioContext.currentTime - $data._turnSound.startedAt);

		return (100 - pos/$data.turnTime*100000) + "%";
	};
	$data.setRoom = function(id, data){
		var isLobby = getOnly() == "for-lobby";

		if(data == null){
			delete $data.rooms[id];
			if(isLobby) $("#room-" + id).remove();
		}else{
			// $data.rooms[id] = data;
			if(isLobby && !$data.rooms[id]) $stage.lobby.roomList.append($("<div>").attr('id', "room-" + id));
			$data.rooms[id] = data;
			if(isLobby) $("#room-" + id).replaceWith(roomListBarHTML(data));
		}
		// updateRoomList();
	};
	$data.setUser = function(id, data){
		var only = getOnly();
		var needed = only == "for-lobby" || only == "for-master";
		var $obj;

		if($data._replay){
			$rec.users[id] = data;
			return;
		}
		if(data == null){
			delete $data.users[id];
			if(needed) $("#users-item-" + id + ",#invite-item-" + id).remove();
		}else{
			if(needed && !$data.users[id]){
				$obj = userListBarHTML(data, only == "for-master");

				if(only == "for-master") $stage.dialog.inviteList.append($obj);
				else $stage.lobby.userList.append($obj);
			}
			$data.users[id] = data;
			if(needed){
				var oid = (only == "for-master" ? 'invite-item-' : 'users-item-') + data.id;
				if($obj) $("#" + oid).replaceWith($obj);
				else $("#" + ((only == "for-lobby") ? "users-item-" : "invite-item") + id).replaceWith(userListBarHTML(data, only == "for-master"));
			}
		}
	};

	loadSounds($data._soundList, function(){
		processShop(connect);
	});
	delete $data._soundList;

// 전역 함수 설정
	kkAlert = function(msg) {
		var o = $stage.dialog.message;
		var ov = $('#msg-overlay');
		if (o.data('callback')) {
			o.data('callback')(false);
			o.data({});
		}
		if (!ov.length) {
			o.parent().append(ov = $('<div />', {id:'msg-overlay',style:'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.3;background:black;'}));
		}
		o.find('#msg-ok').off('click').click(function(e) { o.hide(); ov.hide(); });
		o.find('#msg-no').off('click').click(function(e) { o.hide(); ov.hide(); });
		o.find('#msg-no').hide();
		ov.show();
		o.find('#msg-content').html(msg);
		showDialog(o);
	};
	kkConfirm = function(msg, cb, modal) {
		var o = $stage.dialog.message;
		if (o.data('callback')) {
			o.data('callback')(false);
			o.data({});
		}
		o.data({callback:cb});
		var ov = $('#msg-overlay');
		if (!ov.length) {
			o.parent().append(ov = $('<div />', {id:'msg-overlay',style:'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.3;background:black;'}));
		}
		o.find('#msg-ok').off('click').click(function(e) { o.hide(); ov.hide(); if (o.data('callback')){ o.data('callback')(true); o.data({}); }});
		o.find('#msg-no').off('click').click(function(e) { o.hide(); ov.hide(); if (o.data('callback')){ o.data('callback')(false); o.data({}); }});
		o.find('#msg-no').show();
		if (!modal) ov.hide();
		o.find('#msg-content').html(msg);
		showDialog(o);
	};

	$stage.talk.prop("id", "UserMessage"+Math.round(Math.random()*100000));
	if (mobile) $stage.talk.addClass("Xchar");
	else $stage.talk.attr("style", "float: left; border-right: none; border-top-right-radius: 0px; border-bottom-right-radius: 0px; margin-top: 5px; width: calc(100% - 82px); height: 20px;");
// 객체 설정
	/*addTimeout(function(){
		$("#intro-start").hide();
		$("#intro").show();
	}, 1400);*/
	$(document).on('paste', function(e){
		if($data.room) if($data.room.gaming){
			e.preventDefault();
			return false;
		}
	});
	$stage.talk.on('drop', function(e){
		if($data.room) if($data.room.gaming){
			e.preventDefault();
			return false;
		}
	});
	$(".dialog-head .dialog-title").on('mousedown', function(e){
		var $pd = $(e.currentTarget).parents(".dialog");

		$(".dialog-front").removeClass("dialog-front");
		$pd.addClass("dialog-front");
		startDrag($pd, e.pageX, e.pageY);
	}).on('mouseup', function(e){
		stopDrag();
	});
	// addInterval(checkInput, 1);
	$stage.chatBtn.on('click', function(e){
		checkInput();
		if (e.pageX !== undefined && !e.pageX) {
			onMessage({type: 'error', code: 409});
			var JSe = null;
			try {
				JSe = JSON.stringify(e);
			} catch (e) {
				JSe = "JSON";
			}
			send('weird_data', {data: 'weird3', event: JSe}, true);
			if (ws) ws.close();
			clearInterval(htime);
		}
		var value = (mobile && $stage.game.here.is(':visible'))
			? $stage.game.hereText.val()
			: $stage.talk.val();
		if ($data._tcnt < value.length && value.length && $data.room && $data.room.gaming) {
			var JSe = null;
			try {
				JSe = JSON.stringify(e);
			} catch (e) {
				JSe = "JSON";
			}
			//onMessage({type: 'error', code: 409});
			var m = value.match(/[ㄱ-ㅎ]/g);
			if (!m || m && (m.length/value.length) <= 0.3)
				send('game_input', {data: 'cat1', tcnt: $data._tcnt, value: value, event: JSe}, true);
			//if (ws) ws.close();
			//clearInterval(htime);
		}
		$data._tcnt = 0;
		var o = { value: value };
		if(!value) return;
		if(o.value[0] == "/"){
			o.cmd = o.value.split(" ");
			runCommand(o.cmd);
		}else{
			if($stage.game.here.is(":visible") || $data._relay || ($data.room?($data.room.mode == 14 && $data.room.gaming):false)){
				o.relay = true;
			}
			if (!$data.room) {
				if ($data._lastchat == o.value && $data._lastchat.length > 50)
					chat($data.users[$data.id].profile, o.value);
				else send('talk', o);
			} else send('talk', o);
			$data._lastchat = o.value;
			_setTimeout(function() {
				$data._lastchat = "";
			}, 10000);
			//console.log("["+$data._lastchat.length+"] "+$data._lastchat);
		}
		if($data._whisper){
			$stage.talk.val("/e " + $data._whisper + " ");
			delete $data._whisper;
		}else{
			$stage.talk.val("");
		}
		$stage.game.hereText.val("");
	}).hotkey($stage.talk, 13).hotkey($stage.game.hereText, 13);
	$("#cw-q-input").on('keydown', function(e){
		if(e.keyCode == 13){
			var $target = $(e.currentTarget);
			var value = $target.val();
			var o = { relay: true, data: $data._sel, value: value };

			if(!value) return;
			send('talk', o);
			$target.val("");
		}
	}).on('focusout', function(e){
		$(".cw-q-body").empty();
		$stage.game.cwcmd.css('opacity', 0);
	});
	$("#room-limit").on('change', function(e){
		var $target = $(e.currentTarget);
		var value = $target.val();

		if(value < 2 || value > 8){
			$target.css('color', "#FF4444");
		}else{
			$target.css('color', "");
		}
	});
	$("#room-round").on('change', function(e){
		var $target = $(e.currentTarget);
		var value = $target.val();

		if(value < 1 || value > 10){
			$target.css('color', "#FF4444");
		}else{
			$target.css('color', "");
		}
	});
	$stage.game.here.on('click', function(e){
		mobile || $stage.talk.focus();
	});
	$stage.game.hereText.on('keyup', function(e){
		if (e.keyCode && e.which) $data._tcnt++;
	});
	$stage.talk.on('keyup', function(e){
		if (e.keyCode && e.which) $data._tcnt++;
		$stage.game.hereText.val($stage.talk.val());
	});
	$(window).on('beforeunload', function(e){
		return "정말로 나가시겠습니까?";
	});
	function startDrag($diag, sx, sy){
		var pos = $diag.position();
		$(window).on('mousemove', function(e){
			var dx = e.pageX - sx, dy = e.pageY - sy;

			$diag.css('left', pos.left + dx);
			$diag.css('top', pos.top + dy);
		});
	}
	function stopDrag($diag){
		$(window).off('mousemove');
	}
	$(".result-me-gauge .graph-bar").addClass("result-me-before-bar");
	$(".result-me-gauge")
		.append($("<div>").addClass("graph-bar result-me-current-bar"))
		.append($("<div>").addClass("graph-bar result-me-bonus-bar"));
// 메뉴 버튼
	for(i in $stage.dialog){
		var d = $stage.dialog[i];
		if(d.children(".dialog-head").hasClass("no-close")) continue;

		d.children(".dialog-head").append($("<div>").addClass("closeBtn").on('click', function(e){
			if ($("#msg-overlay").is(":visible")) $("#msg-overlay").hide();
			if ($("#msg-no").is(":visible") && d.data('callback')) {
				d.data('callback')(false);
				d.data({});
			}
			$(e.currentTarget).parent().parent().hide();
		}).hotkey(false, 27));
	}
	$stage.menu.help.on('click', function(e){
		$("#help-board").attr('src', "/help");
		showDialog($stage.dialog.help);
	});
	$stage.menu.setting.on('click', function(e){
		showDialog($stage.dialog.setting);
	});
	$stage.menu.community.on('click', function(e){
		if($data.guest) return fail(451);
		showDialog($stage.dialog.community);
	});
	$stage.dialog.commFriendAdd.on('click', function(e){
		var id = prompt(L['friendAddNotice']);

		if(!id) return;
		if(!$data.users[id]) return fail(450);

		send('friendAdd', { target: id }, true);
	});
	$stage.menu.newRoom.on('click', function(e){
		var $d;

		$stage.dialog.quick.hide();

		$data.typeRoom = 'enter';
		showDialog($d = $stage.dialog.room);
		$d.find(".dialog-title").html(L['newRoom']);
	});
	$stage.menu.setRoom.on('click', function(e){
		var $d;
		var rule = RULE[MODE[$data.room.mode]];
		var i, k;

		$data.typeRoom = 'setRoom';
		$("#room-title").val($data.room.title);
		$("#room-limit").val($data.room.limit);
		$("#room-mode").val($data.room.mode).trigger('change');
		$("#room-round").val($data.room.round);
		$("#room-time").val($data.room.time);
		for(i in OPTIONS){
			k = OPTIONS[i].name.toLowerCase();
			$("#room-" + k).attr('checked', $data.room.opts[k]);
		}
		$data._injpick = $data.room.opts.injpick;
		showDialog($d = $stage.dialog.room);
		$d.find(".dialog-title").html(L['setRoom']);
	});
	function updateGameOptions(opts, prefix){
		var i, k;

		for(i in OPTIONS){
			k = OPTIONS[i].name.toLowerCase();
			if(k=="gentle"){
				$("#" + prefix + "-" + k).change(function(){
					if($(this).is(':checked'))
						$("#" + prefix + "-manner").attr("checked",false);
				});
			} else if(k=="manner"){
				$("#" + prefix + "-" + k).change(function(){
					if($(this).is(':checked'))
						$("#" + prefix + "-gentle").attr("checked",false);
				});
			}
			if(opts.indexOf(i) == -1) $("#" + prefix + "-" + k + "-panel").hide();
			else $("#" + prefix + "-" + k + "-panel").show();
		}
	}
	function getGameOptions(prefix){
		var i, name, opts = {};

		for(i in OPTIONS){
			name = OPTIONS[i].name.toLowerCase();

			if($("#" + prefix + "-" + name).is(':checked')) opts[name] = true;
		}
		return opts;
	}
	function isRoomMatched(room, mode, opts, all, isBeginner){
		var i;

		if (room.opts.onlybeginner && !isBeginner) return false;
		if(!all){
			if(room.gaming) return false;
			if(room.password) return false;
			if(room.players.length >= room.limit) return false;
		}
		if(room.mode != mode) return false;
		for(i in opts) if(!room.opts[i]) return false;
		return true;
	}
	$("#quick-mode, #QuickDiag .game-option").on('change', function(e){
		var val = $("#quick-mode").val();
		var ct = 0;
		var i, opts;
		var isBeginner = getLevel($data.users[$data.id].data.score) <= 25;

		if(e.currentTarget.id == "quick-mode"){
			$("#QuickDiag .game-option").prop('checked', false);
		}
		opts = getGameOptions('quick');
		updateGameOptions(RULE[MODE[val]].opts, 'quick');
		for(i in $data.rooms){
			if(isRoomMatched($data.rooms[i], val, opts, true, isBeginner)) ct++;
		}
		$("#quick-status").html(L['quickStatus'] + " " + ct);
	});
	$stage.menu.quickRoom.on('click', function(e){
		$stage.dialog.room.hide();
		showDialog($stage.dialog.quick);
		if($stage.dialog.quick.is(':visible')){
			$("#QuickDiag>.dialog-body").find("*").prop('disabled', false);
			$("#quick-mode").trigger('change');
			$("#quick-queue").html("");
			$stage.dialog.quickOK.removeClass("searching").html(L['OK']);
		}
	});
	$stage.dialog.quickOK.on('click', function(e){
		var mode = $("#quick-mode").val();
		var opts = getGameOptions('quick');
		var isBeginner = getLevel($data.users[$data.id].data.score) <= 25;

		if(getOnly() != "for-lobby") return;
		if($stage.dialog.quickOK.hasClass("searching")){
			$stage.dialog.quick.hide();
			quickTick();
			$stage.menu.quickRoom.trigger('click');
			return;
		}
		$("#QuickDiag>.dialog-body").find("*").prop('disabled', true);
		$stage.dialog.quickOK.addClass("searching").html("<i class='fa fa-spinner fa-spin'></i> " + L['NO']).prop('disabled', false);
		$data._quickn = 0;
		$data._quickT = addInterval(quickTick, 1000);
		function quickTick(){
			var i, arr = [];

			if(!$stage.dialog.quick.is(':visible')){
				clearTimeout($data._quickT);
				return;
			}
			$("#quick-queue").html(L['quickQueue'] + " " + prettyTime($data._quickn++ * 1000));
			for(i in $data.rooms){
				if(isRoomMatched($data.rooms[i], mode, opts, undefined, isBeginner)) arr.push(i);
			}
			if(arr.length){
				i = arr[Math.floor(Math.random() * arr.length)];
				$data._preQuick = true;
				$("#room-" + i).trigger('click');
			}
		}
	});
	$("#room-mode").on('change', function(e){
		var v = $("#room-mode").val();
		var rule = RULE[MODE[v]];
		$("#game-mode-expl").html(L['modex' + v]);

		updateGameOptions(rule.opts, 'room');

		$data._injpick = [];
		if(rule.opts.indexOf("ijp") != -1) $("#room-injpick-panel").show();
		else $("#room-injpick-panel").hide();
		if(rule.rule == "Typing") $("#room-round").val(3);
		$("#room-time").children("option").each(function(i, o){
			$(o).html(rule.time[i] + L['SECOND']).val(rule.time[i]);
		});
		if(rule.rule == "PictureQuiz") $(".pqoption").show();
		else $(".pqoption").hide();
	}).trigger('change');
	$stage.menu.spectate.on('click', function(e){
		var mode = $stage.menu.spectate.hasClass("toggled");

		if(mode){
			send('form', { mode: "J" });
			$stage.menu.spectate.removeClass("toggled");
		}else{
			send('form', { mode: "S" });
			$stage.menu.spectate.addClass("toggled");
		}
	});
	$stage.menu.shop.on('click', function(e){
		if($data._shop = !$data._shop){
			loadShop("time");
			$stage.menu.shop.addClass("toggled");
		}else{
			$stage.menu.shop.removeClass("toggled");
		}
		updateUI();
	});
	$stage.menu.userlist.on('click', function(e){
		if($stage.box.userList.is(":visible")){
			$stage.menu.userlist.removeClass("toggled");
		}else{
			$stage.menu.userlist.addClass("toggled");
		}
		updateUI();
	});
	$(".shop-type").on('click', function(e){
		var $target = $(e.currentTarget);
		var type = $target.attr('id').slice(10);
		var searchVal = $("#shop-searchbox").val();

		$(".shop-type.selected").removeClass("selected");
		$target.addClass("selected");

		filterShop(type == 'all' || $target.attr('value'), searchVal);
	});
	$("#shop-searchbox").on('keyup', function(e){
		var $target = $(".shop-type.selected");
		var type = $target.attr('id').slice(10);
		var searchVal = $("#shop-searchbox").val();

		$(".shop-type.selected").removeClass("selected");
		$target.addClass("selected");

		filterShop(type == 'all' || $target.attr('value'), searchVal);
	});
	$stage.menu.dict.on('click', function(e){
		showDialog($stage.dialog.dict);
	});
	$stage.menu.wordPlus.on('click', function(e){
		showDialog($stage.dialog.wordPlus);
	});
	$stage.menu.invite.on('click', function(e){
		showDialog($stage.dialog.invite);
		updateUserListHTML(true);
	});
	$stage.menu.practice.on('click', function(e){
		if(RULE[MODE[$data.room.mode]].ai){
			$("#PracticeDiag .dialog-title").html(L['practice']);
			$("#ai-team").val(0).prop('disabled', true);
			showDialog($stage.dialog.practice);
		}else{
			send('practice', { level: -1 });
		}
	});
	$stage.menu.ready.on('click', function(e){
		send('ready');
	});
	$stage.menu.start.on('click', function(e){
		send('start');
	});
	$stage.menu.exit.on('click', function(e){
		if($data.room.gaming){
			if($data._spectate || $data.practicing || !$data.room.opts.noleave){
			//연습이나 관전 중애는 즉시 나가기
			if(!confirm(L['sureExit'])) return;
		clearGame();
		send('leave');
		} else {
		if(!$data.exitresv){
			kkAlert("이 방은 중간퇴장이 불가능합니다. 게임 종료 후 자동으로 이 방에서 나가집니다.");
			$data.exitresv = true;
			$("#ExitBtn").addClass("toggled");
		} else {
		$data.exitresv = false;
		$("#ExitBtn").removeClass("toggled");
		}
	}
		} else {
		send('leave');
		}
	});
	$stage.menu.exitresv.on('click', function(e){
		if($data._spectate || $data.practicing || !$data.room.opts.noleave){
			//연습이나 관전 중애는 즉시 나가기
		clearGame();
		send('leave');
		} else {
		if(!$data.exitresv){
			kkAlert("이 방은 중간퇴장이 불가능합니다. 게임 종료 후 자동으로 이 방에서 나가집니다.");
			$data.exitresv = true;
			$("#ExitResvBtn").addClass("toggled");
		} else {
		$data.exitresv = false;
		$("#ExitResvBtn").removeClass("toggled");
		}
	}
	});
	$stage.menu.replay.on('click', function(e){
		if($data._replay){
			replayStop();
		}
		showDialog($stage.dialog.replay);
		initReplayDialog();
		if($stage.dialog.replay.is(':visible')){
			$("#replay-file").trigger('change');
		}
	});
	$stage.menu.leaderboard.on('click', function(e){
		$data._lbpage = 0;
		if($stage.dialog.leaderboard.is(":visible")){
			$stage.dialog.leaderboard.hide();
		}else $.get("/ranking", function(res){
			drawLeaderboard(res);
			showDialog($stage.dialog.leaderboard);
		});
	});
	$stage.dialog.lbPrev.on('click', function(e){
		$(e.currentTarget).attr('disabled', true);
		$.get("/ranking?p=" + ($data._lbpage - 1), function(res){
			drawLeaderboard(res);
		});
	});
	$stage.dialog.lbMe.on('click', function(e){
		$(e.currentTarget).attr('disabled', true);
		$.get("/ranking?id=" + $data.id, function(res){
			drawLeaderboard(res);
		});
	});
	$stage.dialog.lbNext.on('click', function(e){
		$(e.currentTarget).attr('disabled', true);
		$.get("/ranking?p=" + ($data._lbpage + 1), function(res){
			drawLeaderboard(res);
		});
	});
	$stage.dialog.settingTheme.on('click', function(e){
		var o = $stage.dialog.theme;
		o.parent().append(ov = $('<div />', {id:'setting-overlay',style:'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.6;background:black;'}));
		showDialog(o);
		ov.show();
	});
	$stage.dialog.themeClassic.on('click', function(e){
		changeTheme("classic");
	});
	$stage.dialog.themeKkuko.on('click', function(e){
		changeTheme("kkuko");
	});
	$stage.dialog.settingServer.on('click', function(e){
		location.href = "/";
	});
	$stage.dialog.settingOK.on('click', function(e){
		applyOptions({
			vb: $("#volume-bgm").val(),
			ve: $("#volume-effect").val(),
			bag: $("#general-badwords").is(":checked"),
			baa: $("#advanced-badwords").is(":checked"),
			di: $("#deny-invite").is(":checked"),
			dw: $("#deny-whisper").is(":checked"),
			df: $("#deny-friend").is(":checked"),
			ar: $("#auto-ready").is(":checked"),
			sb: $("#select-bgm").val(),
			su: $("#sort-user").is(":checked"),
			ow: $("#only-waiting").is(":checked"),
			ou: $("#only-unlock").is(":checked"),
			theme: $data.opts.theme
		});
		$.cookie('kks', JSON.stringify($data.opts));
		$stage.dialog.setting.hide();
	});
	$stage.dialog.profileLevel.on('click', function(e){
		$("#PracticeDiag .dialog-title").html(L['robot']);
		$("#ai-team").prop('disabled', false);
		showDialog($stage.dialog.practice);
	});
	$stage.dialog.practiceOK.on('click', function(e){
		var level = $("#practice-level").val();
		var team = $("#ai-team").val();

		$stage.dialog.practice.hide();
		if($("#PracticeDiag .dialog-title").html() == L['robot']){
			send('setAI', { target: $data._profiled, level: level, team: team });
		}else{
			send('practice', { level: level });
		}
	});
    $("#room-wordmaxlen").click(function(e) {
        if ($(this).is(":checked")) $("#container-wordmaxlen").show();
        else $("#container-wordmaxlen").hide();
    });
	$stage.dialog.roomOK.on('click', function(e){
		var my = $data.users[$data.id];
		if (!my) return;
		var i, k, opts = {
			injpick: $data._injpick
		};
		for(i in OPTIONS){
			k = OPTIONS[i].name.toLowerCase();
			opts[k] = $("#room-" + k).is(':checked');
		}
        if ($("#room-wordmaxlen").is(":checked"))
            opts.wordmaxlen = $("#val-wordmaxlen").val();
		if (opts.onlybeginner && getLevel(my.data.score) > 25)
			kkAlert(L['error_1001']);
		else {
			send($data.typeRoom, {
				title: $("#room-title").val().trim() || $("#room-title").attr('placeholder').trim(),
				password: $("#room-pw").val(),
				limit: $("#room-limit").val(),
				mode: $("#room-mode").val(),
				round: $("#room-round").val(),
				time: $("#room-time").val(),
				opts: opts,
				pq: {
					order: $("#room-pq-order").val(),
					wordlength: $("#room-pq-wordlength").val()
				}
			});
			$stage.dialog.room.hide();
		}
	});
	$stage.dialog.resultOK.on('click', function(e){
		if($data._resultPage == 1 && $data._resultRank){
			drawRanking($data._resultRank[$data.id]);
			return;
		}
		if($data.practicing){
			$data.room.gaming = true;
			send('leave');
		}
		if($data.exitresv){
			clearGame();
			send('leave');
			$data.exitresv = false;
		}
		$data.resulting = false;
		$stage.dialog.result.hide();
		delete $data._replay;
		delete $data._resultRank;
		$stage.box.room.height(360);
		playBGM('lobby');
		forkChat();
		updateUI();
	});
	$stage.dialog.resultSave.on('click', function(e){
		var date = new Date($rec.time);
		var blob = new Blob([ JSON.stringify($rec) ], { type: "text/plain" });
		var url = URL.createObjectURL(blob);
		var fileName = "KKuTu" + (
			date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " "
			+ date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds()
		) + ".kkt";
		var $a = $("<a>").attr({
			'download': fileName,
			'href': url
		}).on('click', function(e){
			$a.remove();
		});
		$("#Jungle").append($a);
		$a[0].click();
	});
	$stage.dialog.dictInjeong.on('click', function(e){
		var $target = $(e.currentTarget);

		if($target.is(':disabled')) return;
		if(!$("#dict-theme").val()) return;
		$target.prop('disabled', true);
		$("#dict-output").html(L['searching']);
		$.get("/injeong/" + $("#dict-input").val() + "?theme=" + $("#dict-theme").val(), function(res){
			addTimeout(function(){
				$target.prop('disabled', false);
			}, 2000);
			if(res.error) return $("#dict-output").html(res.error + ": " + L['wpFail_' + res.error]);

			$("#dict-output").html(L['wpSuccess'] + "(" + res.message + ")");
		});
	});
	$stage.dialog.dictSearch.on('click', function(e){
		var $target = $(e.currentTarget);

		if($target.is(':disabled')) return;
		$target.prop('disabled', true);
		$("#dict-output").html(L['searching']);
		tryDict($("#dict-input").val(), function(res){
			addTimeout(function(){
				$target.prop('disabled', false);
			}, 500);
			if(res.error) return $("#dict-output").html(res.error + ": " + L['wpFail_' + res.error]);

			$("#dict-output").html(processWord(res.word, res.mean, res.theme, res.type.split(',')));
		});
	}).hotkey($("#dict-input"), 13);
	$stage.dialog.wordPlusOK.on('click', function(e){
		var t;
		if($stage.dialog.wordPlusOK.hasClass("searching")) return;
		if(!(t = $("#wp-input").val())) return;
		t = t.replace(/[^a-z가-힣]/g, "");
		if(t.length < 2) return;

		$("#wp-input").val("");
		$(e.currentTarget).addClass("searching").html("<i class='fa fa-spin fa-spinner'></i>");
		send('wp', { value: t });
	}).hotkey($("#wp-input"), 13);
	$stage.dialog.inviteRobot.on('click', function(e){
		requestInvite("AI");
	});
	$stage.box.me.on('click', function(e){
		requestProfile($data.id);
	});
	$stage.dialog.roomInfoJoin.on('click', function(e){
		$stage.dialog.roomInfo.hide();
		tryJoin($data._roominfo);
	});
	$stage.dialog.profileHandover.on('click', function(e){
		if(!confirm(L['sureHandover'])) return;
		send('handover', { target: $data._profiled });
	});
	$stage.dialog.profileKick.on('click', function(e){
				if(isStaff($data.users[$data._profiled])){
			kkAlert("GM은 강제퇴장 시킬 수 없습니다.");
		} else {
 		send('kick', { robot: $data.robots.hasOwnProperty($data._profiled), target: $data._profiled });
		}
	});
	$stage.dialog.profileReport.on('click', function(e){
		var user = $data.users[$data._profiled];
		var jsonObj = {id:user.id, reason:""};
		if(showDialog($stage.dialog.report)){
	 		$data._report = jsonObj;
		}
 	});
	$stage.dialog.reportOK.on('click', function(e){
		var list = $(".report-reasonlist input:checkbox:checked");
		var reasonlist = [];
		for(var i=0;i<list.length;i++)
			reasonlist.push($(list[i]).attr("id").split("-")[2]);
		reasonlist.push($("#report-reasonarea").val());
		$data._report.reason = reasonlist.join();
		if(reasonlist.length>0){
			send('report', $data._report);
			kkAlert("신고가 접수되었습니다.");
			delete $data._report;
			$stage.dialog.report.hide();
		}
		else{
			kkAlert("신고 사유를 1개 이상 체크해야 합니다.");
			delete $data._report;
			$stage.dialog.report.hide();
		}
 	});
	$stage.dialog.noticeOK.on('click', function(e){
		$stage.dialog.notice.hide();
    if($stage.dialog.noticeNolook.is(":checked")){
			setCookieAt00( "nnl", "done" , 1);
		}
 	});
	$stage.dialog.profileShut.on('click', function(e){
		var o = $data.users[$data._profiled];

		if(!o) return;
		toggleShutBlock(o.profile.nick);
	});
	$stage.dialog.profileWhisper.on('click', function(e){
		var o = $data.users[$data._profiled];

		$stage.talk.val("/e " + o.profile.nick.replace(/\s/g, "") + " ").focus();
	});
	$stage.dialog.profileDress.on('click', function(e){
		// alert(L['error_555']);
		if($data.guest) return fail(421);
		if($data._gaming) return fail(438);
		if(showDialog($stage.dialog.dress)) $.get("/box", function(res){
			if(res.error) return fail(res.error);

			$data.box = res;
			drawMyDress();
		});
	});
	$stage.dialog.dressOK.on('click', function(e){
		$(e.currentTarget).attr('disabled', true);
		var curnick = $data.users[$data.id].profile.nick;
		var newnick = $("#dress-nick").val();
        newnick = newnick !== undefined ? newnick.trim() : "";
        if (newnick.length<2) {
            alert("닉네임은 두 글자 이상으로 해 주세요!");
            $(e.currentTarget).attr('disabled', false);
            return;
        } else if (newnick.length>15) {
            alert("닉네임은 15 글자 이하로 해 주세요!");
            $(e.currentTarget).attr('disabled', false);
            return;
        } else if (newnick.length > 0 && !/^[가-힣a-zA-Z0-9][가-힣a-zA-Z0-9 ]*[가-힣a-zA-Z0-9]$/.exec(newnick)) {
            alert("닉네임에는 한글/영문/숫자 및 공백만 사용 가능합니다!");
            $(e.currentTarget).attr('disabled', false);
            return;
        }
		var obj = { data: $("#dress-exordial").val(), nick: newnick };
		if (!obj.nick || obj.nick.length == 0) delete obj.nick;
		if (curnick == newnick || curnick != newnick && confirm('정말로 닉네임을 변경하시겠습니까?')) {
			$.post("/exordial", obj, function(res){
				$stage.dialog.dressOK.attr('disabled', false);
				if(res.error) return fail(res.error);

				var b = $data.users[$data.id];
				b.profile.nick = newnick;
				b.exordial = badWords($("#dress-exordial").val() || "");
				updateMe();
				requestProfile($data.id);
				$("#account-info").text(newnick);
				$("#users-item-"+$data.id+" .users-name").text(newnick);
				// Send nickchange to server
				send('nickChange', { id: $data.id, nick: newnick }, true);
				alert("변경이 완료되었습니다.");
				$stage.dialog.dress.hide();
			});
		} else $(e.currentTarget).attr('disabled', false);
	});
	$("#DressDiag .dress-type").on('click', function(e){
		var $target = $(e.currentTarget);
		var type = $target.attr('id').slice(11);

		$(".dress-type.selected").removeClass("selected");
		$target.addClass("selected");

		drawMyGoods(type == 'all' || $target.attr('value'));
	});
	$("#dress-cf").on('click', function(e){
		if($data._gaming) return fail(438);
		if(showDialog($stage.dialog.charFactory)) drawCharFactory();
	});
	$stage.dialog.cfCompose.on('click', function(e){
		if(!$stage.dialog.cfCompose.hasClass("cf-composable")) return fail(436);
		if(!confirm(L['cfSureCompose'])) return;

		$.post("/cf", { tray: $data._tray.join('|') }, function(res){
			var i;

			if(res.error) return fail(res.error);
			send('refresh');
			alert(L['cfComposed']);
			$data.users[$data.id].money = res.money;
			$data.box = res.box;
			for(i in res.gain) queueObtain(res.gain[i]);

			drawMyDress($data._avGroup);
			updateMe();
			drawCharFactory();
		});
	});
	$("#room-injeong-pick").on('click', function(e){
		var rule = RULE[MODE[$("#room-mode").val()]];
		var i;

		$("#injpick-list>div").hide();
		if(rule.lang == "ko"){
			$data._ijkey = "#ko-pick-";
			$("#ko-pick-list").show();
		}else if(rule.lang == "en"){
			$data._ijkey = "#en-pick-";
			$("#en-pick-list").show();
		}
		$stage.dialog.injPickNo.trigger('click');
		for(i in $data._injpick){
			$($data._ijkey + $data._injpick[i]).prop('checked', true);
		}
		showDialog($stage.dialog.injPick);
	});
	$stage.dialog.injPickAll.on('click', function(e){
		$("#injpick-list input").prop('checked', true);
	});
	$stage.dialog.injPickNo.on('click', function(e){
		$("#injpick-list input").prop('checked', false);
	});
	$stage.dialog.injPickOK.on('click', function(e){
		var $target = $($data._ijkey + "list");
		var list = [];

		$data._injpick = $target.find("input").each(function(i, o){
			var $o = $(o);
			var id = $o.attr('id').slice(8);

			if($o.is(':checked')) list.push(id);
		});
		$data._injpick = list;
		$stage.dialog.injPick.hide();
	});
	$stage.dialog.kickVoteY.on('click', function(e){
		send('kickVote', { agree: true });
		clearTimeout($data._kickTimer);
		$stage.dialog.kickVote.hide();
	});
	$stage.dialog.kickVoteN.on('click', function(e){
		send('kickVote', { agree: false });
		clearTimeout($data._kickTimer);
		$stage.dialog.kickVote.hide();
	});
	$stage.dialog.purchaseOK.on('click', function(e){
		$.post("/buy/" + $data._sgood, function(res){
			var my = $data.users[$data.id];

			if(res.error) return fail(res.error);
			alert(L['purchased']);
			my.money = res.money;
			my.box = res.box;
			updateMe();
		});
		$stage.dialog.purchase.hide();
	});
	$stage.dialog.purchaseNO.on('click', function(e){
		$stage.dialog.purchase.hide();
	});
	$stage.dialog.obtainOK.on('click', function(e){
		var obj = $data._obtain.shift();

		if(obj) drawObtain(obj);
		else $stage.dialog.obtain.hide();
	});
	for(i=0; i<5; i++) $("#team-" + i).on('click', onTeam);
	function onTeam(e){
		if($(".team-selector").hasClass("team-unable")) return;

		send('team', { value: $(e.currentTarget).attr('id').slice(5) });
	}
// 리플레이
	function initReplayDialog(){
		$stage.dialog.replayView.attr('disabled', true);
	}
	$("#replay-file").on('change', function(e){
		var file = e.target.files[0];
		var reader = new FileReader();
		var $date = $("#replay-date").html("-");
		var $version = $("#replay-version").html("-");
		var $players = $("#replay-players").html("-");

		$rec = false;
		$stage.dialog.replayView.attr('disabled', true);
		if(!file) return;
		reader.readAsText(file);
		reader.onload = function(e){
			var i, data;

			try{
				data = JSON.parse(e.target.result);
				$date.html((new Date(data.time)).toLocaleString());
				$version.html(data.version);
				$players.empty();
				for(i in data.players){
					var u = data.players[i];
					var $p;

					$players.append($p = $("<div>").addClass("replay-player-bar ellipse")
						.html(u.title)
						.prepend(getLevelImageHTML(u.data.score, "users-level"))
					);
					if(u.id == data.me) $p.css('font-weight', "bold");
				}
				$rec = data;
				$stage.dialog.replayView.attr('disabled', false);
			}catch(ex){
				console.warn(ex);
				return alert(L['replayError']);
			}
		};
	});
	$stage.dialog.replayView.on('click', function(e){
		replayReady();
	});

// 스팸
	addInterval(function(){
		if(spamCount > 0) spamCount = 0;
		else if(spamWarning > 0) spamWarning -= 0.03;
	}, 1000);

// 웹소켓 연결
	function connect(){
		ws = new _WebSocket($data.URL);
		ws.onopen = function(e){
			loading();
			/*if($data.PUBLIC && mobile) $("#ad").append($("<ins>").addClass("daum_ddn_area")
				.css({ 'display': "none", 'margin-top': "10px", 'width': "100%" })
				.attr({
					'data-ad-unit': "DAN-1ib8r0w35a0qb",
					'data-ad-media': "4I8",
					'data-ad-pubuser': "3iI",
					'data-ad-type': "A",
					'data-ad-width': "320",
					'data-ad-height': "100"
				})
			).append($("<script>")
				.attr({
					'type': "text/javascript",
					'src': "//t1.daumcdn.net/adfit/static/ad.min.js"
				})
			);*/
		};
		ws.onmessage = _onMessage = function(e){
			onMessage(JSON.parse(e.data));
		};
		ws.onclose = function(e){
			var ct = L['closed'] + " (#" + e.code + ")";

			if(rws) rws.close();
			stopAllSounds();
			alert(ct);
			loading("<center>서버와의 연결이 끊어졌습니다!</center><center></center>");
		};
		ws.onerror = function(e){
			console.warn(L['error'], e);
		};
	}
});
