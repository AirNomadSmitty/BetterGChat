"use strict";

let clientIdField = document.getElementById("twitchClientId");
let channelDiv = document.getElementById('channels');
let addChannelBtn = document.getElementById('addChannel');
let saveBtn = document.getElementById('save');

let addChannelInput = function(div, value) {
    let input = document.createElement('INPUT');
    if( value ) {
        input.value = value;
    } else {
        input.placeholder = "Twitch Channel";
    }
    div.appendChild(input);
}

let twitchClientId = chrome.storage.local.get("twitchClientId", function(data){
    if( typeof data.twitchClientId === 'undefined' ) {
        clientIdField.setAttribute('placeholder', 'Twitch Client ID');
    } else {
        clientIdField.value = data.twitchClientId;
    }
});

let channels = chrome.storage.local.get('channels', function(data) {
   data.channels.forEach(function (name) {
        addChannelInput(channelDiv, name);
   });
});

addChannelBtn.addEventListener('click', function() {
    addChannelInput(channelDiv);
});

saveBtn.addEventListener('click', function() {
    if( clientIdField.value ) {
        chrome.storage.local.set({"twitchClientId": clientIdField.value});
    }
    let channels = [];
    Array.from(channelDiv.getElementsByTagName('INPUT')).forEach(function(ele) {
        if( ele.value ) {
            channels.push(ele.value);
        }
    });
    chrome.storage.local.set({"channels":channels});
});