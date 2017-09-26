const CLUSTER = require("cluster");

var File = require('fs');
var WebSocket = require('ws');
// var Heapdump = require("heapdump");
var KKuTu = require('./kkutu');
var GLOBAL = require("../sub/global.json");
var Const = require("../const");
var JLog = require('../sub/jjlog');
var crypto = require('crypto');

var MainDB;

var Server;
var DIC = {};
var DNAME = {};
var ROOM = {};

var T_ROOM = {};
var T_USER = {};

var SID;
var WDIC = {};

var moment = require('moment');

const DEVELOP = exports.DEVELOP = global.test || false;
const GUEST_PERMISSION = exports.GUEST_PERMISSION = {
	'create': true,
	'enter': true,
	'talk': true,
	'practice': true,
	'ready': true,
	'start': true,
	'invite': true,
	'inviteRes': true,
	'kick': true,
	'kickVote': true,
	'wp': true
};
const ENABLE_ROUND_TIME = exports.ENABLE_ROUND_TIME = [ 10, 20, 30, 40, 60, 80, 90, 120, 150, 180, 240, 300 ];
const ENABLE_FORM = exports.ENABLE_FORM = [ "S", "J" ];
const MODE_LENGTH = exports.MODE_LENGTH = Const.GAME_TYPE.length;
const PORT = process.env['KKUTU_PORT'];

var LobbyChat = true;

