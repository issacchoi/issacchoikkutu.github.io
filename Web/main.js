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