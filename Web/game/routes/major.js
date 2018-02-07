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

const charx		= require('../../../sub/util');
const Web		= require("request");
const MainDB	= require("../../../sub/db");
const GLOBAL	= require("../../../sub/global.json");
const JLog		= require("../../../sub/jjlog");
JLog.init("web");
const Const		= require("../../../const");
const LogSystem	= require("../../../sub/LogSystem");

function consume($user, key, value, force){
	let bd = $user.box[key];

	if(bd.value){
		// 기한이 끝날 때까지 box 자체에서 사라지지는 않는다. 기한 만료 여부 확인 시점: 1. 로그인 2. box 조회 3. 게임 결과 반영 직전 4. 해당 항목 사용 직전
		if((bd.value -= value) <= 0){
			if(force || !bd.expire) delete $user.box[key];
		}
	}else{
		if(($user.box[key] -= value) <= 0) delete $user.box[key];
	}
}

function blendWord(word){
	let lang = parseLanguage(word);
	let kl = [], kr = [];

	if(lang == "en") return String.fromCharCode(97 + Math.floor(Math.random() * 26));
	if(lang == "ko"){
		for(let i=word.length-1; i>=0; i--){
			let k = word.charCodeAt(i) - 0xAC00;
			kl.push([ Math.floor(k/28/21), Math.floor(k/28)%21, k%28 ]);
		}
		[0,1,2].sort((a, b) => (Math.random() < 0.5)).forEach((v, i) => {
			kr.push(kl[v][i]);
		});
		return String.fromCharCode(((kr[0] * 21) + kr[1]) * 28 + kr[2] + 0xAC00);
	}
}

function parseLanguage(word){
	return word.match(/[a-zA-Z]/) ? "en" : "ko";
}

function getCFRewards(word, level, blend){
	let R = [];
	let f = {
		len: word.length, // 최대 6
		lev: level // 최대 18
	};
	let cost = 20 * f.lev;
	let wur = f.len / 36; // 최대 2.867

	if(blend){
		if(wur >= 0.5){
			R.push({ key: "$WPA?", value: 1, rate: 1 });
		}else if(wur >= 0.35){
			R.push({ key: "$WPB?", value: 1, rate: 1 });
		}else if(wur >= 0.05){
			R.push({ key: "$WPC?", value: 1, rate: 1 });
		}
		cost = Math.round(cost * 0.2);
	}else{
		R.push({ key: "dictPage", value: Math.round(f.len * 0.6), rate: 1 });
		R.push({ key: "boxB4", value: 1, rate: Math.min(1, f.lev / 7) });
		if(f.lev >= 5){
			R.push({ key: "boxB3", value: 1, rate: Math.min(1, f.lev / 15) });
			cost += 10 * f.lev;
			wur += f.lev / 20;
		}
		if(f.lev >= 10){
			R.push({ key: "boxB2", value: 1, rate: Math.min(1, f.lev / 30) });
			cost += 20 * f.lev;
			wur += f.lev / 10;
		}
		if(wur >= 0.05){
			if(wur > 1) R.push({ key: "$WPC?", value: Math.floor(wur), rate: 1 });
			R.push({ key: "$WPC?", value: 1, rate: wur % 1 });
		}
		if(wur >= 0.35){
			if(wur > 2) R.push({ key: "$WPB?", value: Math.floor(wur / 2), rate: 1 });
			R.push({ key: "$WPB?", value: 1, rate: (wur / 2) % 1 });
		}
		if(wur >= 0.5){
			R.push({ key: "$WPA?", value: 1, rate: wur / 3 });
		}
	}
	return { data: R, cost: cost };
}

