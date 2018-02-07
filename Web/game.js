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

module.exports = function(GameWeb, Parser, GLOBAL, REDIS_SESSION){
	var WS		 = require("ws");
	var Web		 = require("request");
	var DDDoS	 = require("./dddos/index");
	var DB		 = require("../sub/db");
	var JLog	 = require("../sub/jjlog");
	JLog.init("game");
	var WebInit	 = require("../sub/webinit");
	var Const	 = require("../const");
	var Cache    = require("express-static-cache");
	var Path     = require('path');
	/*170420_CharX_EnhancedAuth(s)*/
	var crypto   = require('crypto');
	/*170420_CharX_EnhancedAuth(e)*/
	/*170510_CharX_Config(s)*/
	/*170510_CharX_Config(e)*/
	var Express = require('express');

	var Compression = require('compression');

	var ErrorPage = require("./errorpage");
	ErrorPage.init(GameWeb);

	var passport = require('passport');
	var https	 = require('https');
	var fs		 = require('fs');

	var Language = {
		'ko_KR': require("./lang/ko_KR.json"),
		'en_US': require("./lang/en_US.json")
	};
	var ROUTES = [
		"major", "consume", "admin", "login", "word"
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
	GameWeb.use(Compression());
	GameWeb.set('views', __dirname + "/game/views");
	GameWeb.set('view engine', "pug");
	GameWeb.use(function(req, res, next) {
		var tmpPROTOCOL = Const.IS_SECURED?"https:":"http:"
		var allowedOrigins = [tmpPROTOCOL+GLOBAL.MAIN_DOMAIN, tmpPROTOCOL+GLOBAL.CDN_DOMAIN];
		var origin = req.headers.origin;
		if(allowedOrigins.indexOf(origin) > -1){
			 res.setHeader('Access-Control-Allow-Origin', origin);
		}
		//res.header('Access-Control-Allow-Origin', allowedOrigins);
		res.header("Access-Control-Allow-Headers", '*');
		res.header('Access-Control-Allow-Methods', '*');
		next();
	});
		GameWeb.use(Express.static(__dirname + "/game/public"));
	GameWeb.use(Parser.json());
	GameWeb.use(Parser.urlencoded({ extended: true, limit:'50mb' }));
	GameWeb.use((req, res, next) => {
		if(Const.IS_SECURED) {
			if(req.protocol == 'http') {
				let url = 'https://'+req.get('host')+req.path;
				res.status(307).redirect(url);
			} else {
				next();
			}
		} else {
			next();
		}
	});
	GameWeb.use(REDIS_SESSION);
	GameWeb.use(passport.initialize());
	GameWeb.use(passport.session());
	GameWeb.use((req, res, next) => {
		if(req.session.passport) {
			delete req.session.passport;
		}
		next();
	});
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

		var protocol;
		if(Const.IS_SECURED) {
			protocol = 'wss';
		} else {
			protocol = 'ws';
		}
		gameServers[i] = new GameClient(KEY, `${protocol}://127.0.0.2:${v}/${KEY}`);
	});
	function GameClient(id, url){
		var my = this;

		my.id = id;
		my.socket = new WS(url, { perMessageDeflate: false, rejectUnauthorized: false});

		my.send = function(type, data){
			if(!data) data = {};
			if(typeof my.socket == 'undefined')
				my.socket = new WS(url, { perMessageDeflate: false, rejectUnauthorized: false});
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

		DB.session.findOne([ '_id', req.session.id ]).on(function($ses){
			// var sid = (($ses || {}).profile || {}).sid || "NULL";
			if(global.isPublic){
				onFinish($ses);
				// DB.jjo_session.findOne([ '_id', sid ]).limit([ 'profile', true ]).on(onFinish);
			}else{
				if($ses) $ses.profile.sid = $ses._id;
				onFinish($ses);
			}
		});
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
				'PORT': Const.MAIN_PORTS[server],
				'HOST': req.hostname,
				'PROTOCOL': Const.IS_SECURED ? 'wss' : 'ws',
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

		DB.session.findOne([ '_id', req.session.id ]).on(function($ses){
			// var sid = (($ses || {}).profile || {}).sid || "NULL";
				onFinish($ses);
				// DB.jjo_session.findOne([ '_id', sid ]).limit([ 'profile', true ]).on(onFinish);
				if($ses) $ses.profile.sid = $ses._id;
				onFinish($ses);
			}
		});
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
				'PROTOCOL': Const.IS_SECURED ? 'wss' : 'ws',
				'MOREMI_PART': Const.MOREMI_PART,
				'AVAIL_EQUIP': Const.AVAIL_EQUIP,
				'CATEGORIES': Const.CATEGORIES,
				'BGMCATEGORIES' : Const.BGMCATEGORIES,
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
				'ogTitle': "끄투",
				'ogDescription': "끄투는 역시 끄투코리아에서 해야지! / 글자로 놀자! 끄투 온라인 / 기상천외한 끝말잇기를 웹게임으로! / 끝말잇기,앞말잇기,십자말풀이,쿵쿵따,자음퀴즈,초성퀴즈,십자말풀이,가로세로,타자연습,kkutu"
			});
		}
	});
	GameWeb.get("/servers", function(req, res){
		var list = [];

		gameServers.forEach(function(v, i){
			/* if(v!=undefined&&v!=null&&v.seek!=undefined&&v.seek!=null)*/ list.push(v.seek);
		});
		res.send({ list: list, max: Const.KKUTU_MAX });
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
