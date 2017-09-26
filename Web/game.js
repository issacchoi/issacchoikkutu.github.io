module.exports = function(GameWeb, Parser, GLOBAL, REDIS_SESSION){
	var WS		 = require("ws");
	var Web		 = require("request");
	var DDDoS	 = require("./dddos/index");
	var DB		 = require("../sub/db");
	var JAuth	 = require("../sub/jauth");
	var JLog	 = require("../sub/jjlog");
	JLog.init("game");
	var WebInit	 = require("../sub/webinit");
	var Const	 = require("../const");
	var Cache    = require("express-static-cache");
	var Path     = require('path');
	var crypto   = require('crypto');
	var Express = require('express');

	var Compression = require('compression');

	var ErrorPage = require("./errorpage");
	ErrorPage.init(GameWeb);

	var Language = {
		'ko_KR': require("./lang/ko_KR.json"),
		'en_US': require("./lang/en_US.json")
	};
	var ROUTES = [
		"major", "consume", "admin"
	];
	var page = WebInit.page;
	var gameServers = [];

	const idEncAlgo = '<ALGORITHM>';
	const idEncKey = '<KEY>';

	WebInit.MOBILE_AVAILABLE = [
		"portal", "main", "kkutu"
	];

	require("../sub/checkpub");

	JLog.info("<< KKuTu Web >> Port ["+GLOBAL.WEB_PORT+"]");
	GameWeb.set('views', __dirname + "/game/views");
	GameWeb.set('view engine', "pug");
	GameWeb.use(Parser.json());
	GameWeb.use(Parser.urlencoded({ extended: true, limit:'50mb' }));
	GameWeb.use(REDIS_SESSION);
	GameWeb.use(Compression());
	GameWeb.use(function(req, res, next) {
		var ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		if (!ip) {
			ErrorPage.send(req, res, 500);
			return;
		}
		try {
			if (ip.substring(0, 7) == "::ffff:")
				ip = ip.substring(7);
		} catch(e) {
			JLog.warn("New IP type ["+ip.toString()+"]");
		}
	});

	GameWeb.use(function(req, res, next) {
		var ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		var err = null;
		try {
			decodeURIComponent(req.path);
		}
		catch(e) {
			err = e;
		}
		if (err){
			JLog.warn("Invalid param ["+req.url+"] from IP ["+ip+"]");
			return ErrorPage.send(req, res, 500);
		}
		next();
	});

	WebInit.init(GameWeb, true);
	DB.ready = function(){
		setInterval(function(){
			var q = [ 'createdAt', { $lte: Date.now() - 3600000 * 12 } ];

			DB.session.remove(q).on();
		}, 600000);
		setInterval(function(){
			gameServers.forEach(function(v){
				if (v.socket) {
					try {
						v.socket.send(`{"type":"seek"}`);
					} catch (e) {
						JLog.warn(`Game server #${v.id}:seek has an error: ${e.toString()}`);
					}
				} else v.seek = undefined;
			});
		}, 4000);
		DB.redis.snapShot("KKuTu_Score_Snapshot");
		setInterval(function(){
			DB.redis.snapShot("KKuTu_Score_Snapshot");
		}, 86400*1000);
		JLog.success("DB is ready.");

		DB.kkutu_shop_desc.find().on(function($docs){
			var i, j;

			for(i in Language) flush(i);
			function flush(lang){
				var db;

				Language[lang].SHOP = db = {};
				for(j in $docs){
					db[$docs[j]._id] = [ $docs[j][`name_${lang}`], $docs[j][`desc_${lang}`] ];
				}
			}
		});
	};
	Const.MAIN_PORTS.forEach(function(v, i){
		var KEY = process.env['WS_KEY'];

		gameServers[i] = new GameClient(KEY, `ws://127.0.0.2:${v}/${KEY}`);
	});
	function GameClient(id, url){
		var my = this;

		my.id = id;
		my.socket = new WS(url, { perMessageDeflate: false });

		my.send = function(type, data){
			if(!data) data = {};
			if(typeof my.socket == 'undefined')
				my.socket = new WS(url, { perMessageDeflate: false });
			data.type = type;

			try {
				my.socket.send(JSON.stringify(data));
			} catch(e) {
				JLog.warn(`Game server #${my.id}:send has an error: ${e.toString()}`);
			}
		};
		my.socket.on('open', function(){
			JLog.info(`Game server #${my.id} connected`);
		});
		my.socket.on('error', function(err){
			JLog.warn(`Game server #${my.id} has an error: ${err.toString()}`);
		});
		my.socket.on('close', function(code){
			JLog.error(`Game server #${my.id} closed: ${code}`);
			my.socket.removeAllListeners();
			delete my.socket;
		});
		my.socket.on('message', function(data){
			var _data = data;
			var i;

			data = JSON.parse(data);

			switch(data.type){
				case "seek":
					my.seek = data.value;
					break;
				case "narrate-friend":
					for(i in data.list){
						gameServers[i].send('narrate-friend', { id: data.id, s: data.s, stat: data.stat, list: data.list[i] });
					}
					break;
				case "yell":
					for(var j=0;j<gameServers.length;j++){
						gameServers[j].send('yell', { value: data.value, bar : data.bar });
					}
					break;
				default:
			}
		});
	}
	ROUTES.forEach(function(v){
		require(`./game/routes/${v}`).run(GameWeb, WebInit.page,ErrorPage);
	});
	function idEncrypt(id) {
		var idEncCtx = crypto.createCipher(idEncAlgo, idEncKey);
		var ret = idEncCtx.update(id, 'utf8', 'hex') + idEncCtx.final('hex');
		return ret;
	}
	GameWeb.get("/mobile", function(req, res){
		var server = req.query.server;
		var before = req.query.before;

		if(req.query.code){ // 네이버 토큰
			req.session.authType = "naver";
			req.session.token = req.query.code;
			res.redirect("/register?before="+(before?before:"/"));
		}else if(req.query.token){ // 페이스북 토큰
			req.session.authType = "facebook";
			req.session.token = req.query.token;
			res.redirect("/register?before="+(before?before:"/"));
		}else{
			DB.session.findOne([ '_id', req.session.id ]).on(function($ses){
				if(global.isPublic){
					onFinish($ses);
				}else{
					if($ses) $ses.profile.sid = $ses._id;
					onFinish($ses);
				}
			});
		}
		function onFinish($doc){
			var id = req.session.id;

			if($doc){
				req.session.profile = $doc.profile;
				id = $doc.profile.sid;
			}else{
				delete req.session.profile;
			}
			res.json({'_page': "kkutu",
				'_id': id,
				'_idconn': idEncrypt(id),
				'PORT': Const.MAIN_PORTS[server],
				'HOST': req.hostname,
				'TEST': req.query.test,
				'MOREMI_PART': Const.MOREMI_PART,
				'AVAIL_EQUIP': Const.AVAIL_EQUIP,
				'CATEGORIES': Const.CATEGORIES,
				'GROUPS': Const.GROUPS,
				'MODE': Const.GAME_TYPE,
				'RULE': Const.RULE,
				'OPTIONS': Const.OPTIONS,
				'KO_INJEONG': Const.KO_INJEONG,
				'EN_INJEONG': Const.EN_INJEONG,
				'KO_THEME': Const.KO_THEME,
				'EN_THEME': Const.EN_THEME,
				'IJP_EXCEPT': Const.IJP_EXCEPT,
				'SHOP': Language[req.query.locale || "ko_KR"].SHOP});
		}
	});
	GameWeb.get("/", function(req, res){
		var server = req.query.server;
		var before = req.query.before;
		if (req.session) {
			var now = Date.now();
			if (!req.session.lastmain) {
				req.session.lastmain = now;
				req.session.lastmaincount = 0;
			}
			var st = now - req.session.lastmain;
			req.session.lastmain = now;

			if(st <= 3000) req.session.lastmaincount++;
			else if(st >= 8000) req.session.lastmaincount = 0;
			if(req.session.lastmaincount >= 5) {
				var ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
				if (req.session.lastmaincount == 5)
					JLog.warn("IP ["+ip+"] mainpage too frequent!!!", ip);
				ErrorPage.send(req, res, 200);
				return;
			}
		}

		if(req.query.code){ // 네이버 토큰
			req.session.authType = "naver";
			req.session.token = req.query.code;
			res.redirect("/register?before="+(before?before:"/"));
		}else if(req.query.token){ // 페이스북 토큰
			req.session.authType = "facebook";
			req.session.token = req.query.token;
			res.redirect("/register?before="+(before?before:"/"));
		}else{
			DB.session.findOne([ '_id', req.session.id ]).on(function($ses){
				if(global.isPublic){
					onFinish($ses);
				}else{
					if($ses) $ses.profile.sid = $ses._id;
					onFinish($ses);
				}
			});
		}
		function censor(censor) {
			var i = 0;

			return function(key, value) {
				if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value)
					return '[Circular]';

				if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
					return '[Unknown]';

				++i; // so we know we aren't using the original object anymore

				return value;
			}
		}
		function onFinish($doc){
			var id = req.session.id;

			if($doc){
				req.session.profile = $doc.profile;
				id = $doc.profile.sid;
			}else{
				delete req.session.profile;
			}
			page(req, res, Const.MAIN_PORTS[server] ? "kkutu" : "portal", {
				'_page': "kkutu",
				'_id': id,
				'_idconn': idEncrypt(id),
				'PORT': Const.MAIN_PORTS[server],
				'HOST': req.hostname,
				'TEST': req.query.test,
				'MOREMI_PART': Const.MOREMI_PART,
				'AVAIL_EQUIP': Const.AVAIL_EQUIP,
				'CATEGORIES': Const.CATEGORIES,
				'GROUPS': Const.GROUPS,
				'MODE': Const.GAME_TYPE,
				'RULE': Const.RULE,
				'OPTIONS': Const.OPTIONS,
				'KO_INJEONG': Const.KO_INJEONG,
				'EN_INJEONG': Const.EN_INJEONG,
				'KO_THEME': Const.KO_THEME,
				'EN_THEME': Const.EN_THEME,
				'IJP_EXCEPT': Const.IJP_EXCEPT,
				'GLOBAL': GLOBAL,
				'ogImage': "http://kkutu.co.kr/kkutukorea.png",
				'ogURL': "http://kkutu.co.kr/",
				'ogTitle': "끄투코리아 - 끄투 온라인",
				'ogDescription': "끄투 온라인 / 기상천외한 끝말잇기를 웹게임으로! / 끝말잇기,앞말잇기,십자말풀이,쿵쿵따,자음퀴즈,초성퀴즈,십자말풀이,가로세로,타자연습"
			});
		}
	});
	GameWeb.get("/servers", function(req, res){
		var list = [];

		gameServers.forEach(function(v, i){
			list.push(v.seek);
		});
		res.send({ list: list, max: Const.KKUTU_MAX });
	});

	GameWeb.get("/login", function(req, res){
		var before = req.query.before;
		if(global.isPublic){
			page(req, res, "login", { '_id': req.session.id, 'text': req.query.desc, "before":before });
		}else{
			var now = Date.now();
			var id = req.query.id || "ADMIN";
			var lp = {
				id: id,
				title: "LOCAL #" + id,
				birth: [ 4, 16, 0 ],
				_age: { min: 20, max: undefined }
			};
			DB.session.upsert([ '_id', req.session.id ]).set([ 'profile', JSON.stringify(lp) ], [ 'createdAt', now ]).on(function($res){
				DB.users.update([ '_id', id ]).set([ 'lastLogin', now ]).on();
				req.session.admin = true;
				req.session.profile = lp;
				res.redirect("/");
			});
		}
	});
	GameWeb.get("/logout", function(req, res){
		var before = req.query.before;
		if(!req.session.profile){
			return res.redirect(before?before:"/");
		}
		JAuth.logout(req.session.profile).then(function(){
			delete req.session.profile;
			DB.session.remove([ '_id', req.session.id ]).on(function($res){
				res.redirect(before?before:"/");
			});
		});
	});
	GameWeb.get("/register", function(req, res){
		var before = req.query.before;
		var ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		if(!req.session.token) return ErrorPage.send(req, res, 400);

		JAuth.login(req.session.authType, req.session.token, req.session.id, req.session.token2).then(function($profile){
			var now = Date.now();

			if($profile.error) return ErrorPage.send(req, res, $profile.error);
			if(!$profile.id) return ErrorPage.send(req, res, 401);

			$profile.sid = req.session.id;
			req.session.admin = GLOBAL.ADMIN.includes($profile.id);
			DB.users.findOne([ '_id', $profile.id ]).on(function($body){
				if (typeof $body != 'undefined') {
					if (typeof $body.kkutu.nick != 'undefined' && $body.kkutu.nick.length > 0) {
						if (typeof $profile.title != 'undefined') $profile.title = $body.kkutu.nick;
						$profile.name = $body.kkutu.nick;
					} else {
						if (typeof $profile.title != 'undefined') $body.kkutu.nick = $profile.title;
						else $body.kkutu.nick = $profile.name;
						DB.users.update([ '_id', $profile.id ]).set([ 'kkutu', $body.kkutu ]).on();
						JLog.info("User #" + $profile.id + " got initial nick "+$body.kkutu.nick);
					}
					if (typeof $body.kkutu.email == 'undefined' || $body.kkutu.email == 'undefined'){
						$body.kkutu.email = $profile.email;
						DB.users.update([ '_id', $profile.id ]).set([ 'kkutu', $body.kkutu ]).on();
						JLog.info("User #" + $profile.id + " got email "+$body.kkutu.email);
					}
				}
				JLog.log("IP ["+ip+"] User #" + $profile.id + " " + JSON.stringify($profile));
				req.session.profile = $profile;

				DB.users.update([ '_id', $profile.id ]).set([ 'lastLogin', now ]).on();
				DB.session.upsert([ '_id', req.session.id ]).set({
					'profile': $profile,
					'createdAt': now
				}).on();

				res.redirect(before?before:"/");
			});
		});
	});
	GameWeb.post("/login/google", function(req, res){
		req.session.authType = "google";
		req.session.token = req.body.it;
		req.session.token2 = req.body.at;
		ErrorPage.send(req, res, 200);
	});
	GameWeb.post("/login/kakao", function(req, res){
		req.session.authType = "kakao";
		req.session.token = req.body.at;
		req.session.token2 = "";
		ErrorPage.send(req, res, 200);
	});
	GameWeb.get("/login/twitter_token", function(req, res){
		var oauth = {
			consumer_key: JAuth.TWITTER_KEY,
			consumer_secret: JAuth.TWITTER_SECRET,
		};
		Web.post({
			url:   'https://api.twitter.com/oauth/request_token',
			oauth: oauth,
			json:  true
		}, function(e, r, query) {
			var ret = {};
			query.split("&").forEach(function(v) {
				var vv = v.split("=");
				ret[vv[0]] = vv[1];
			});
			if (typeof ret.oauth_token == 'undefined' || typeof ret.oauth_token_secret == 'undefined') {
				ErrorPage.send(req, res, 400); return; }
			res.redirect("https://api.twitter.com/oauth/authenticate?oauth_token="+ret.oauth_token);
		});
	});
	GameWeb.get("/login/twitter", function(req, res) {
		var oauth = {
			consumer_key: JAuth.TWITTER_KEY,
			consumer_secret: JAuth.TWITTER_SECRET,
			token: req.query.oauth_token
		};
		Web.post({
			url:   'https://api.twitter.com/oauth/access_token',
			oauth: oauth,
			json:  true,
			form:  {
				oauth_verifier: req.query.oauth_verifier
			}
		}, function(e, r, query) {
			var ret = {};
			query.split("&").forEach(function(v) {
				var vv = v.split("=");
				ret[vv[0]] = vv[1];
			});
			var oauth2 = {
				consumer_key: JAuth.TWITTER_KEY,
				consumer_secret: JAuth.TWITTER_SECRET,
				token: ret.oauth_token,
				token_secret: ret.oauth_token_secret
			};
			req.session.authType = "twitter";
			req.session.token = ret.oauth_token;
			req.session.token2 = ret.oauth_token_secret;
			res.redirect("/register");
		});
	});
	GameWeb.post("/session", function(req, res){
		var o;

		if(req.session.profile) res.json({
			authType: req.session.authType,
			createdAt: req.session.createdAt,
			profile: {
				id: req.session.profile.id,
				image: req.session.profile.image,
				name: req.session.profile.title || req.session.profile.name,
				sex: req.session.profile.sex
			}
		});
		else ErrorPage.send(req,res,404);
	});
	GameWeb.post("/session/set", function(req, res){
		ErrorPage.send(req, res, 200);
	});
	GameWeb.get("/legal/:page", function(req, res){
		page(req, res, "legal/"+req.params.page);
	});
	GameWeb.use(function(req, res, next) {
		ErrorPage.send(req, res, 404);
	});
	GameWeb.use(function(err, req, res, next) {
		if(err){
			console.log(err);
			ErrorPage.send(req, res, 500);
		}
	});

	module.exports = exports;
};
