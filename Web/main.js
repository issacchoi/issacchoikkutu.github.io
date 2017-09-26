var vhost = require('vhost');
var express = require('express');

var GameWeb = express();

var Exession = require("express-session");
var Redission= require("connect-redis")(Exession);
var Redis	 = require("redis");
var Parser	 = require("body-parser");
var GLOBAL	 = require("../sub/global.json");
var REDIS_SESSION = Exession({
	key: '<KEY>',
	store: new Redission({
		client: Redis.createClient(),
		ttl: 3600 * 12
	}),
	secret: '<SECRET>',
	resave: false,
	saveUninitialized: true,
	cookie: {
		path: '/',
		domain:".kkutu.co.kr",
		maxAge: 1000 * 60 * 60 * 24
	}
});

require("./game")(GameWeb, Parser, GLOBAL, REDIS_SESSION);

var app = express();

app.use(vhost('kkutu.co.kr', GameWeb));

var router = express.Router();

router.get('/', function(req, res, next) {
	res.send('올바르지 않은 접근입니다!<br><br><a href="http://kkutu.co.kr">끄투코리아로 이동하기</a>');
});
app.use(router);
app.listen(GLOBAL.WEB_PORT);