const defaultChannels = [
    'pokimane',
    'disguisedtoast',
    'xchocobars',
    'loserfruit'
];
chrome.storage.local.get({'channels': defaultChannels}, function(data) {
    chrome.storage.local.set({'channels':data.channels});
});
