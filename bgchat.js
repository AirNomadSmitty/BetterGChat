/* ================UTILS================*/

function makeRequest(method, url, callback, data) {
    var req = new XMLHttpRequest();
    req.open(method, url, true);
    req.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
            if (this.status >= 200 && this.status < 300) {
                if (callback) {
                    var response = JSON.parse(this.responseText);
                    callback(response);
                }
            }
        }
    };
    req.send(JSON.stringify(data));
};

/* ============ constants========*/

	const BTTV = 'bttv';
	const FRANKERZ = 'frankerz';
	const TWITCH = 'twitch';

	const channels = [
		{
			name:'xchocobars',
			id: 42583390
		},
		{
			name:'pokimane',
			id: 44445592
		},
		{
			name:'disguisedtoast',
			id:87204022
		},
		{
			name:'drdisrespect',
			id:17337557
		},
		{
			name:'loserfruit',
			id:41245072
		}
	];

/**================APP=================*/


function init() {
	let emotes = generateEmoteList();
	startObserver(emotes);
}

function generateEmoteList() {
	let emotes = new Map();
	// Get Base
	fetchEmotesForURL(emotes, 'https://api.betterttv.net/2/emotes');

	channels.forEach(function (channelInfo) {
		fetchEmotesForURL(emotes, 'https://api.betterttv.net/2/channels/'+channelInfo.name, BTTV);
		fetchEmotesForURL(emotes, 'https://api.betterttv.net/2/frankerfacez_emotes/channels/'+channelInfo.id, FRANKERZ);
		// fetchEmotesForURL(emotes, 'https://api.twitchemotes.com/api/v4/channels/'+channelInfo.id, TWITCH);
	})

	return emotes
}

function fetchEmotesForURL(emotes, url, type ) {
	makeRequest('get', url, function(response) {
		if( !response.hasOwnProperty('emotes') ) {
			console.error('No emotes found at: '+url);
			return;
		}
		let emoteList = response.emotes;
		emoteList.forEach( function(e) {
			switch (type){
				case BTTV:
					emotes.set(e.code.toLowerCase(), "https://cdn.betterttv.net/emote/"+e.id+"/1x");
					break;
				case FRANKERZ:
					emotes.set(e.code.toLowerCase(), "https://cdn.betterttv.net/frankerfacez_emote/"+e.id+"/1");
					break;
				case TWITCH:
					emotes.set(e.code.toLowerCase(), 'https://static-cdn.jtvnw.net/emoticons/v1/'+e.id+'/1.0')
			}
		});
	})
}

function kappifyComment(commentNode, emotes) {
	var commentText = commentNode.data;
	let words = commentText.split(" ");
	let commentHTML = commentText;
	let changed = false;

	words.forEach( function( word ) {
		if(emotes.has(word.toLowerCase())) {
			changed = true;
			commentHTML = commentHTML.replace(word, "<img title='"+word+"' src='"+emotes.get(word.toLowerCase())+"'>");
		}
	});

	if(changed) {
		commentNode.parentNode.innerHTML = commentHTML;
	}
}

function startObserver(emotes) {
	var config = { childList: true, subtree: true };

	var callback = function(mutationsList, observer) {
		for(var mutation of mutationsList) {
			if( mutation.addedNodes.length === 1 && mutation.addedNodes[0].nodeName == "#text") {
				kappifyComment(mutation.addedNodes[0], emotes);
			}
		}
	} 

	var observer = new MutationObserver(callback);

	observer.observe(document, config);
} 

init();