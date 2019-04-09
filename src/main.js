"use strict";

import config from "../config.js";
import api from "./modules/api.js";


const BTTV = 'bttv';
const FRANKERZ = 'frankerz';
const TWITCH = 'twitch';

function generateEmoteList() {
	let emotes = new Map();
	// Get Base
	fetchEmotesForURL(emotes, 'https://api.betterttv.net/2/emotes', BTTV);

	if( config.hasOwnProperty("channels") ) {
		config.channels.forEach(function (name) {
			fetchEmotesForURL(emotes, 'https://api.betterttv.net/2/channels/'+name, BTTV);
			fetchEmotesForURL(emotes, 'https://api.frankerfacez.com/v1/room/'+name, FRANKERZ);
			if( config.hasOwnProperty('twitchClientId') ) {
				fetchEmotesForURL(emotes, 'https://api.twitch.tv/api/channels/'+name+'/product?client_id='+config.twitchClientId, TWITCH);
			}
		})
	}

	return emotes
}

function fetchEmotesForURL(emotes, url, type ) {
	api.get( url, function(response) {
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

	})
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

	observer.observe(document, observerConf);
} 


export function main() {
	// TODO: cache these with local storage?
	// Probably cache by channel
	let emotes = generateEmoteList();
	startObserver(emotes);
}