function makeRequest(method, url, callback, data) {
    var req = new XMLHttpRequest();
    req.open(method, url, true);
    req.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
            if (callback) {
                var response = JSON.parse(this.responseText);
                callback(response);
            }
        }
    };
    req.send(JSON.stringify(data));
};

const api = {
    get: function( url, callback, data ) {
        makeRequest('get', url, callback, data );
    },
    post: function( url, callback, data ) {
        makeRequest('post', url, callback, data );
    }
}

export default api;