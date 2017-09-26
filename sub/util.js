let Lizard	= require("./lizard.js");

const MAX_LEVEL = 450;
let EXP = [];
function getRequiredScore(lv){
	return Math.round(
		(!(lv%5)*0.3 + 1) * (!(lv%15)*0.4 + 1) * (!(lv%45)*0.5 + 1) * (
			120 + Math.floor(lv/5)*60 + Math.floor(lv*lv/225)*120 + Math.floor(lv*lv/2025)*180
		)
	);
}
EXP.push(getRequiredScore(1));
for(let i=2; i<MAX_LEVEL; i++)
	EXP.push(EXP[i-2] + getRequiredScore(i));
EXP[MAX_LEVEL - 1] = Infinity;
EXP.push(Infinity);

exports.getLevel = _score => {
	let score = typeof _score == 'object' ? _score.data.score : _score;
	let l = EXP.length, level = 1;
	for ( ; level<=l ; level++) if (score < EXP[level-1]) break;
	return level;
};

exports.getScore = _level => EXP[_level - 1];

exports.obtain = ($user, key, value, term, addValue) => {
	var now = Math.round(Date.now() * 0.001);

	if(term){
		if($user.box[key]){
			if(addValue) $user.box[key].value += value;
			else $user.box[key].expire += term;
		}else $user.box[key] = { value: value, expire: addValue ? term : (now + term) };
	}else{
		$user.box[key] = ($user.box[key] || 0) + value;
	}
};

exports.randInt = (min, max) => {
	return Math.floor(Math.random()*(max-min+1)+min);
}

exports.ready = function() {
	let preInit = [];
	let data = null;
	let ok = false;

	var baz = function() {
		let r = new Lizard.Tail();
		if (!ok) preInit.push(r);
		else r.go(data);
		return r
	};
	baz.ok = d => {
		ok = true;
		data = d;
		preInit.forEach(v => v.go(d))
	};

	return baz;
};
