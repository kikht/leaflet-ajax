'use strict';
var jsonp = require('./jsonp');
var Promise = require('lie');

module.exports = function (url, options) {
  options = options || {};
  if (options.jsonp) {
    return jsonp(url, options);
  }
  var request;
  var cancel;
  var out = new Promise(function (resolve, reject) {
    cancel = reject;
    if (global.XMLHttpRequest === undefined) {
      reject('XMLHttpRequest is not supported');
    }
    var response;
    var method;
    var params = null;
    request = new global.XMLHttpRequest();
    if (!options.method || options.method == 'GET') {
      method = 'GET';
      var s = [];
      Object.keys(options.params).forEach(function (key) {
        var val = options.params[key];
        s[s.length] = encodeURIComponent(key) + '=' +
          encodeURIComponent(val == null ? '' : val);
      });
      if (s.length != 0) {
        url += '?' + s.join('&');
      }
    } else {
      method = options.method;
      params = Object.keys(options.params).length > 0 ? options.params : null;
    }
    request.open(method, url);
    if (options.headers) {
      Object.keys(options.headers).forEach(function (key) {
        request.setRequestHeader(key, options.headers[key]);
      });
    }
    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if ((request.status < 400 && options.local) || request.status === 200) {
          if (global.JSON) {
            response = JSON.parse(request.responseText);
          } else {
            reject(new Error('JSON is not supported'));
          }
          resolve(response);
        } else {
          if (!request.status) {
            reject('Attempted cross origin request without CORS enabled');
          } else {
            reject(request.statusText);
          }
        }
      }
    };
    if (params != null) {
      request.send(params);
    } else {
      request.send();
    }
  });
  out.catch(function (reason) {
    request.abort();
    return reason;
  });
  out.abort = cancel;
  return out;
};
