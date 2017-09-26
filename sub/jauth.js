const NAVER_ID = "<NAVER ID>";
const NAVER_SECRET = "<NAVER SECRET>";
const GOOGLE_ID = "<GOOGLE ID>";
const GOOGLE_API = "<GOOGLE API>";
const GOOGLE_SECRET = "<GOOGLE SECRET>";
exports.TWITTER_KEY = "<TWITTER KEY>";
exports.TWITTER_SECRET = "<TWITTER SECRET>";

var Web		 = require("request");
var Lizard	 = require("../sub/lizard");
var JLog	 = require("../sub/jjlog");
JLog.init("jauth");
exports.login = function(type, token, sid, token2){
	var R = new Lizard.Tail();
	var now = new Date();
	var MONTH = now.getMonth() + 1, DATE = now.getDate();
	var $p = {};

	if(type == "naver"){
		Web.post("https://nid.naver.com/oauth2.0/token", { form: {
			grant_type: "authorization_code",
			client_id: NAVER_ID,
			client_secret: NAVER_SECRET,
			code: token,
			state: sid
		} }, function(err, res, doc){
			if(err){
				JLog.warn("Error on oAuth-naver: "+err.toString());
				R.go({ error: 500 });
			}else{
				try{ doc = JSON.parse(doc); }catch(e){ return R.go({ error: 500 }); }

				$p.token = doc.access_token;
				Web.post({
					url: "https://openapi.naver.com/v1/nid/me",
					headers: { 'Authorization': "Bearer " + $p.token }
				}, function(err, res, doc){
					if(err) return R.go({ error: 400 });
					if(!doc) return R.go({ error: 500 });
					try{ doc = JSON.parse(doc); }catch(e){ return R.go({ error: 500 }); }

					if(doc.resultcode == "00"){
						$p.type = "naver";
						$p.id = doc.response.id;
						$p.name = doc.response.name;
						$p.title = doc.response.nickname;
						$p.image = doc.response.profile_image;
						$p.email = doc.response.email;
						R.go($p);
					}else{
						R.go({ error: 401 });
					}
				});
			}
		});
	}else if(type == "facebook"){
		$p.token = token;
		Web.get({
			url: "https://graph.facebook.com/v2.4/me",
			qs: {
				access_token: $p.token,
				fields: "id,name,email"
			}
		}, function(err, res, doc){
			if(err){
				JLog.warn("Error on oAuth-facebook: "+err.toString());
				R.go({ error: 500 });
			}else{
				try{ doc = JSON.parse(doc); }catch(e){ return R.go({ error: 500 }); }

				$p.type = "facebook";
				$p.id = doc.id;
				$p.name = doc.name;
				$p.image = "https://graph.facebook.com/"+doc.id+"/picture?width=20&height=20";
				$p.email = doc.email;
				R.go($p);
			}
		});
	}else if(type == "google"){
		$p.token = token;
		Web.get({
			url: "https://www.googleapis.com/oauth2/v3/tokeninfo",
			qs: {
				id_token: token
			}
		}, function(err, res, doc){
			if(err){
				JLog.warn("Error on oAuth-google: "+err.toString());
				R.go({ error: 500 });
			}else{
				try{ doc = JSON.parse(doc); }catch(e){ return R.go({ error: 500 }); }
				if(doc.aud != GOOGLE_ID) return R.go({ error: 401 });
				if(!doc.email_verified) return R.go({ error: 402 });

						$p.type = "google";
						$p.id = doc.sub;
						$p.name = doc.name;
						$p.image = doc.picture+"?sz=20";
						$p.email = doc.email;
						R.go($p);
			}
		});
	}
    else if(type == "kakao"){
        $p.token = token;
        Web.get({
            url: "https://kapi.kakao.com/v1/user/me",
            headers: {
                "Authorization":"Bearer "+$p.token
            },
        }, function(err, res, doc){
            if(err){
                JLog.warn("Error on REST kakao: "+err.toString());
                R.go({ error: 500 });
            }else{
                try{ doc = JSON.parse(doc); }catch(e){ return R.go({ error: 500 }); }
                if (typeof doc.id === 'undefined')
                    return R.go({ error: 500 });
                $p.type = "kakao";
                $p.id = String(doc.id);
								$p.email = doc.kaccount_email;
				if (typeof doc.properties.nickname == 'undefined') {
					JLog.warn("Undefined nickname in Kakao, data ["+JSON.stringify(doc.properties)+"]");
					$p.name = "Noname"+Math.round(Math.random()*10000);
				} else
					$p.name = doc.properties.nickname;
                $p.image = doc.properties.profile_image;

                R.go($p);
            }
        });
    }
    else if(type == "twitter"){
        $p.token = token;
        var oauth2 = {
            consumer_key: exports.TWITTER_KEY,
            consumer_secret: exports.TWITTER_SECRET,
            token: token,
            token_secret: token2
        };
        Web.get({
            url:  'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
            oauth: oauth2,
            json:  true
        }, function(err, res, doc){
            if(err){
                JLog.warn("Error on REST twitter: "+err.toString());
                R.go({ error: 500 });
            }else{
                if (typeof doc.id_str === 'undefined')
                    return R.go({ error: 500 });
                $p.type = "twitter";
                $p.id = doc.id_str;
                $p.name = doc.name;
                $p.image = doc.profile_image_url;
								$p.email = doc.email;

                R.go($p);
            }
        });
    }
    return R;
};
exports.logout = function($p){
	var R = new Lizard.Tail();

	if($p.type == "naver"){
		Web.post("https://nid.naver.com/oauth2.0/token", { form: {
			grant_type: "delete",
			client_id: NAVER_ID,
			client_secret: NAVER_SECRET,
			code: $p.token,
			service_provider: "NAVER"
		} }, function(err, res, doc){
			R.go(doc);
		});
	}else if($p.type == "facebook"){
		R.go(true);
	}else if($p.type == "google"){
		R.go(true);
	}
    else if($p.type == "kakao"){
        R.go(true);
    }
    else if($p.type == "twitter"){
        R.go(true);
    }
	return R;
};