process.on('uncaughtException', function(err){
	var text = `:${PORT} [${new Date().toLocaleString()}] ERROR: ${err.toString()}\n${err.stack}\n`;

	File.appendFile("KKUTU_ERROR.log", text, function(res){
		JLog.error(`ERROR OCCURRED ON THE MASTER!`);
		console.log(text);
	});
});
function processAdmin(id, value){
	var cmd, temp, i, j;

	value = value.replace(/^(#\w+\s+)?(.+)/, function(v, p1, p2){
		if(p1) cmd = p1.slice(1).trim();
		return p2;
	});
	switch(cmd){
		case "roomtitle":
			var q = value.trim().split(" ");
			if (temp = ROOM[q[0]]) {
				var newRoomTitle=q[1].replace("_", " ");
				temp.title = newRoomTitle;
				KKuTu.publish('room', { target: id, room:temp.getData(), modify: true }, temp.password);
			}
			return null;
		case "yell":
			yell(value, false);
			return null;
		case "yelll":
			yell(value, true);
			return null;
		case "whois":
			for (var i in DIC) {
				var tmp = DIC[i];
				var ip = tmp.socket.upgradeReq.connection.remoteAddress.split(":").pop();
				if (value == ip)
					DIC[id].send('tail', { a: "WHOIS", rid: value, id: "", msg: "WHOIS/"+tmp.nick });
			}
			return null;
		case "kill":
			if(temp = DIC[value]){
				temp.socket.send('{"type":"error","code":410}');
				temp.socket._socket.destroy();
				temp.socket.close();
			}
			return null;
		case "tailroom":
			if(temp = ROOM[value]){
				if(T_ROOM[value] == id){
					i = true;
					delete T_ROOM[value];
				}else T_ROOM[value] = id;
				if(DIC[id]) DIC[id].send('tail', { a: i ? "trX" : "tr", rid: temp.id, id: id, msg: { pw: temp.password, players: temp.players } });
			}
			return null;
		case "tailuser":
			if(temp = DIC[value]){
				if(T_USER[value] == id){
					i = true;
					delete T_USER[value];
				}else T_USER[value] = id;
				temp.send('test');
				if(DIC[id]) DIC[id].send('tail', { a: i ? "tuX" : "tu", rid: temp.id, id: id, msg: temp.getData() });
			}
			return null;
		case "ipcheck":
			try{
				if(DIC[value]) {
					if (DIC[id]) DIC[id].send('tail', { a: "IP CHECK", rid: value, id: "", msg: DIC[value].socket.upgradeReq.connection.remoteAddress });
					else JLog.log("IPCHECK ERROR: Receiver ["+id+"] does not exists!");
				} else
					JLog.log("IPCHECK ERROR: Target ["+id+"] does not exists!");
			}
			catch(e){console.log(e);}
			return null;
		case "dump":
			if(DIC[id]) DIC[id].send('yell', { value: "This feature is not supported..." });
			/*Heapdump.writeSnapshot("/home/kkutu_memdump_" + Date.now() + ".heapsnapshot", function(err){
				if(err){
					JLog.error("Error when dumping!");
					return JLog.error(err.toString());
				}
				if(DIC[id]) DIC[id].send('yell', { value: "DUMP OK" });
				JLog.success("Dumping success.");
			});*/
			return null;
		case "roommaster":
			var values = value.split(" ");
			if(!DIC[values[1]]) return;
			if (temp = ROOM[values[0]]) {
				temp.master = values[1];
				KKuTu.publish('room', { target: id, room:temp.getData(), modify: true }, temp.password);
			}
			return null;
		case "setlobbychat":
			var value = value.split(" ");
			if(value[0]=="enable") LobbyChat = true;
			else if(value[0]=="disable") LobbyChat = false;
			return null;
	}
	return value;
}
function checkTailUser(id, place, msg){
	var temp;

	if(temp = T_USER[id]){
		if(!DIC[temp]){
			delete T_USER[id];
			return;
		}
		DIC[temp].send('tail', { a: "user", rid: place, id: id, msg: msg });
	}
}
function narrateFriends(id, friends, stat){
	if(!friends) return;
	var fl = Object.keys(friends);

	if(!fl.length) return;

	MainDB.users.find([ '_id', { $in: fl } ], [ 'server', /^\w+$/ ]).limit([ 'server', true ]).on($fon => {
		var i, sf = {}, s;

		for(i in $fon){
			if(!sf[s = $fon[i].server]) sf[s] = [];
			sf[s].push($fon[i]._id);
		}
		if(DIC[id]) DIC[id].send('friends', { list: sf });

		if(sf[SID]){
			KKuTu.narrate(sf[SID], 'friend', { id: id, s: SID, stat: stat });
			delete sf[SID];
		}
		for(i in WDIC){
			WDIC[i].send('narrate-friend', { id: id, s: SID, stat: stat, list: sf });
			break;
		}
	});
}
function yell(value, val){
	for(i in WDIC){
		WDIC[i].send('yell', { value: value, bar:val });
		break;
	}
}
CLUSTER.on('message', function(worker, msg){
	var temp;

	switch(msg.type){
		case "admin":
			if(DIC[msg.id] && DIC[msg.id].admin) processAdmin(msg.id, msg.value);
			break;
		case "tail-report":
			if(temp = T_ROOM[msg.place]){
				if(!DIC[temp]) delete T_ROOM[msg.place];
				DIC[temp].send('tail', { a: "room", rid: msg.place, id: msg.id, msg: msg.msg });
			}
			checkTailUser(msg.id, msg.place, msg.msg);
			break;
		case "okg":
			if(DIC[msg.id]) DIC[msg.id].onOKG(msg.time);
			break;
		case "kick":
			if(DIC[msg.target]) DIC[msg.target].socket.close();
			break;
		case "invite":
			if(!DIC[msg.target]){
				worker.send({ type: "invite-error", target: msg.id, code: 417 });
				break;
			}
			if(DIC[msg.target].place != 0){
				worker.send({ type: "invite-error", target: msg.id, code: 417 });
				break;
			}
			if(!GUEST_PERMISSION.invite) if(DIC[msg.target].guest){
				worker.send({ type: "invite-error", target: msg.id, code: 422 });
				break;
			}
			if(DIC[msg.target]._invited){
				worker.send({ type: "invite-error", target: msg.id, code: 419 });
				break;
			}
			DIC[msg.target]._invited = msg.place;
			DIC[msg.target].send('invited', { from: msg.place });
			break;
		case "room-new":
			if(ROOM[msg.room.id] || !DIC[msg.target]){ // 이미 그런 ID의 방이 있다... 그 방은 없던 걸로 해라.
				worker.send({ type: "room-invalid", room: msg.room });
			}else{
				ROOM[msg.room.id] = new KKuTu.Room(msg.room, msg.room.channel);
			}
			break;
		case "room-come":
			if(ROOM[msg.id] && DIC[msg.target]){
				ROOM[msg.id].come(DIC[msg.target]);
			}else{
				JLog.warn(`Wrong room-come id=${msg.id}&target=${msg.target}`);
			}
			break;
		case "room-spectate":
			if(ROOM[msg.id] && DIC[msg.target]){
				ROOM[msg.id].spectate(DIC[msg.target], msg.pw);
			}else{
				JLog.warn(`Wrong room-spectate id=${msg.id}&target=${msg.target}`);
			}
			break;
		case "room-go":
			if(ROOM[msg.id] && DIC[msg.target]){
				ROOM[msg.id].go(DIC[msg.target]);
			}else{
				// 나가기 말고 연결 자체가 끊겼을 때 생기는 듯 하다.
				JLog.warn(`Wrong room-go id=${msg.id}&target=${msg.target}`);
				if(ROOM[msg.id] && ROOM[msg.id].players){
					// 이 때 수동으로 지워준다.
					var x = ROOM[msg.id].players.indexOf(msg.target);

					if(x != -1){
						ROOM[msg.id].players.splice(x, 1);
						JLog.warn(`^ OK`);
					}
				}
				if(msg.removed) delete ROOM[msg.id];
			}
			break;
		case "user-publish":
			if(temp = DIC[msg.data.id]){
				for(var i in msg.data){
					temp[i] = msg.data[i];
				}
			}
			break;
		case "room-publish":
			if(temp = ROOM[msg.data.room.id]){
				for(var i in msg.data.room){
					temp[i] = msg.data.room[i];
				}
				temp.password = msg.password;
			}
			KKuTu.publish('room', msg.data);
			break;
		case "room-expired":
			if(msg.create && ROOM[msg.id]){
				for(var i in ROOM[msg.id].players){
					var $c = DIC[ROOM[msg.id].players[i]];

					if($c) $c.send('roomStuck');
				}
				delete ROOM[msg.id];
			}
			break;
		case "room-invalid":
			delete ROOM[msg.room.id];
			break;
		default:
			JLog.warn(`Unhandled IPC message type: ${msg.type}`);
	}
});

