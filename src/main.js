"use strict";

import api from "./modules/api.js";


const BTTV = 'bttv';
const FRANKERZ = 'frankerz';
const TWITCH = 'twitch';

function generateEmoteList(channels, twitchClientId) {
	let emotes = new Map();
	// Get Base
	fetchEmotesForURL(emotes, 'https://api.betterttv.net/2/emotes', BTTV);
	getGlobalTwitchEmotes(emotes, twitchClientId);

	channels.forEach(function (name) {
		fetchEmotesForURL(emotes, 'https://api.betterttv.net/2/channels/'+name, BTTV);
		fetchEmotesForURL(emotes, 'https://api.frankerfacez.com/v1/room/'+name, FRANKERZ);
		if( twitchClientId ) {
			fetchEmotesForURL(emotes, 'https://api.twitch.tv/api/channels/'+name+'/product?client_id='+twitchClientId, TWITCH);
		}
	});

	return emotes
}

function getGlobalTwitchEmotes(emotes, twitchClientId) {
	if( !twitchClientId ) {
		return;
	}
	let url = "https://api.twitch.tv/kraken/chat/emoticon_images?emotesets=0&client_id="+twitchClientId;
	api.get(url, function(response) {
		if(response.hasOwnProperty("emoticon_sets") ) {
			response.emoticon_sets[0].forEach( function(e) {
				emotes.set(e.code.toLowerCase(), 'https://static-cdn.jtvnw.net/emoticons/v1/'+e.id+'/1.0');
			});
		}
	});
}

function fetchEmotesForURL(emotes, url, type ) {
	chrome.storage.local.get(['apiCache'], function(data) {
		if(!(typeof data.apiCache === 'undefined') ) {
			// If cache exists, url is found, AND it's recent enough
			if(data.apiCache.hasOwnProperty(url) && data.apiCache[url].time > Date.now() - 3600*1000) {
				handleEmoteApiResponse(emotes, data.apiCache[url].data, type, url);
				return;
			}
		// If cache isn't set, initialize it
		} else {
			data.apiCache = {};
		}
		api.get( url, function(response) {
			handleEmoteApiResponse(emotes, response, type, url);
			let cache = data.apiCache;
			cache[url] = {
				"data": response,
				"time": Date.now()
			};
			chrome.storage.local.set({'apiCache': cache});
		});
	});
}

function handleEmoteApiResponse(emotes, response, type, url) {
	switch (type){
		case BTTV:
			if( !response.hasOwnProperty('emotes') ) {
				console.log('No emotes found at: '+url);
			} else {
				response.emotes.forEach( function(e) {
					emotes.set(e.code.toLowerCase(), "https://cdn.betterttv.net/emote/"+e.id+"/1x");
				});	
			}
			break;
		case FRANKERZ:
			if( !response.hasOwnProperty('sets') || !response.hasOwnProperty('room') ) {
				console.log('No emotes found at: '+url);
			} else {
				response.sets[response.room.set].emoticons.forEach( function(e) {
					emotes.set(e.name.toLowerCase(), "https:"+e.urls[1]);
				});	
			}
			break;
		case TWITCH:
			if( !response.hasOwnProperty('emoticons') ) {
				console.log('No emotes found at: '+url);
			} else {
				response.emoticons.forEach( function(e) {
					emotes.set(e.regex.toLowerCase(), e.url);
				});	
			}
			break;
		default:
			console.error('Unknown emote request type');
			return;
	}
}

function kappifyComment(commentNode, emotes) {
	let commentText = commentNode.data;
	let words = [...new Set(commentText.split(" "))];
	let commentHTML = commentText;
	let changed = false;
	let regex;


	words.forEach( function( word ) {
		word = word.trim();
		if(emotes.has(word.toLowerCase())) {
			changed = true;
			regex = new RegExp("(^|\\s+)("+word+")(?=$|\\s+)", "g");
			commentHTML = commentHTML.replace(regex, "$1<img title='"+word+"' src ='"+emotes.get(word.toLowerCase())+"'>");
		}
	});

	if(changed) {
		commentNode.parentNode.innerHTML = commentHTML;
	}
}

function startObserver(emotes) {
	let observerConf = { childList: true, subtree: true};

	let callback = function(mutationsList) {
		for(var mutation of mutationsList) {
			if( mutation.addedNodes.length === 1 && mutation.addedNodes[0].nodeName == "#text") {
				kappifyComment(mutation.addedNodes[0], emotes);
			}
		}
	} 

	let observer = new MutationObserver(callback);

	// document.querySelectorAll("div .zhxlYb")
	// document.querySelectorAll("div .fkp8p")
	observer.observe(document, observerConf);
} 


export function main() {
	// TODO: cache these with local storage?
	// Probably cache by channel or url
	chrome.storage.local.get(['twitchClientId', 'channels'], function(data) {
		if(data.channels) {
			let emotes = generateEmoteList(data.channels, data.twitchClientId);
			startObserver(emotes);			
		}
	});
}