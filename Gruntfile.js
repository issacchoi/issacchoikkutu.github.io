const LICENSE1 = "Copyright (C) 2017 Climax all rights reserved.";
const LICENSE2 = [
	"Rule the words! KKuTu Online",
	"Copyright (C) 2017 JJoriping(op@jjo.kr)",
	"",
	"This program is free software: you can redistribute it and/or modify",
	"it under the terms of the GNU General Public License as published by",
	"the Free Software Foundation, either version 3 of the License, or",
	"(at your option) any later version.",
	"",
	"This program is distributed in the hope that it will be useful,",
	"but WITHOUT ANY WARRANTY; without even the implied warranty of",
	"MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the",
	"GNU General Public License for more details.",
	"",
	"You should have received a copy of the GNU General Public License",
	"along with this program. If not, see <http://www.gnu.org/licenses/>."
].join('\n');

var fs = require('fs');

const game_LIST = [
	"global",

	"in_login",
	"in_game_kkutu",
	"in_game_kkutu_help",
	"in_portal",
	"in_portal_old",
	"in_admin"
];
const site_LIST = [
	"main"
];
const KKUTU_LIST = [
	"Web/game/lib/kkutu/local.js",
	"Web/game/lib/kkutu/head.js",
	"Web/game/lib/kkutu/ready.js",
	"Web/game/lib/kkutu/rule_classic.js",
	"Web/game/lib/kkutu/rule_jaqwi.js",
	"Web/game/lib/kkutu/rule_crossword.js",
	"Web/game/lib/kkutu/rule_typing.js",
	"Web/game/lib/kkutu/rule_hunmin.js",
	"Web/game/lib/kkutu/rule_daneo.js",
	"Web/game/lib/kkutu/rule_sock.js",
	"Web/game/lib/kkutu/rule_picturequiz.js",
	"Web/game/lib/kkutu/body.js",
	"Web/game/lib/kkutu/tail.js"
];

module.exports = function(grunt){
	var i, files = {}, cons = {};
	var KKUTU = "Web/game/public/js/in_game_kkutu.min.js";

	for(i in game_LIST){
		files["Web/game/public/js/"+game_LIST[i]+".min.js"] = "Web/game/lib/"+game_LIST[i]+".js";
	}
	for(i in site_LIST){
		files["Web/site/public/js/"+site_LIST[i]+".min.js"] = "Web/site/lib/"+site_LIST[i]+".js";
	}
	files["Web/game/public/js/in_kkutu.min.js"] = "Web/game/lib/in_kkutu.js";
	files[KKUTU] = "Web/game/lib/in_game_kkutu.js";

	grunt.initConfig({
		concat: {
			basic: {
				src: KKUTU_LIST,
				dest: "Web/game/lib/in_game_kkutu.js"
			}
		},
		uglify: {
			options: {
				banner: "/**\n" + LICENSE1+"\n\n"+LICENSE2 + "\n*/\n\n"
			},
			build: {
				files: files
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['concat', 'uglify','pack']);
	grunt.registerTask('pack', 'Log', function(){
		var url = __dirname + "/" + KKUTU;
		var value = fs.readFileSync(url, 'utf8');
		fs.writeFileSync(url, "(function(){" + value + "})();", 'utf8');
	});
};