function idDecrypt(id) {
	const idDecAlgo = '<ALGORITHM>'; // or any other algorithm supported by OpenSSL
	const idDecKey = '<KEY>';

	var idDecCtx = crypto.createDecipher(idDecAlgo, idDecKey);
	try {
		var ret = idDecCtx.update(id, 'hex', 'utf8') + idDecCtx.final('utf8');
	} catch (e) {
		JLog.info("INVALID ID REQUEST ["+id+"]");
		return "";
	}
	return ret;
};

exports.validateToken = token => {
	return idDecrypt(token).;
};

exports.init = function(_SID, CHAN){
	JLog.init("game_"+process.env['KKUTU_PORT']);
	SID = _SID;
		MainDB = require('../sub/db');
		MainDB.ready = function(){
		var $c;
		JLog.success("Master DB is ready.");

		MainDB.users.update([ 'server', SID ]).set([ 'server', "" ]).on();
		Server = new WebSocket.Server({
			port: global.test ? Const.TEST_PORT : PORT,
			perMessageDeflate: false
		});
		Server.on('connection', function(socket){
			var key = null;
			var _key = socket.upgradeReq.url.slice(1);
			var ip = socket.upgradeReq.connection.remoteAddress;
			if (!ip.match(/127\.0\.0\.1$/)) {
				key = exports.validateToken(_key);
				if (!key) {
					socket.close();
					return;
				}
			} else
				key = _key;

			socket.on('error', function(err){
				JLog.warn("Error on #" + key + " on ws: " + err.toString());
			});
			// 웹 서버
			if(socket.upgradeReq.headers.host.match(/^127\.0\.0\.2:/)){
				if(WDIC[key]) WDIC[key].socket.close();
				WDIC[key] = new KKuTu.WebServer(socket);
				JLog.info(`New web server #${key}`);
				WDIC[key].socket.on('close', function(){
					JLog.alert(`Exit web server #${key}`);
					/*BUGFIX*/
					if (WDIC[key].socket)
						WDIC[key].socket.removeAllListeners();
					delete WDIC[key];
				});
				return;
			}
			if(Object.keys(DIC).length >= Const.KKUTU_MAX){
				socket.send(`{ "type": "error", "code": "full" }`);
				return;
			}
			MainDB.session.findOne([ '_id', key ]).limit([ 'profile', true ]).on(function($body){
				//JLog.log($body);
				$c = new KKuTu.Client(socket, $body ? $body.profile : null, key);
				$c.admin = GLOBAL.ADMIN.indexOf($c.id) != -1;

				if(DIC[$c.id]){
					DIC[$c.id].sendError(408);
					DIC[$c.id].socket.close();
				}
				if(DEVELOP && !Const.TESTER.includes($c.id)){
					$c.sendError(500);
					$c.socket.close();
					return;
				}
				if($c.guest){
					if(SID != "0"&&SID != "1"){
						$c.sendError(402);
						$c.socket.close();
						return;
					}
					if(KKuTu.NIGHT){
						$c.sendError(440);
						$c.socket.close();
						return;
					}
				}
				if($c.isAjae === null){
					$c.sendError(441);
					$c.socket.close();
					return;
				}
				$c.refresh().then(function(ref){
					if(ref.result == 200){
						if(!$c.nick) $c.nick = "nonick";
						$c.noChat = false;
						var ip = $c.socket.upgradeReq.connection.remoteAddress;
						$c.send('welcome', {
							id: $c.id,
							nick: $c.nick,
							guest: $c.guest,
							box: $c.box,
							playTime: $c.data.playTime,
							okg: $c.okgCount,
							users: KKuTu.getUserList(),
							rooms: KKuTu.getRoomList(),
							friends: $c.friends,
							admin: $c.admin,
							test: global.test,
							caj: $c._checkAjae ? true : false
						});

						JLog.info("New user #" + $c.id + " IP ["+ip+"]");
					}else{
						$c.send('error', {
							code: ref.result, message: ref.black
						});
						$c._error = ref.result;
						$c.socket.close();
						// JLog.info("Black user #" + $c.id);
					}
				});
			});
			Server.on('error', function(err){
				JLog.warn("Error on ws: " + err.toString());
			});
			});
			KKuTu.init(MainDB, DIC, ROOM, GUEST_PERMISSION, CHAN, SID);
	};
};
KKuTu.onClientMessage = function($c, msg){
	var stable = true;
	var temp;
	var now = (new Date()).getTime();

	if(!msg) return;

	if($c.nick =="nonick"&&msg.type!="newNick") return;

	switch(msg.type){
		case 'yell':
			if(!msg.value) return;
			if(!$c.admin) return;

			yell(msg.value,false);
			break;
		case 'yelll':
			if(!msg.value) return;
			if(!$c.admin) return;

			yell(msg.value,true);
			break;
		case 'refresh':
			$c.refresh();
			break;
		case 'talk':
			if(!msg.value) return;
			if(!msg.value.substr) return;
			if(!GUEST_PERMISSION.talk) if($c.guest){
				$c.send('error', { code: 401 });
				return;
			}
			msg.value = msg.value.substr(0, 200);
			if($c.admin){
				if(!processAdmin($c.id, msg.value)) break;
			} else {
				if(msg.value.length > 50){
					//50글자 이상인 경우 메시지를 보내고 강제로 50글자까지만 표시.
					$c.send('yell', { value: "로비에서의 채팅은 50글자까지 가능합니다." });
					msg.value = msg.value.substr(0, 50);
				}
			}
			checkTailUser($c.id, $c.place, msg);
			if(msg.whisper){
				msg.whisper.split(',').forEach(v => {
					if(temp = DIC[DNAME[v]]){
						temp.send('chat', { from: $c.nick, nick: $c.nick, profile: $c.profile, value: msg.value });
					}else{
						$c.sendError(424, v);
					}
				});
			}else{
				if(LobbyChat || GLOBAL.ADMIN.indexOf($c.id) != -1 || $c.place !=0) {
					$c.chat(msg.value, undefined, true);
				}
				else $c.send('yell', { value: "운영자에 의해 로비채팅이 제한되어 있습니다." });
			}
			break;
		case 'friendAdd':
			if(!msg.target) return;
			if($c.guest) return;
			if($c.id == msg.target) return;
			if(Object.keys($c.friends).length >= 100) return $c.sendError(452);
			if(temp = DIC[msg.target]){
				if(temp.guest) return $c.sendError(453);
				if($c._friend) return $c.sendError(454);
				$c._friend = temp.id;
				temp.send('friendAdd', { from: $c.id });
			}else{
				$c.sendError(450);
			}
			break;
		case 'friendAddRes':
			if(!(temp = DIC[msg.from])) return;
			if(temp._friend != $c.id) return;
			if(msg.res){
				// $c와 temp가 친구가 되었다.
				$c.addFriend(temp.id);
				temp.addFriend($c.id);
			}
			temp.send('friendAddRes', { target: $c.id, res: msg.res });
			delete temp._friend;
			break;
		case 'friendEdit':
			if(!$c.friends) return;
			if(!$c.friends[msg.id]) return;
			$c.friends[msg.id] = (msg.memo || "").slice(0, 50);
			$c.flush(false, false, true);
			$c.send('friendEdit', { friends: $c.friends });
			break;
		case 'friendRemove':
			if(!$c.friends) return;
			if(!$c.friends[msg.id]) return;
			$c.removeFriend(msg.id);
			break;
		case 'newNick':
			if (!msg.id || !msg.nick) return;
			MainDB.users.findOne([ '_id', msg.id ]).on(function($body){
				if ($body.nick != msg.nick) {
					return;
				}
				$c.refresh().then(function(ref){
					if(ref.result == 200){
						MainDB.users.update([ '_id', $c.id ]).set([ 'server', SID ]).on();
						MainDB.users.update([ '_id', $c.id ]).set([ 'recentIP', ip ]).on();
						DIC[$c.id] = $c;
						DNAME[$c.nick.replace(/\s/g, "")] = $c.id;
						KKuTu.publish('conn', { user: $c.getData() });
						narrateFriends($c.id, $c.friends, "on");
					}
				});
			});
			break;
		case 'nickChange':
			if (!msg.id || !msg.nick) return;
			MainDB.users.findOne([ '_id', msg.id ]).on(function($body){
				if ($body.nick != msg.nick) {
					return;
				}
				$c.refresh().then(function(ref){
					if(ref.result == 409){
						JLog.info("Nickchange "+msg.id+" "+msg.nick);
						$c.publish('nickChange', $c.getData());
					}
				});
			});
			break;
 		case 'enter':
		case 'setRoom':
			if(!msg.title) stable = false;
			if(!msg.limit) stable = false;
			if(!msg.round) stable = false;
			if(!msg.time) stable = false;
			if(!msg.opts) stable = false;

			msg.code = false;
			msg.limit = Number(msg.limit);
			msg.mode = Number(msg.mode);
			msg.round = Number(msg.round);
			msg.time = Number(msg.time);

			if(isNaN(msg.limit)) stable = false;
			if(isNaN(msg.mode)) stable = false;
			if(isNaN(msg.round)) stable = false;
			if(isNaN(msg.time)) stable = false;
			if(stable){
				if(msg.title.length > 20) stable = false;
				if(msg.password.length > 20) stable = false;
				if(msg.limit < 2 || msg.limit > 8){
					msg.code = 432;
					stable = false;
				}
				if(msg.mode < 0 || msg.mode >= MODE_LENGTH) stable = false;
				if(msg.round < 1 || msg.round > 10){
					msg.code = 433;
					stable = false;
				}
				if(ENABLE_ROUND_TIME.indexOf(msg.time) == -1) stable = false;
			}
			if(msg.type == 'enter'){
				if(msg.id || stable) $c.enter(msg, msg.spectate);
				else $c.sendError(msg.code || 431);
			}else if(msg.type == 'setRoom'){
				if(stable) $c.setRoom(msg);
				else $c.sendError(msg.code || 431);
			}
			break;
		case 'inviteRes':
			if(!(temp = ROOM[msg.from])) return;
			if(!GUEST_PERMISSION.inviteRes) if($c.guest) return;
			if($c._invited != msg.from) return;
			if(msg.res){
				$c.enter({ id: $c._invited }, false, true);
			}else{
				if(DIC[temp.master]) DIC[temp.master].send('inviteNo', { target: $c.id });
			}
			delete $c._invited;
			break;
		case 'caj':
			if(!$c._checkAjae) return;
			clearTimeout($c._checkAjae);
			if(msg.answer == "yes") $c.confirmAjae(msg.input);
			else if(KKuTu.NIGHT){
				$c.sendError(440);
				$c.socket.close();
			}
			break;
		case 'test':
			checkTailUser($c.id, $c.place, msg);
			break;
		default:
			break;
	}
};

KKuTu.onClientClosed = function($c, code){
	delete DIC[$c.id];
	if($c._error != 409) MainDB.users.update([ '_id', $c.id ]).set([ 'server', "" ]).on();
	if($c.profile) delete DNAME[$c.nick];
	if($c.socket) $c.socket.removeAllListeners();
	if($c.friends) narrateFriends($c.id, $c.friends, "off");
	KKuTu.publish('disconn', { id: $c.id });

	JLog.alert("Exit #" + $c.id);
};
