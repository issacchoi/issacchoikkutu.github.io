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

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;
var ROOM;

exports.init = function(_DB, _DIC, _ROOM){
	DB = _DB;
	DIC = _DIC;
	ROOM = _ROOM;
};
exports.getTitle = function(){
	var R = new Lizard.Tail();
	var my = this;

	my.game.done = [];
	setTimeout(function(){
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};
exports.roundReady = function(){
	var my = this;
	var ijl = my.opts.injpick.length;
	switch(my.pq.order){
		case "correct":
			if(!my.game.turn)my.game.turn=0;
			if(my.game.winner&&my.game.winner.length>0){
				var winner = my.game.seq.indexOf(my.game.winner[0]);
				my.game.turn = winner==-1 ? my.game.turn : winner;
			}
			else
				my.game.turn = 0;
		break;
		case "order":
			if(!my.game.turn)my.game.turn=0;
			if(my.game.round!=0) my.game.turn++;
			if(my.game.seq.length<=my.game.turn) my.game.turn=0;
		break;
		case "random":
			my.game.turn = Math.floor((Math.random() * my.game.seq.length));
		break;
	}

	clearTimeout(my.game.qTimer);
	my.game.themeBonus = 0.3 * Math.log(0.6 * ijl + 1);
	my.game.winner = [];
	my.game.giveup = [];
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	if(my.game.round <= my.round){
		my.game.theme = my.opts.injpick[Math.floor(Math.random() * ijl)];
		getAnswer.call(my, my.game.theme, my.pq.wordlength).then(function($ans){
			if(!my.game.done) return;
			if(!$ans || !$ans._id){
				getAnswer.call(my, my.game.theme, "random").then(function($ans){
					if(!my.game.done) return;

					// $ans가 null이면 골치아프다...
					my.game.late = false;
					my.game.answer = $ans || {};
					my.game.done.push($ans._id);
					my.byMaster('roundReady', {
						round: my.game.round,
						theme: my.game.theme,
						turn: my.game.turn,
						length: my.game.answer._id.length
					}, true);
					setTimeout(my.turnStart, 2400);
				});
			} else {
				my.game.late = false;
				my.game.answer = $ans || {};
				my.game.done.push($ans._id);
				my.byMaster('roundReady', {
					round: my.game.round,
					theme: my.game.theme,
					turn: my.game.turn,
					length: my.game.answer._id.length
				}, true);
				setTimeout(my.turnStart, 2400);
			}
		});
	}else{
		my.roundEnd();
	}
};
exports.turnStart = function(){
	var my = this;
	var i;

	if(!my.game.answer) return;

	my.game.roundAt = (new Date()).getTime();
	my.game.meaned = 0;
	my.game.primary = 0;
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.game.turning = true;
	var text = "";
	for(var i=0;i<my.game.answer._id.length;i++)
		text += "○";
	my.byMaster('turnStart',
	{
	 ID:my.game.seq[my.game.turn],
	 ME:{
		char: my.game.answer._id,
		roundTime: my.game.roundTime
	 },
	 OTHER:{
 		char: text,
 		roundTime: my.game.roundTime
	}}, true, true);
};
exports.turnEnd = function(){
	var my = this;

	if(my.game.answer){
		my.game.late = true;
		my.byMaster('turnEnd', {
			answer: my.game.answer ? my.game.answer._id : ""
		});
		my.game.turning = false;
	}
	my.game._rrt = setTimeout(my.roundReady, 2500);
};
exports.submit = function(client, text){
	var my = this;
	var score, t, i;
	var $ans = my.game.answer;
	var now = (new Date()).getTime();
	var play = (my.game.seq ? my.game.seq.includes(client.id) : false) || client.robot;
	var gu = my.game.giveup ? my.game.giveup.includes(client.id) : true;

	if(!my.game.winner) return;
	if(my.game.winner.indexOf(client.id) == -1
		&& text == $ans._id
		&& play && !gu
		&& client.id != my.game.seq[my.game.turn]
		&& my.game.turning
	){
		t = now - my.game.roundAt;
		if(my.game.primary == 0) if(my.game.roundTime - t > 10000){ // 가장 먼저 맞힌 시점에서 10초 이내에 맞히면 점수 약간 획득
			clearTimeout(my.game.qTimer);
			my.game.qTimer = setTimeout(my.turnEnd, 10000);
			for(i in my.game.robots){
				if(my.game.roundTime > my.game.robots[i]._delay){
					clearTimeout(my.game.robots[i]._timer);
					if(client != my.game.robots[i]) if(Math.random() < ROBOT_CATCH_RATE[my.game.robots[i].level])
						my.game.robots[i]._timer = setTimeout(my.turnRobot, ROBOT_TYPE_COEF[my.game.robots[i].level], my.game.robots[i], text);
				}
			}
		}
		score = my.getScore(text, t);
		my.game.primary++;
		my.game.winner.push(client.id);
		if(my.game.winner.length == 1) DIC[my.game.seq[my.game.turn]].game.score += Math.floor(score*.75);
		client.game.score += score;
		client.publish('turnEnd', {
			target: client.id,
			ok: true,
			value: text,
			score: score,
			bonus: 0
		}, true);
		client.invokeWordPiece(text, 0.9);
	}else if(play && !gu && (text == "gg" || text == "ㅈㅈ")){
		my.game.giveup.push(client.id);
		client.publish('turnEnd', {
			target: client.id,
			giveup: true
		}, true);
	}else{
		client.chat(text);
	}
	if(play&&my.game.turning) if(my.game.primary + my.game.giveup.length >= my.game.seq.length - 1){
		clearTimeout(my.game.qTimer);
		my.turnEnd();
	}
};
exports.getScore = function(text, delay){
	var my = this;
	var rank = my.game.hum - my.game.primary + 3;
	var tr = 1 - delay / my.game.roundTime;
	var score = 6 * Math.pow(rank, 1.4) * ( 0.5 + 0.5 * tr );

	return Math.round(score * my.game.themeBonus);
};
function getAnswer(theme, wordlength){
	var my = this;
	var R = new Lizard.Tail();
	var args = [ [ '_id', { $nin: my.game.done } ] ];
	switch(wordlength){
		case "short":
			args.push([ 'LENGTH(_id)', { $gtee: 1 } ]);
			args.push([ 'LENGTH(_id)', { $ltee: 3 } ]);
			break;
		case "normal":
			args.push([ 'LENGTH(_id)', { $gtee: 3 } ]);
			args.push([ 'LENGTH(_id)', { $ltee: 6 } ]);
			break;
		case "long":
			args.push([ 'LENGTH(_id)', { $gtee: 6 } ]);
			args.push([ 'LENGTH(_id)', { $ltee: 10 } ]);
			break;
		case "random":
			args.push([ 'LENGTH(_id)', { $gtee: 1 } ]);
			args.push([ 'LENGTH(_id)', { $ltee: 10 } ]);
			break;
	}

	args.push([ 'theme', new RegExp("(,|^)(" + theme + ")(,|$)") ]);
	args.push([ 'type', Const.KOR_GROUP ]);
	args.push([ 'flag', { $lte: 7 } ]);
	DB.kkutu['ko'].find.apply(my, args).on(function($res){
		if(!$res) return R.go(null);
		var pick;
		var len = $res.length;

		if(!len) return R.go(null);
		do{
			pick = Math.floor(Math.random() * len);
			if($res[pick].type == "INJEONG" || $res[pick].mean.length >= 0)
				return R.go($res[pick]);
			$res.splice(pick, 1);
			len--;
		}while(len > 0);
		R.go(null);
	});
	return R;
}
