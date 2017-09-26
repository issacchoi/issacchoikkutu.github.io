const CLUSTER = require("cluster");

var GUEST_PERMISSION;
var Const = require('../const');
var Lizard = require('../sub/lizard');
var JLog = require('../sub/jjlog');
var Ajae = require("../sub/ajae");
var DB;
var SHOP;
var DIC;
var ROOM;
var _rid;
var Rule;
var guestProfiles = [];
var CHAN;
var SID;
var channel		= process.env['CHANNEL'] || 0;
var GLOBAL		= require("../sub/global.json");
var charx   	= require("../sub/util");

const NUM_SLAVES = 4;
const GUEST_IMAGE = "/img/kkutu/guest.png";
const MAX_OKG = 18;
const PER_OKG = 600000;

exports.NIGHT = false;
exports.init = function(_DB, _DIC, _ROOM, _GUEST_PERMISSION, _CHAN, _SID){
	JLog.init("game_"+process.env['KKUTU_PORT']+"_"+channel);
	var i, k;

	DB = _DB;
	DIC = _DIC;
	ROOM = _ROOM;
	GUEST_PERMISSION = _GUEST_PERMISSION;
	CHAN = _CHAN;
	SID = _SID;
	_rid = 100;
	if(CLUSTER.isMaster) setInterval(exports.processAjae, 60000);
	DB.kkutu_shop.find().on(function($shop){
		SHOP = {};

		$shop.forEach(function(item){
			SHOP[item._id] = item;
		});
	});
	Rule = {};
	for(i in Const.RULE){
		k = Const.RULE[i].rule;
		Rule[k] = require(`./games/${k.toLowerCase()}`);
		Rule[k].init(DB, DIC);
	}
};
exports.processAjae = function(){
	var i;
};
exports.getUserList = function(){
	var i, res = {};

	for(i in DIC){
		res[i] = DIC[i].getData();
	}

	return res;
};
exports.getRoomList = function(){
	var i, res = {};

	for(i in ROOM){
		res[i] = ROOM[i].getData();
	}

	return res;
};
exports.narrate = function(list, type, data){
	list.forEach(function(v){
		if(DIC[v]) DIC[v].send(type, data);
	});
};
exports.publish = function(type, data, _room){
	var i;

	if(CLUSTER.isMaster){
		for(i in DIC){
			DIC[i].send(type, data);
		}
	}else if(CLUSTER.isWorker){
		if(type == "room") process.send({ type: "room-publish", data: data, password: _room });
		else for(i in DIC){
			DIC[i].send(type, data);
		}
	}
};
exports.Robot = function(target, place, level){
	var my = this;

	my.id = target + place + Math.floor(Math.random() * 1000000000);
	my.robot = true;
	my.game = {};
	my.data = {};
	my.place = place;
	my.target = target;
	my.equip = { robot: true };

	my.getData = function(){
		return {
			id: my.id,
			robot: true,
			game: my.game,
			data: my.data,
			place: my.place,
			target: target,
			equip: my.equip,
			level: my.level,
			ready: true
		};
	};
	my.setLevel = function(level){
		my.level = level;
		my.data.score = Math.pow(10, level + 2);
	};
	my.setTeam = function(team){
		my.game.team = team;
	};
	my.send = function(){};
	my.obtain = function(){};
	my.invokeWordPiece = function(text, coef){};
	my.publish = function(type, data, noBlock){
		var i;

		if(my.target == null){
			for(i in DIC){
				if(DIC[i].place == place) DIC[i].send(type, data);
			}
		}else if(DIC[my.target]){
			DIC[my.target].send(type, data);
		}
	};
	my.chat = function(msg, code){
		my.publish('chat', { value: msg });
	};
	my.setLevel(level);
	my.setTeam(0);
};
exports.Data = function(data){
	var i, j;

	if(!data) data = {};

	this.score = data.score || 0;
	this.playTime = data.playTime || 0;
	this.connectDate = data.connectDate || 0;
	this.record = {};
	for(i in Const.GAME_TYPE){
		this.record[j = Const.GAME_TYPE[i]] = data.record ? (data.record[Const.GAME_TYPE[i]] || [0, 0, 0, 0]) : [0, 0, 0, 0];
		if(!this.record[j][3]) this.record[j][3] = 0;
	}
	this.dictpageuse = data.dictpageuse;
	this.dictpagedate = data.dictpagedate;
	this.nickchangetime = data.nickchangetime;
	this.nick = data.nick;
	// 전, 승, 점수
};
exports.WebServer = function(socket){
	var my = this;

	my.socket = socket;

	my.send = function(type, data){
		var i, r = data || {};

		r.type = type;

		if(socket.readyState == 1) socket.send(JSON.stringify(r));
	};
	my.onWebServerMessage = function(msg){
		try{ msg = JSON.parse(msg); }catch(e){ return; }

		switch(msg.type){
			case 'seek':
				my.send('seek', { value: Object.keys(DIC).length });
				break;
			case 'narrate-friend':
				exports.narrate(msg.list, 'friend', { id: msg.id, s: msg.s, stat: msg.stat });
				break;
			case "yell":
				for(i in DIC){
					DIC[i].send('yell', { value: msg.value, bar:msg.bar });
				}
				break;
			default:
		}
	};
	socket.on('message', my.onWebServerMessage);
};
exports.Client = function(socket, profile, sid){
	var my = this;
	var gp, okg;

	if(profile){
		my.id = profile.id;
		my._sid = sid;
		my.profile = profile;
		if(CLUSTER.isMaster){
			my.isAjae = true;
			//my.isAjae = Ajae.checkAjae(profile.birth, profile._age);
		}else{
			my.isAjae = true;
		}
		my._birth = profile.birth;
		my._age = profile._age;
		delete my.profile.birth;
		delete my.profile._age;
		delete my.profile.token;
		delete my.profile.sid;
		delete my.profile.title;
		delete my.profile.name;
	}else{
		gp = guestProfiles[Math.floor(Math.random() * guestProfiles.length)];

		my.id = sid;
		my.guest = true;
		my.isAjae = false;
		my.profile = {
			id: sid,
			image: GUEST_IMAGE
		};
		my.nick = getGuestName(sid);
	}
	my.socket = socket;
	my.place = 0;
	my.team = 0;
	my.ready = false;
	my.game = {};

	my.subPlace = 0;
	my.error = false;
	my.blocked = false;
	my._pub = new Date();

	my.spam = {
		chatText : "",
		chatTextList : [],
		chatDate : new Date(),
		warnTimes : 0,
		warnDate : 0
	};

	my.spamnum=0;

	if(CLUSTER.isMaster){
		my.onOKG = function(time){
			// ?? 이럴 일이 없어야 한다.
		};
	}else{
		my.onOKG = function(time){
			var d = (new Date()).getDate();

			if(my.guest) return;
			if(d != my.data.connectDate){
				my.data.connectDate = d;
				my.data.playTime = 0;
				my.okgCount = 0;
			}
			my.data.playTime += time;

			while(my.data.playTime >= PER_OKG * (my.okgCount + 1)){
				if(my.okgCount >= MAX_OKG) return;
				my.okgCount++;
			}
			my.send('okg', { time: my.data.playTime, count: my.okgCount });
			// process.send({ type: 'okg', id: my.id, time: time });
		};
	}
	socket.on('close', function(code){
		if(ROOM[my.place]) ROOM[my.place].go(my);
		if(my.subPlace) my.pracRoom.go(my);
		exports.onClientClosed(my, code);
	});
	socket.on('message', function(msg){
		var data, room = ROOM[my.place];

		if(JSON.parse(msg).type != "pictureQuiz")JLog.log(`C[${channel}] I[${socket.upgradeReq.connection.remoteAddress}] #${my.id} [${msg}]`);
		try{ data = JSON.parse(msg); }catch(e){ data = { error: 400 }; }
		if(CLUSTER.isWorker) process.send({ type: "tail-report", id: my.id, chan: channel, place: my.place, msg: data.error ? msg : data });

		exports.onClientMessage(my, data);
	});
	my.confirmAjae = function(input){
		if(Ajae.confirmAjae(input, my._birth, my._age)){
			DB.users.update([ '_id', my.id ]).set([ 'birthday', input.join('-') ]).on(function(){
				my.sendError(445);
			});
		}else{
			DB.users.update([ '_id', my.id ]).set([ 'black', `[${input.join('-')}] 생년월일이 올바르게 입력되지 않았습니다. 잠시 후 다시 시도해 주세요.` ]).on(function(){
				my.socket.close();
			});
		}
	};
	my.getData = function(gaming){
		var o = {
			id: my.id,
			nick: my.nick,
			guest: my.guest,
			game: {
				ready: my.ready,
				form: my.form,
				team: my.team,
				practice: my.subPlace,
				score: my.game.score,
				item: my.game.item
			}
		};
		if(!gaming){
			o.profile = my.profile;
			delete o.profile.email;
			o.place = my.place;
			o.data = my.data;
			o.money = my.money;
			o.equip = my.equip;
			o.exordial = my.exordial;
		}
		return o;
	};
	my.send = function(type, data){
		var i, r = data || {};

		r.type = type;

		if(socket.readyState == 1) socket.send(JSON.stringify(r));
	};
	my.sendError = function(code, msg){
		my.send('error', { code: code, message: msg });
	};
	my.publish = function(type, data, noBlock, special){
		var i;
		var now = new Date(), st = now - my._pub;

		if(type!="pictureQuiz" && (type == "chat"?my.place != 0:false)){
			if(st <= Const.SPAM_ADD_DELAY) my.spamnum++;
			else if(st >= Const.SPAM_CLEAR_DELAY) my.spamnum = 0;
			if(my.spamnum >= Const.SPAM_LIMIT){
				if(!my.blocked) my.spamnum = 0;
				my.blocked = true;
			}
			if(!noBlock){
				my._pub = now;
				if(my.blocked){
					if(st < Const.BLOCKED_LENGTH){
						if(++my.spamnum >= Const.KICK_BY_SPAM){
							if(CLUSTER.isWorker) process.send({ type: "kick", target: my.id });
							return my.socket.close();
						}
						return my.send('blocked');
					}else my.blocked = false;
				}
			}
		}
		if (type!="pictureQuiz") {
			data.profile = my.profile;
			data.nick = my.nick;
		}
		if (my.subPlace && type != 'chat' && special){
			if(data.ID==my.id) my.send(type, data.ME);
			else my.send(type, data.ME);
		}
		else if (my.subPlace && type != 'chat') my.send(type, data);
		else if (special){
			DIC[data.ID].send(type, data.ME);
			for(i in DIC){
				if(DIC[i].place == my.place && DIC[i].id != data.ID) DIC[i].send(type, data.OTHER);
			}
		}
		else for(i in DIC){
			if(DIC[i].place == my.place) DIC[i].send(type, data);
		}
		if(CLUSTER.isWorker && type == 'user') process.send({ type: "user-publish", data: data });
	};
	my.chat = function(msg, code, isLobby){
		var date = new Date();

		if(isLobby){
			//3초 후에 경고횟수 초기화
			if(my.spam.warnTimes > 0 && my.spam.warnDate <= date + 30000){
				my.spam.warnTimes = 0;
				my.spam.warnDate = 0;
			}

			//최근 채팅 내용 3개 중 같은 내용이 있을 시 도배 처리
			if(my.spam.chatTextList.indexOf(msg) != -1) {
				my.send('yell', { value: "도배로 판단되어 전송되지 않았습니다." });
				my.spam.warnTimes += 1;
				my.spam.warnDate = date;
			}
			//최근 2초 안에 채팅을 쳤을 시 도배 처리
			else if(my.spam.chatDate >= date - 2000) {
				my.send('yell', { value: "도배로 판단되어 전송되지 않았습니다." });
				my.spam.warnTimes += 1.5;
				my.spam.warnDate = date;
			}
			//최근 채팅 내용과 일치할 시 도배 처리
			else if(my.spam.chatText == msg) {
				my.send('yell', { value: "도배로 판단되어 전송되지 않았습니다." });
				my.spam.warnTimes += 1;
				my.spam.warnDate = date;
			}
			//아무일도 없음
			else {
				my.spam.chatDate = date;
				my.spam.chatText = msg;
				my.spam.chatTextList.push(msg);
				if(my.spam.chatTextList.length>3) my.spam.chatTextList.splice(0,1);
				my.publish('chat', { value: msg, notice: code ? true : false, code: code });
			}
			//만약 경고 횟수가 5회를 초과할 시 킥 처리

			if(my.spam.warnTimes > 5) {
				my.sendError(1100);
				my.socket.close();
			}
		} else {
			my.publish('chat', { value: msg, notice: code ? true : false, code: code });
		}
	};
	my.checkExpire = function(){
		var now = new Date();
		var d = now.getDate();
		var i, expired = [];
		var gr;

		now = now.getTime() * 0.001;
		if(d != my.data.connectDate){
			my.data.connectDate = d;
			my.data.playTime = 0;
		}
		for(i in my.box){
			if(!my.box[i]){
				delete my.box[i];
				continue;
			}
			if(!my.box[i].expire && !i.startsWith("bl_")) continue;
			console.log(i);
			if(my.box[i].expire < now || i.startsWith("bl_")){
				gr = SHOP[i] ? SHOP[i].group : null;

				if (gr) { // Prevent game server stop by removed/undefined item
					if (gr.substr(0, 3) == "BDG") gr = "BDG";
					if (my.equip[gr] == i) delete my.equip[gr];
				}
				delete my.box[i];
				expired.push(i);
			}
		}
		if(expired.length){
			my.send('expired', { list: expired });
			my.flush(my.box, my.equip);
		}
	};
	my.refresh = function(){
		var R = new Lizard.Tail();

		if(my.guest){
			my.equip = {};
			my.data = new exports.Data();
			my.money = 0;
			my.friends = {};

			R.go({ result: 200 });
		}else DB.users.findOne([ '_id', my.id ]).on(function($user){
			var first = !$user;

			if(first) $user = { money: 0 };
			if(CLUSTER.isMaster && !my.isAjae){ // null일 수는 없다.
				my.isAjae = true;
				//my.isAjae = Ajae.checkAjae(($user.birthday || "").split('-'));
				if(my.isAjae === null){
					if(my._birth) my._checkAjae = setTimeout(function(){
						my.sendError(442);
						my.socket.close();
					}, 300000);
					else{
						my.sendError(441);
						my.socket.close();
						return;
					}
				}
			}
			my.nick = $user.nick || "nonick";
			my.exordial = $user.exordial || "";
			my.equip = $user.equip || {};
			my.box = $user.box || {};
			my.data = new exports.Data($user.kkutu);
			my.money = Number($user.money);
			my.friends = $user.friends || {};
			if(first) my.flush();
			else{
				my.checkExpire();
				my.okgCount = Math.floor((my.data.playTime || 0) / PER_OKG);
			}
			if(CLUSTER.isMaster && $user.server) R.go({ result: 409, black: $user.server });
			else R.go({ result: 200 });
		});
		return R;
	};
    my.getLevel = () => { return charx.getLevel(my) };
	my.flush = function(box, equip, friends){
		var R = new Lizard.Tail();

		if(my.guest){
			R.go({ id: my.id, prev: 0 });
			return R;
		}
		DB.users.upsert([ '_id', my.id ]).set(
			!isNaN(my.money) ? [ 'money', my.money ] : undefined,
			(my.data && !isNaN(my.data.score)) ? [ 'kkutu', my.data ] : undefined,
			box ? [ 'box', my.box ] : undefined,
			equip ? [ 'equip', my.equip ] : undefined,
			friends ? [ 'friends', my.friends ] : undefined
		).on(function(__res){
			DB.redis.getGlobal(my.id).then(function(_res){
				var nick = my.nick;
				DB.redis_nick.putData(my.id, nick).then(function(__res) {
					DB.redis.putGlobal(my.id, my.data.score).then(function (res) {
						JLog.log(`FLUSHED [${my.id}] PTS=${my.data.score} MNY=${my.money}`);
						R.go({id: my.id, prev: _res});
					});
				});
			});
		});
		return R;
	};
	my.invokeWordPiece = function(text, coef){
		if(!my.game.wpc) return;
		var v;

		if(Math.random() <= 0.04 * coef){
			v = text.charAt(Math.floor(Math.random() * text.length));
			if(!v.match(/[a-z가-힣]/)) return;
			my.game.wpc.push(v);
		}
	};
	my.enter = function(room, spec, pass){
		var $room, i;
		if(my.place){
			my.send('roomStuck');
			JLog.warn(`Enter the room ${room.id} in the place ${my.place} by ${my.id}!`);
			return;
		}else if(room.id){
			// 이미 있는 방에 들어가기... 여기서 유효성을 검사한다.
			$room = ROOM[room.id];

			if(!$room){
				if(CLUSTER.isMaster){
					for(i in CHAN) CHAN[i].send({ type: "room-invalid", room: room });
				}else{
					process.send({ type: "room-invalid", room: room });
				}
				return my.sendError(430, room.id);
			}
			if(!spec){
				if($room.gaming){
					return my.send('error', { code: 416, target: $room.id });
				}else if(my.guest) {
                    if (!GUEST_PERMISSION.enter) {
                        return my.sendError(401);
                    }
                }
				else if($room.opts.onlybeginner && my.getLevel() > 25){
					if (my.guest) {
						return my.sendError(1010)
					} else {
						return my.sendError(1001);
					}
				}
			}
			if($room.players.length >= $room.limit + (spec ? (($room.effect.gm||$room.effect.staff||$room.effect.broadcast) ? (($room.effect.gm)?42:12) : Const.MAX_OBSERVER) : 0)&&DIC[my.id].equip['BDG']!="b1_gm"){
				return my.sendError(429);
			}
			if($room.players.indexOf(my.id) != -1){
		 		return my.sendError(409);
			}
			if(CLUSTER.isMaster){
				my.send('preRoom', { id: $room.id, pw: room.password, channel: $room.channel });
				CHAN[$room.channel].send({ type: "room-reserve", session: sid, room: room, spec: spec, pass: pass });

				$room = undefined;
			}else{
				if(!pass && $room){
					/*BUGFIX*/
					if(DIC[my.id]?DIC[my.id].equip['BDG']!="b1_gm":true){
						if($room.kicked.indexOf(my.id) != -1){
							return my.sendError(406);
						}
						if($room.password != room.password && $room.password){
							$room = undefined;
							return my.sendError(403);
						}
					}
				}
			}
		}else if(my.guest && !GUEST_PERMISSION.enter){
			my.sendError(401);
		}else{
			// 새 방 만들어 들어가기
			/*
				1. 마스터가 ID와 채널을 클라이언트로 보낸다.
				2. 클라이언트가 그 채널 일꾼으로 접속한다.
				3. 일꾼이 만든다.
				4. 일꾼이 만들었다고 마스터에게 알린다.
				5. 마스터가 방 정보를 반영한다.
			*/
			if(CLUSTER.isMaster){
				var av = exports.getFreeChannel();

				room.id = _rid;
				room._create = true;
				my.send('preRoom', { id: _rid, channel: av });
				CHAN[av].send({ type: "room-reserve", create: true, session: sid, room: room });

				do{
					if(++_rid > 999) _rid = 100;
				}while(ROOM[_rid]);
			}else{
				if(room._id){
					room.id = room._id;
					delete room._id;
				}
				if(my.place != 0){
					my.sendError(409);
				}
				$room = new exports.Room(room, exports.getFreeChannel());
            	if($room.opts.onlybeginner && my.getLevel() > 25){
					if (my.guest) {
						return my.sendError(1010)
					} else {
						return my.sendError(1001);
					}
                }
            	var msg = { type: "room-new", target: my.id, room: $room.getData() };
				process.send(msg);
				ROOM[$room.id] = $room;
				spec = false;
			}
		}
		if($room){
			if(spec) $room.spectate(my, room.password);
			else $room.come(my, room.password, pass);
		}
	};
	my.leave = function(kickVote){
		var $room = ROOM[my.place];

		if(my.subPlace){
			my.pracRoom.go(my);
			if($room) my.send('room', { target: my.id, room: $room.getData() });
			my.publish('user', my.getData());
			if(!kickVote) return;
		}
		if($room) $room.go(my, kickVote);
	};
	my.setForm = function(mode){
		var $room = ROOM[my.place];

		if(!$room) return;

		my.form = mode;
		my.ready = false;
		my.publish('user', my.getData());
	};
	my.setTeam = function(team){
		my.team = team;
		my.publish('user', my.getData());
	};
	my.kick = function(target, kickVote){
		var $room = ROOM[my.place];
		var i, $c;
		var len = $room.players.length;

		if(target == null){ // 로봇 (이 경우 kickVote는 로봇의 식별자)
			$room.removeAI(kickVote);
			return;
		}
		for(i in $room.players){
			if($room.players[i].robot) len--;
		}
		if(len < 4) kickVote = { target: target, Y: 1, N: 0 };
		if(kickVote){
			$room.kicked.push(target);
			$room.kickVote = null;
			if(DIC[target]) DIC[target].leave(kickVote);
		}else{
			$room.kickVote = { target: target, Y: 1, N: 0, list: [] };
			for(i in $room.players){
				$c = DIC[$room.players[i]];
				if(!$c) continue;
				if($c.id == $room.master) continue;

				$c.kickTimer = setTimeout($c.kickVote, 10000, $c, true);
			}
			my.publish('kickVote', $room.kickVote, true);
		}
	};
	my.kickVote = function(client, agree){
		var $room = ROOM[client.place];
		var $m;

		if(!$room) return;

		$m = DIC[$room.master];
		if($room.kickVote){
			$room.kickVote[agree ? 'Y' : 'N']++;
			if($room.kickVote.list.push(client.id) >= $room.players.length - 2){
				if($room.gaming) return;

				if($room.kickVote.Y >= $room.kickVote.N) $m.kick($room.kickVote.target, $room.kickVote);
				else $m.publish('kickDeny', { target: $room.kickVote.target, Y: $room.kickVote.Y, N: $room.kickVote.N }, true);

				$room.kickVote = null;
			}
		}
		clearTimeout(client.kickTimer);
	};
	my.toggle = function(){
		var $room = ROOM[my.place];

		if(!$room) return;
		if($room.master == my.id) return;
		if(my.form != "J") return;

		my.ready = !my.ready;
		my.publish('user', my.getData());
	};
	my.start = function(){
		var $room = ROOM[my.place];

		if(!$room) return;
		if($room.master != my.id) return;
		if($room.players.length < 2) return my.sendError(411);

		$room.ready();
	};
	my.practice = function(level){
		var $room = ROOM[my.place];
		var ud;
		var pr;

		if(!$room) return;
		if(my.subPlace) return;
		if(my.form != "J") return;

		my.team = 0;
		my.ready = false;
		ud = my.getData();
		my.pracRoom = new exports.Room($room.getData());
		my.pracRoom.id = $room.id + 1000;
		ud.game.practice = my.pracRoom.id;
		if(pr = $room.preReady()) return my.sendError(pr);
		my.publish('user', ud);
		my.pracRoom.limit = 1;
		my.pracRoom.password = "";
		my.pracRoom.practice = true;
		my.subPlace = my.pracRoom.id;
		my.pracRoom.come(my);
		my.pracRoom.start(level);
		my.pracRoom.game.hum = 1;
	};
	my.setRoom = function(room){
		var $room = ROOM[my.place];

		if($room){
			if(!$room.gaming){
				if($room.master == my.id){
					$room.set(room);
					exports.publish('room', { target: my.id, room: $room.getData(), modify: true }, room.password);
				}else{
					my.sendError(400);
				}
			}
		}else{
			my.sendError(400);
		}
	};
	my.applyEquipOptions = function(rw){
		var $obj;
		var i, j;
		var pm = rw.playTime / 60000;

		rw._score = Math.round(rw.score);
		rw._money = Math.round(rw.money);
		rw._blog = [];
		my.checkExpire();
		for(i in my.equip){
			$obj = SHOP[my.equip[i]];
			if(!$obj) continue;
			if(!$obj.options) continue;
			for(j in $obj.options){
				if(j == "gEXP") rw.score += rw._score * $obj.options[j];
				else if(j == "hEXP") rw.score += $obj.options[j] * pm;
				else if(j == "gMNY") rw.money += rw._money * $obj.options[j];
				else if(j == "hMNY") rw.money += $obj.options[j] * pm;
				else continue;
				rw._blog.push("q" + j + $obj.options[j]);
			}
		}
		if(rw.together && my.okgCount > 0){
			i = 0.05 * my.okgCount;
			j = 0.05 * my.okgCount;

			rw.score += rw._score * i;
			rw.money += rw._money * j;
			rw._blog.push("kgEXP" + i);
			rw._blog.push("kgMNY" + j);
		}
		rw.score = Math.round(rw.score);
		rw.money = Math.round(rw.money);
	};
	my.obtain = function(k, q, flush){
		if(my.guest) return;
		if(my.box[k]) my.box[k] += q;
		else my.box[k] = q;

		my.send('obtain', { key: k, q: q });
		if(flush) my.flush(true);
	};
	my.addFriend = function(id){
		var fd = DIC[id];

		if(!fd) return;
		my.friends[id] = fd.nick;
		my.flush(false, false, true);
		my.send('friendEdit', { friends: my.friends });
	};
	my.removeFriend = function(id){
		DB.users.findOne([ '_id', id ]).limit([ 'friends', true ]).on(function($doc){
			if(!$doc) return;

			var f = $doc.friends;

			delete f[my.id];
			DB.users.update([ '_id', id ]).set([ 'friends', f ]).on();
		});
		delete my.friends[id];
		my.flush(false, false, true);
		my.send('friendEdit', { friends: my.friends });
	};
};
exports.Room = function(room, channel){
	var my = this;

	my.id = room.id || _rid;
	my.channel = channel;
	my.opts = {};
	my.pq = {};
	/*my.title = room.title;
	my.password = room.password;
	my.limit = Math.round(room.limit);
	my.mode = room.mode;
	my.rule = Const.getRule(room.mode);
	my.round = Math.round(room.round);
	my.time = room.time * my.rule.time;
	my.opts = {
		manner: room.opts.manner,
		extend: room.opts.injeong,
		mission: room.opts.mission,
		loanword: room.opts.loanword,
		injpick: room.opts.injpick || []
	};*/
	my.master = null;
	my.tail = [];
	my.players = [];
	my.kicked = [];
	my.kickVote = null;

	my.gaming = false;
	my.game = {};

	my.effect = {gm:false,staff:false,broadcast:false};

	my.getData = function(){
		var i, readies = {};
		var pls = [];
		var seq = my.game.seq ? my.game.seq.map(filterRobot) : [];
		var o;

		for(i in my.players){
			if(o = DIC[my.players[i]]){
				readies[my.players[i]] = {
					r: o.ready || o.game.ready,
					f: o.form || o.game.form,
					t: o.team || o.game.team
				};
			}
			pls.push(filterRobot(my.players[i]));
		}
		return {
			id: my.id,
			nick: my.nick,
			channel: my.channel,
			title: my.title,
			password: my.password ? true : false,
			limit: my.limit,
			mode: my.mode,
			round: my.round,
			time: my.time,
			master: my.master,
			players: pls,
			readies: readies,
			gaming: my.gaming,
			game: {
				round: my.game.round,
				turn: my.game.turn,
				seq: seq,
				title: my.game.title,
				mission: my.game.mission
			},
			practice: my.practice ? true : false,
			opts: my.opts,
			effect: my.effect,
			pq: my.pq
		};
	};
	my.addAI = function(caller){
		if(my.players.length >= my.limit){
			return caller.sendError(429);
		}
		if(my.gaming){
			return caller.send('error', { code: 416, target: my.id });
		}
		if(!my.rule.ai){
			return caller.sendError(415);
		}
		my.players.push(new exports.Robot(null, my.id, 2));
		my.export();
	};
	my.setAI = function(target, level, team){
		var i;

		for(i in my.players){
			if(!my.players[i]) continue;
			if(!my.players[i].robot) continue;
			if(my.players[i].id == target){
				my.players[i].setLevel(level);
				my.players[i].setTeam(team);
				my.export();
				return true;
			}
		}
		return false;
	};
	my.removeAI = function(target, noEx){
		var i, j;

		for(i in my.players){
			if(!my.players[i]) continue;
			if(!my.players[i].robot) continue;
			if(!target || my.players[i].id == target){
				if(my.gaming){
					j = my.game.seq.indexOf(my.players[i]);
					if(j != -1) my.game.seq.splice(j, 1);
				}
				my.players.splice(i, 1);
				if(!noEx) my.export();
				return true;
			}
		}
		return false;
	};
	my.refreshEffect = function(){
		my.effect.gm=false;
		my.effect.staff=false;
		my.effect.broadcast=false;
		for(i in my.players){
			if(!my.players[i]) continue;
			if(!DIC[my.players[i]]) continue;
			if(!DIC[my.players[i]].equip) continue;
			if(!DIC[my.players[i]].equip['BDG']) continue;
			switch(DIC[my.players[i]].equip['BDG']){
				case "b1_yt":
				case "b1_bj":
				case "b1_tw":
					my.effect.broadcast=true;
					console.log("broadcast");
					return;
					/*
				case "b1_gm":
					my.effect.gm=true;
					console.log("gm");
					return;
				case "b1_planner":
				case "b1_designer":
				case "b1_bgm":
				case "b1_video":
					my.effect.staff=true;
					console.log("staff");
					return;
					*/
			}
		}
	};
	my.applyRoomEffect = function(rw){
		if(my.effect.gm){
			rw.money = Math.round(rw.money * 2);
			rw.score = Math.round(rw.score * 2);
		} else if(my.effect.staff){
			rw.money = Math.round(rw.money * 1.5);
			rw.score = Math.round(rw.score * 1.5);
		} else if(my.effect.broadcast){
			rw.money = Math.round(rw.money * 1.2);
			rw.score = Math.round(rw.score * 1.2);
		}
	};
	my.come = function(client){
		if(!my.practice) client.place = my.id;

		if(my.players.push(client.id) == 1){
			my.master = client.id;
		}
		my.refreshEffect();
		if(CLUSTER.isWorker){
			client.ready = false;
			client.team = 0;
			client.cameWhenGaming = false;
			client.form = "J";

			if(!my.practice) process.send({ type: "room-come", target: client.id, id: my.id });
			my.export(client.id);
		}
	};
	my.spectate = function(client, password){
		if(!my.practice) client.place = my.id;
		var len = my.players.push(client.id);

		my.refreshEffect();
		if(CLUSTER.isWorker){
			client.ready = false;
			client.team = 0;
			client.cameWhenGaming = true;
			client.form = (len > my.limit) ? "O" : "S";

			process.send({ type: "room-spectate", target: client.id, id: my.id, pw: password });
			my.export(client.id, false, true);
		}
	};
	my.go = function(client, kickVote){
		var x = my.players.indexOf(client.id);
		var me;

		if(x == -1){
			my.refreshEffect();
			client.place = 0;
			if(my.players.length < 1) delete ROOM[my.id];
			return client.sendError(409);
		}
		my.players.splice(x, 1);
		my.refreshEffect();
		client.game = {};
		if(client.id == my.master){
			while(my.removeAI(false, true));
			my.master = my.players[0];
		}
		if(DIC[my.master]){
			DIC[my.master].ready = false;
			if(my.gaming){
				x = my.game.seq.indexOf(client.id);
				if(x != -1){
					if(my.game.seq.length <= 2){
						my.game.seq.splice(x, 1);
						my.roundEnd();
					}else{
						me = my.game.turn == x;
						if(me && my.rule.ewq){
							clearTimeout(my.game._rrt);
							my.game.loading = false;
							if(CLUSTER.isWorker) my.turnEnd();
						}
						my.game.seq.splice(x, 1);
						if(my.game.turn > x){
							my.game.turn--;
							if(my.game.turn < 0) my.game.turn = my.game.seq.length - 1;
						}
						if(my.game.turn >= my.game.seq.length) my.game.turn = 0;
					}
				}
			}
		}else{
			if(my.gaming){
				my.interrupt();
				my.game.late = true;
				my.gaming = false;
				my.game = {};
			}
			delete ROOM[my.id];
		}
		if(my.practice){
			clearTimeout(my.game.turnTimer);
			client.subPlace = 0;
		}else client.place = 0;

		if(CLUSTER.isWorker){
			if(!my.practice){
				client.socket.close();
				process.send({ type: "room-go", target: client.id, id: my.id, removed: !ROOM.hasOwnProperty(my.id) });
			}
			my.export(client.id, kickVote);
		}
	};
	my.set = function(room){
		var i, k, ijc, ij;

		my.title = room.title;
		my.password = room.password;
		my.limit = Math.max(Math.min(8, my.players.length), Math.round(room.limit));
		my.mode = room.mode;
		my.rule = Const.getRule(room.mode);
		my.round = Math.round(room.round);
		my.time = room.time;
		my.pq = room.pq;
		if(room.opts && my.opts){
			for(i in Const.OPTIONS){
				k = Const.OPTIONS[i].name.toLowerCase();
				if (!room.opts[k] || !my.rule.opts.includes(i))
					my.opts[k] = false;
				else
                    my.opts[k] = room.opts[k];
			}
			if(ijc = my.rule.opts.includes("ijp")){
				ij = Const[`${my.rule.lang.toUpperCase()}_IJP`];
				my.opts.injpick = (room.opts.injpick || []).filter(function(item){ return ij.includes(item); });
			}else my.opts.injpick = [];
		}
		if(!my.rule.ai){
			while(my.removeAI(false, true));
		}
		for(i in my.players){
			if(DIC[my.players[i]]) DIC[my.players[i]].ready = false;
		}
	};
	my.preReady = function(teams){
		var i, j, t = 0, l = 0;
		var avTeam = [];

		// 팀 검사
		if(teams){
			if(teams[0].length){
				if(teams[1].length > 1 || teams[2].length > 1 || teams[3].length > 1 || teams[4].length > 1) return 418;
			}else{
				for(i=1; i<5; i++){
					if(j = teams[i].length){
						if(t){
							if(t != j) return 418;
						}else t = j;
						l++;
						avTeam.push(i);
					}
				}
				if(l < 2) return 418;
				my._avTeam = shuffle(avTeam);
			}
		}
		// 인정픽 검사
		if(!my.rule) return 400;
		if(my.rule.opts.includes("ijp")){
			if(!my.opts.injpick) return 400;
			if(!my.opts.injpick.length) return 413;
			if(!my.opts.injpick.every(function(item){
				return !Const.IJP_EXCEPT.includes(item);
			})) return 414;
		}
		return false;
	};
	my.ready = function(){
		var i, all = true;
		var len = 0;
		var teams = [ [], [], [], [], [] ];

		for(i in my.players){
			if(my.players[i].robot){
				len++;
				teams[my.players[i].game.team].push(my.players[i]);
				continue;
			}
			if(!DIC[my.players[i]]) continue;
			if(DIC[my.players[i]].form == "S") continue;

			len++;
			teams[DIC[my.players[i]].team].push(my.players[i]);

			if(my.players[i] == my.master) continue;
			if(!DIC[my.players[i]].ready){
				all = false;
				break;
			}
		}
		if(!DIC[my.master]) return;
		if(len < 2) return DIC[my.master].sendError(411);
		if(i = my.preReady(teams)) return DIC[my.master].sendError(i);
		if(all){
			my._teams = teams;
			my.start();
		}else DIC[my.master].sendError(412);
	};
	my.start = function(pracLevel){
		var i, j, o, hum = 0;
		var now = (new Date()).getTime();

		my.gaming = true;
		my.game.late = true;
		my.game.round = 0;
		my.game.turn = 0;
		my.game.seq = [];
		my.game.robots = [];
		if(my.practice){
			my.game.robots.push(o = new exports.Robot(my.master, my.id, pracLevel));
			my.game.seq.push(o, my.master);
		}else{
			for(i in my.players){
				if(my.players[i].robot){
					my.game.robots.push(my.players[i]);
				}else{
					if(!(o = DIC[my.players[i]])) continue;
					if(o.form != "J") continue;
					hum++;
				}
				if(my.players[i]) my.game.seq.push(my.players[i]);
			}
			if(my._avTeam){
				o = my.game.seq.length;
				j = my._avTeam.length;
				my.game.seq = [];
				for(i=0; i<o; i++){
					var v = my._teams[my._avTeam[i % j]].shift();

					if(!v) continue;
					my.game.seq[i] = v;
				}
			}else{
				my.game.seq = shuffle(my.game.seq);
			}
		}
		my.game.mission = null;
		for(i in my.game.seq){
			o = DIC[my.game.seq[i]] || my.game.seq[i];
			if(!o) continue;
			if(!o.game) continue;

			o.playAt = now;
			o.ready = false;
			o.game.score = 0;
			o.game.bonus = 0;
			o.game.item = [/*0, 0, 0, 0, 0, 0*/];
			o.game.wpc = [];
		}
		my.game.hum = hum;
		my.getTitle().then(function(title){
			my.game.title = title;
			my.export();
			setTimeout(my.roundReady, 2000);
		});
		my.byMaster('starting', { target: my.id });
		delete my._avTeam;
		delete my._teams;
	};
	my.roundReady = function(){
		if(!my.gaming) return;

		return my.route("roundReady");
	};
	my.interrupt = function(){
		clearTimeout(my.game._rrt);
		clearTimeout(my.game.turnTimer);
		clearTimeout(my.game.hintTimer);
		clearTimeout(my.game.hintTimer2);
		clearTimeout(my.game.qTimer);
	};
	my.roundEnd = function(data){
		var i, o, rw;
		var res = [];
		var users = {};
		var rl;
		var pv = -1;
		var suv = [];
		var teams = [ null, [], [], [], [] ];
		var sumScore = 0;
		var now = (new Date()).getTime();

		my.interrupt();
		var LEAVELIST = [];
		for(i=0;i<my.players.length;i++){
			o = DIC[my.players[i]];
			if(!o) continue;
			if(o.cameWhenGaming){
				o.cameWhenGaming = false;
				if(o.form == "O"){
					LEAVELIST.push(my.players[i]);
					continue;
				}
				o.setForm("J");
			}
            var level = o.getLevel();
            if (my.opts.onlybeginner && level > 25)
                LEAVELIST.push(my.players[i]);
		}
		for(i=0;i<LEAVELIST.length;i++){
			DIC[LEAVELIST[i]].sendError(428);
			DIC[LEAVELIST[i]].leave();
		}
		for(i in my.game.seq){
			o = DIC[my.game.seq[i]] || my.game.seq[i];
			if(!o) continue;
			if(o.robot){
				if(o.game.team) teams[o.game.team].push(o.game.score);
			}else if(o.team) teams[o.team].push(o.game.score);
		}
		for(i=1; i<5; i++) if(o = teams[i].length) teams[i] = [ o, teams[i].reduce(function(p, item){ return p + item; }, 0) ];
		for(i in my.game.seq){
			o = DIC[my.game.seq[i]];
			if(!o) continue;
			sumScore += o.game.score;
			res.push({ id: o.id, score: o.team ? teams[o.team][1] : o.game.score, dim: o.team ? teams[o.team][0] : 1 });
		}
		res.sort(function(a, b){ return b.score - a.score; });
		rl = res.length;
		for(var j = 0;j<res.length;j++){
			o = DIC[res[j].id];
			if(pv == res[j].score){
				res[j].rank = res[Number(j) - 1].rank;
			}else{
				res[j].rank = Number(j);
			}
			pv = res[j].score;
			rw = getRewards(my.mode, o.game.score / res[j].dim, o.game.bonus, res[j].rank, rl, sumScore);
			rw.playTime = now - o.playAt;
			o.applyEquipOptions(rw);
			my.applyRoomEffect(rw);
			if(rw.together){
				if(o.game.wpc){
					var k=1;
					o.game.wpc.forEach(function(item){
						if(k>=6) return;
						o.obtain("$WPC" + item, 1);
						k++;
					});
				}
				o.onOKG(rw.playTime);
			}
			res[j].reward = rw;
			o.data.score += rw.score || 0;
			o.money += rw.money || 0;
			o.data.record[Const.GAME_TYPE[my.mode]][2] += rw.score || 0;
			o.data.record[Const.GAME_TYPE[my.mode]][3] += rw.playTime;
			if(!my.practice && rw.together){
				o.data.record[Const.GAME_TYPE[my.mode]][0]++;
				if(res[j].rank == 0) o.data.record[Const.GAME_TYPE[my.mode]][1]++;
			}
			users[o.id] = o.getData();

			suv.push(o.flush(true));
		}
		Lizard.all(suv).then(function(uds){
			var o = {};

			suv = [];
			for(i in uds){
				o[uds[i].id] = { prev: uds[i].prev };
				suv.push(DB.redis.getSurround(uds[i].id));
			}
			Lizard.all(suv).then(function(ranks){
				var i, j;

				for(i in ranks){
					if(!o[ranks[i].target]) continue;

					o[ranks[i].target].list = ranks[i].data;
				}
				my.byMaster('roundEnd', { result: res, users: users, ranks: o, data: data }, true);
			});
		});
		my.gaming = false;
		my.export();
		delete my.game.seq;
		delete my.game.wordLength;
		delete my.game.dic;
	};
	my.byMaster = function(type, data, nob, special){
		if(DIC[my.master]) DIC[my.master].publish(type, data, nob, special);
	};
	my.export = function(target, kickVote, spec){
		var obj = { room: my.getData() };
		var i, o;

		if(!my.rule) return;
		if(target) obj.target = target;
		if(kickVote) obj.kickVote = kickVote;
		if(spec && my.gaming){
			if(my.rule.rule == "Classic"){
				if(my.game.chain) obj.chain = my.game.chain.length;
			}else if(my.rule.rule == "Jaqwi"){
				obj.theme = my.game.theme;
				obj.conso = my.game.conso;
			}else if(my.rule.rule == "Crossword"){
				obj.prisoners = my.game.prisoners;
				obj.boards = my.game.boards;
				obj.means = my.game.means;
			}
			obj.spec = {};
			for(i in my.game.seq){
				if(o = DIC[my.game.seq[i]]) obj.spec[o.id] = o.game.score;
			}
		}
		if(my.practice){
			if(DIC[my.master || target]) DIC[my.master || target].send('room', obj);
		}else{
			exports.publish('room', obj, my.password);
		}
	};
	my.turnStart = function(force){
		if(!my.gaming) return;

		return my.route("turnStart", force);
	};
	my.readyRobot = function(robot){
		if(!my.gaming) return;

		return my.route("readyRobot", robot);
	};
	my.turnRobot = function(robot, text, data){
		if(!my.gaming) return;

		my.submit(robot, text, data);
		//return my.route("turnRobot", robot, text);
	};
	my.turnNext = function(force){
		if(!my.gaming) return;
		if(!my.game.seq) return;

		my.game.turn = (my.game.turn + 1) % my.game.seq.length;
		my.turnStart(force);
	};
	my.turnEnd = function(){
		return my.route("turnEnd");
	};
	my.submit = function(client, text, data){
		return my.route("submit", client, text, data);
	};
	my.getScore = function(text, delay, ignoreMission){
		return my.routeSync("getScore", text, delay, ignoreMission);
	};
	my.getTurnSpeed = function(rt){
		if(rt < 5000) return 10;
		else if(rt < 11000) return 9;
		else if(rt < 18000) return 8;
		else if(rt < 26000) return 7;
		else if(rt < 35000) return 6;
		else if(rt < 45000) return 5;
		else if(rt < 56000) return 4;
		else if(rt < 68000) return 3;
		else if(rt < 81000) return 2;
		else if(rt < 95000) return 1;
		else return 0;
	};
	my.getTitle = function(){
		return my.route("getTitle");
	};
	/*my.route = function(func, ...args){
		var cf;

		if(!(cf = my.checkRoute(func))) return;
		return Slave.run(my, func, args);
	};*/
	my.route = my.routeSync = function(func, ...args){
		var cf;

		if(!(cf = my.checkRoute(func))) return;
		return cf.apply(my, args);
	};
	my.checkRoute = function(func){
		var c;

		if(!my.rule) return JLog.warn("Unknown mode: " + my.mode), false;
		if(!(c = Rule[my.rule.rule])) return JLog.warn("Unknown rule: " + my.rule.rule), false;
		if(!c[func]) return JLog.warn("Unknown function: " + func), false;
		return c[func];
	};
	my.set(room);
};
exports.getFreeChannel = function() {
	var i, list = {};

	if(CLUSTER.isMaster){
		var mk = 1;

		for(i in CHAN){
			// if(CHAN[i].isDead()) continue;
			list[i] = 0;
		}
		for(i in ROOM){
			// if(!list.hasOwnProperty(i)) continue;
			mk = ROOM[i].channel;
			list[mk]++;
		}
		for(i in list){
			if(list[i] < list[mk]) mk = i;
		}
		return Number(mk);
	}else{
		return channel || 0;
	}
};
function getGuestName(sid){
	var i, len = sid.length, res = 0;

	for(i=0; i<len; i++){
		res += sid.charCodeAt(i) * (i+1);
	}
	return "GUEST" + (1000 + (res % 9000));
}
function shuffle(arr){
	var i, r = [];

	for(i in arr) r.push(arr[i]);
	r.sort(function(a, b){ return Math.random() - 0.5; });

	return r;
}
function getRewards(mode, score, bonus, rank, all, ss){
	var rw = { score: 0, money: 0 };
	var sr = score / ss;

	// all은 1~8
	// rank는 0~7
	switch(Const.GAME_TYPE[mode]){
		case "EKT":
			rw.score += score * 1.4;
			break;
		case "ESH":
			rw.score += score * 0.5;
			break;
		case "KKT":
			rw.score += score * 0.85;
			break;
		case "KSH":
			rw.score += score * 0.55;
			break;
		case "CSQ":
			rw.score += score * 0.4;
			break;
		case 'KCW':
			rw.score += score * 1.0;
			break;
		case 'KTY':
			rw.score += score * 0.3;
			break;
		case 'ETY':
			rw.score += score * 0.37;
			break;
		case 'KAP':
			rw.score += score * 0.8;
			break;
		case 'HUN':
			rw.score += score * 0.5;
			break;
		case 'KDA':
			rw.score += score * 0.57;
			break;
		case 'EDA':
			rw.score += score * 0.65;
			break;
		case 'KSS':
			rw.score += score * 0.5;
			break;
		case 'ESS':
			rw.score += score * 0.22;
			break;
        case 'KWS':
            rw.score += score * 1.0;
            break;
		default:
			break;
	}
	rw.score = rw.score
		* (0.77 + 0.05 * (all - rank) * (all - rank)) // 순위
		* 1.25 / (1 + 1.25 * sr * sr) // 점차비(양학했을 수록 ↓)
	;
	rw.money = 1 + rw.score * 0.03;
	if(all < 2){
		rw.score = rw.score * 0.05;
		rw.money = rw.money * 0.05;
	}else{
		rw.together = true;
	}
	rw.score += bonus;
	rw.score = rw.score || 0;
	rw.money = rw.money || 0;

	// applyEquipOptions에서 반올림한다.
	return rw;
}
function filterRobot(item){
	if(!item) return {};
	return (item.robot && item.getData) ? item.getData() : item;
}
