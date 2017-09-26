const CLUSTER = require('cluster');

var Const = require('../const');
var JLog = require('../sub/jjlog');
JLog.init("gamecluster");
var SID = Number(process.argv[2]);
var CPU = Number(process.argv[3]); //require("os").cpus().length;

if(isNaN(SID)){
	if(process.argv[2] == "test"){
		global.test = true;
		CPU = 1;
	}else{
		console.log(`Invalid Server ID ${process.argv[2]}`);
		process.exit(1);
	}
}
if(isNaN(CPU)){
	console.log(`Invalid CPU Number ${process.argv[3]}`);
	process.exit(1);
}
if(CLUSTER.isMaster){
	var channels = {}, chan;
	var i;

	for(i=0; i<CPU; i++){
		chan = i + 1;
		channels[chan] = CLUSTER.fork({ SERVER_NO_FORK: true, KKUTU_PORT: Const.MAIN_PORTS[SID] + 416 + i, CHANNEL: chan, SID: SID });
	}
	CLUSTER.on('exit', function(w){
		for(i in channels){
			if(channels[i] == w){
				chan = Number(i);
				break;
			}
		}
		JLog.error(`Worker @${chan} ${w.process.pid} died`);
		channels[chan] = CLUSTER.fork({ SERVER_NO_FORK: true, KKUTU_PORT: Const.MAIN_PORTS[SID] + 416 + (chan - 1), CHANNEL: chan, SID: SID });
	});
	process.env['KKUTU_PORT'] = Const.MAIN_PORTS[SID];
	require("./master.js").init(SID.toString(), channels);
}else{
	require("./slave.js");
}