exports.run = (Server, page) => {
	//
	// Viewable pages
	//

	// Help page
	Server.get("/help", (req, res) => page(req, res, "help", { 'KO_INJEONG': Const.KO_INJEONG }));

	//
	// Data query
	//

	// Fetch my inventory
	Server.get("/box", (req, res) => {
		if(req.session.profile){
			/*if(Const.ADMIN.indexOf(req.session.profile.id) == -1){
			 return res.send({ error: 555 });
			 }*/
		}else{
			return res.send({ error: 400 });
		}
		MainDB.users.findOne([ '_id', req.session.profile.id ]).limit([ 'box', true ]).on($body => {
			if(!$body){
				res.send({ error: 400 });
			}else{
				res.send($body.box);
			}
		});
	});
	// Fetch ranking
	Server.get("/ranking", (req, res) => {
		let pg = Number(req.query.p);

		// My ranking
		if (req.query.id) {
			MainDB.redis.getSurround(req.query.id, 15).then($body => {
				let ids = $body.data.map(v => { return v.id });
				MainDB.redis_nick.getData(ids, (err, _res) => {
					MainDB.redis_snapshot.getGlobalMulti(ids, prevRank => {
						$body.data = $body.data.map((v, i) => {
							v.nick = _res[i];
							v.diff = prevRank[i] === null || prevRank[i] === undefined ? '*' : (prevRank[i] == v.rank ? '-' : (prevRank[i] - v.rank));
							return v;
						});
						res.send($body);
					});
				});
			});
			return;
		}

		if (isNaN(pg)) pg = 0;
		MainDB.redis.getPage(pg, 15).then($body => {
			let ids = $body.data.map(v => { return v.id });
			MainDB.redis_nick.getData(ids, (err, _res) => {
				MainDB.redis_snapshot.getGlobalMulti(ids, prevRank => {
					$body.data = $body.data.map((v, i) => {
						v.nick = _res[i];
						v.diff = prevRank[i] === null || prevRank[i] === undefined ? '*' : (prevRank[i] == v.rank ? '-' : (prevRank[i] - v.rank));
						return v;
					});
					res.send($body);
				});
			});
		});
	});

	// Fetch shop items
	Server.get("/shop", (req, res) => {
		MainDB.kkutu_shop.find().limit([ 'cost', true ], [ 'hit', true ], [ 'term', true ], [ 'group', true ], [ 'options', true ], [ 'updatedAt', true ])
			.on($goods => res.json({ goods: $goods }));
	});

	// Fetch dictionary item
	Server.get("/dict/:word", (req, res) => {
		let lang	= req.query.lang;
		let DB		= MainDB.kkutu[lang];

		// On DB error
		if(!DB || !DB.findOne) return res.send({ error: 400 });

		DB.findOne([ '_id', req.params.word ]).on($word => {
			// On word error
			if(!$word) return res.send({ error: 404 });

			res.send({
				word: $word._id,
				mean: $word.mean,
				theme: $word.theme,
				type: $word.type
			});
		});
	});


	//
	// User request process
	//

	Server.get("/injeong/:word", (req, res) => {
		if(!req.session.profile) return res.send({ error: 402 });
		let word = req.params.word;
		let theme = req.query.theme;
		let now = Date.now();

		if(now - req.session.injBefore < 2000) return res.send({ error: 429 });
		req.session.injBefore = now;

		MainDB.kkutu['ko'].findOne([ '_id', word.replace(/[^가-힣0-9]/g, "") ]).on($word => {
			if($word) return res.send({ error: 409 });
			MainDB.kkutu_injeong.findOne([ '_id', word ]).on($ij => {
				if($ij){
					if($ij.theme == '~') return res.send({ error: 406 });
					else return res.send({ error: 403 });
				}
				Web.get("https://namu.moe/w/" + encodeURI(word), (err, _res) => {
					if(err) return res.send({ error: 400 });
					else if(_res.statusCode != 200) return res.send({ error: 405 });
					MainDB.kkutu_injeong.insert([ '_id', word ], [ 'theme', theme ], [ 'createdAt', now ], [ 'writer', req.session.profile.id ]).on($res => {
						res.send({ message: "OK" });
					});
				});
			});
		});
	});
	Server.get("/cf/:word", (req, res) => {
		res.send(getCFRewards(req.params.word, Number(req.query.l || 0), req.query.b == "1"));
	});

// POST
	Server.post("/exordial", (req, res) => {
		let text = req.body.data || "";
		let nick = req.body.nick || "";

		if(req.session.profile){
			let now = +new Date();
			text = text.slice(0, 100);
				if (nick.length < 2||nick.length > 15) {
					res.send({error: 400});
					return;
				} else if (nick.length > 0 && !/^[가-힣a-zA-Z0-9_][가-힣a-zA-Z0-9_ ]*[가-힣a-zA-Z0-9_]$/.exec(nick)) {
					res.send({error: 400});
					return;
				} else if (nick.length == 0) {
					res.send({error: 400});
					return;
				}
				//MainDB.users.update([ '_id', req.session.profile.id ]).set([ 'exordial', text ]).on(function($res){
				MainDB.users.findOne(['_id', req.session.profile.id]).on($body => {
					if (typeof $body.nick != 'undefined' && $body.nick != nick && typeof $body.kkutu.nickchangetime != 'undefined' &&
						(now - $body.kkutu.nickchangetime) / 1000 < (86400 * 7))
						res.send({error: 1002});
					else {
						if (typeof $body.nick != 'undefined' && $body.nick != nick ||
							typeof $body.nick == 'undefined') {
							$body.kkutu.nickchangetime = now;
							req.session.profile.nick = nick;
							MainDB.session.update(['_id', req.session.id]).set(['profile', req.session.profile]).on();
							MainDB.users.update(['_id', req.session.profile.id]).set(['exordial', text], ['kkutu',$body.kkutu], ['nick', nick])
								.on($res => res.send({text: text}));
						} else MainDB.users.update(['_id', req.session.profile.id]).set(['exordial', text])
							.on($res => res.send({text: text}));
					}
				});
				/*170406_CharX_NickChangeFeature(e)*/
			} else MainDB.users.update(['_id', req.session.profile.id]).set(['exordial', text]).on($res => {
				res.send({text: text});
			});
		}else res.send({ error: 400 });
	});
	Server.post("/newnick", (req, res) => {
		let nick = req.body.nick || "";

		if(req.session.profile){
			let now = +new Date();

			if (nick.length < 2||nick.length > 15) {
				res.send({error: 400});
				return;
			} else if (nick.length > 0 && !/^[가-힣a-zA-Z0-9][가-힣a-zA-Z0-9 ]*[가-힣a-zA-Z0-9]$/.exec(nick)) {
				res.send({error: 400});
				return;
			} else if (nick.length == 0) {
				res.send({error: 400});
				return;
			}
			MainDB.users.findOne(['_id', req.session.profile.id]).on($body => {
				if($body.nick!="nonick"&&$body.nick) {
					res.send({error: 400});
					return;
				}
				req.session.profile.nick = nick;
				MainDB.session.update(['_id', req.session.id]).set(['profile', req.session.profile]).on();
				$body.kkutu.nickchangetime = now;
				req.session.nick = nick;
				MainDB.users.update(['_id', req.session.profile.id]).set(['kkutu',$body.kkutu], ['nick', nick ]).on($res => res.send());
			});
		}else res.send({ error: 400 });
	});
	Server.post("/buy/:id", (req, res) => {
		if(req.session.profile){
			let uid = req.session.profile.id;
			let gid = req.params.id;

			MainDB.kkutu_shop.findOne([ '_id', gid ]).on($item => {
				if(!$item) return res.json({ error: 400 });
				if($item.cost < 0) return res.json({ error: 400 });
				MainDB.users.findOne([ '_id', uid ]).limit([ 'money', true ], [ 'box', true ]).on($user => {
					if(!$user) return res.json({ error: 400 });
					if(!$user.box) $user.box = {};
					let postM = $user.money - $item.cost;

					if(postM < 0) return res.send({ result: 400 });

					charx.obtain($user, gid, 1, $item.term);
					MainDB.users.update([ '_id', uid ]).set(
						[ 'money', postM ],
						[ 'box', $user.box ]
					).on($fin => {
						res.send({ result: 200, money: postM, box: $user.box });
						JLog.log("[PURCHASED] " + gid + " by " + uid);
						LogSystem.shop("purchase",gid,uid);
					});
					// HIT를 올리는 데에 동시성 문제가 발생한다. 조심하자.
					MainDB.kkutu_shop.update([ '_id', gid ]).set([ 'hit', $item.hit + 1 ]).on();
				});
			});
		}else res.json({ error: 423 });
	});
	Server.post("/equip/:id", (req, res) => {
		if(!req.session.profile) return res.json({ error: 400 });
		let uid = req.session.profile.id;
		let gid = req.params.id;
		let isLeft = req.body.isLeft == "true";
		let now = Date.now() * 0.001;

		MainDB.users.findOne([ '_id', uid ]).limit([ 'box', true ], [ 'equip', true ]).on($user => {
			if(!$user) return res.json({ error: 400 });
			if(!$user.box) $user.box = {};
			if(!$user.equip) $user.equip = {};
			let q = $user.box[gid];

			MainDB.kkutu_shop.findOne([ '_id', gid ]).limit([ 'group', true ]).on($item => {
				if(!$item) return res.json({ error: 430 });
				if(!Const.AVAIL_EQUIP.includes($item.group)) return res.json({ error: 400 });

				// Find out which part it is
				let part = $item.group;
				if(part.substr(0, 3) == "BDG") part = "BDG";
				else if(part == "Mhand") part = isLeft ? "Mlhand" : "Mrhand";

				let qid = $user.equip[part];
				if(qid){
					let r = $user.box[qid];
					charx.obtain($user, qid, 1, r && r.expire ? r.expire : (now + $item.term), true);
				}
				if(qid == $item._id){
					delete $user.equip[part];
				}else{
					if(!q) return res.json({ error: 430 });
					consume($user, gid, 1);
					$user.equip[part] = $item._id;
				}
				MainDB.users.update([ '_id', uid ]).set([ 'box', $user.box ], [ 'equip', $user.equip ]).on($res => {
					res.send({ result: 200, box: $user.box, equip: $user.equip });
				});
			});
		});
	});
	Server.post("/payback/:id", (req, res) => {
		// Only user can sell item
		if(!req.session.profile) return res.json({ error: 400 });

		let uid = req.session.profile.id;
		let gid = req.params.id;
		let isDyn = gid.charAt() == '$';

		MainDB.users.findOne([ '_id', uid ]).limit([ 'money', true ], [ 'box', true ]).on($user => {
			if (!$user) return res.json({ error: 400 });
			if (!$user.box) $user.box = {};
			let q = $user.box[gid];

			if(!q) return res.json({ error: 430 });
			MainDB.kkutu_shop.findOne([ '_id', isDyn ? gid.slice(0, 4) : gid ]).limit([ 'cost', true ]).on($item => {
				if(!$item) return res.json({ error: 430 });

				consume($user, gid, 1, true);
				$user.money = Number($user.money) + Math.round(0.2 * Number($item.cost));
				MainDB.users.update([ '_id', uid ]).set([ 'money', $user.money ], [ 'box', $user.box ]).on($res => {
					res.send({ result: 200, box: $user.box, money: $user.money });
						JLog.log("[PAYBACKED] " + gid + " by " + uid);
						LogSystem.shop("payback",gid,uid);
				});
			});
		});
	});
	Server.post("/cf", (req, res) => {
		if(!req.session.profile) return res.json({ error: 400 });
		let uid = req.session.profile.id;
		let tray = (req.body.tray || "").split('|');

		if(tray.length < 1 || tray.length > 6) return res.json({ error: 400 });
		MainDB.users.findOne([ '_id', uid ]).limit([ 'money', true ], [ 'box', true ]).on($user => {
			if(!$user) return res.json({ error: 400 });
			if(!$user.box) $user.box = {};
			let req = {}, word = "", level = 0;
			let cfr, gain = [];
			let blend;

			for (let i in tray) {
				word += tray[i].slice(4);
				level += 68 - tray[i].charCodeAt(3);
				req[tray[i]] = (req[tray[i]] || 0) + 1;
				if(($user.box[tray[i]] || 0) < req[tray[i]]) return res.json({ error: 434 });
			}
			MainDB.kkutu[parseLanguage(word)].findOne([ '_id', word ]).on($dic => {
				if(!$dic){
					if(word.length == 3){
						blend = true;
					}else return res.json({ error: 404 });
				}
				cfr = getCFRewards(word, level, blend);
				if($user.money < cfr.cost) return res.json({ error: 407 });
				for (let i in req) consume($user, i, req[i]);
				for (let i in cfr.data) {
					let o = cfr.data[i];

					if(Math.random() >= o.rate) continue;
					if(o.key.charAt(4) == "?"){
						o.key = o.key.slice(0, 4) + (blend ? blendWord(word) : word.charAt(Math.floor(Math.random() * word.length)));
					}
					charx.obtain($user, o.key, o.value, o.term);
					gain.push(o);
				}
				$user.money -= cfr.cost;
				MainDB.users.update([ '_id', uid ]).set([ 'money', $user.money ], [ 'box', $user.box ]).on($res => {
					res.send({ result: 200, box: $user.box, money: $user.money, gain: gain });
				});
			});
		});
		// res.send(getCFRewards(req.params.word, Number(req.query.l || 0)));
	});
};
