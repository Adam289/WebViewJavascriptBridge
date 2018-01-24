;(function () {
    if (window.WebViewJavascriptBridge) {
        return;
    }
    var messageHandlers = {};
    var responseCallbacks = {};
    var uniqueId = 1;
    var dispatchMessagesWithTimeoutSafety = true;
    var random = 1;

    function _doSend(message, responseCallback) {
        if (responseCallback) {
            var callbackId = 'cb_' + (uniqueId++) + '_' + new Date().getTime();
            responseCallbacks[callbackId] = responseCallback;
            message['callbackId'] = callbackId;
        }
        window.WVJBInterface && WVJBInterface.notice(JSON.stringify(message || {}));
    }
    
    var bridge= {
        registerHandler: function (handlerName, handler) {
            messageHandlers[handlerName] = handler;
        },

        callHandler: function (handlerName, data, responseCallback) {
            if (arguments.length == 2 && typeof data == 'function') {
                responseCallback = data;
                data = null;
            }
            _doSend({handlerName: handlerName, data: data}, responseCallback);
        },
        disableJavscriptAlertBoxSafetyTimeout: function (disable) {
            this.callHandler("disableJavascriptAlertBoxSafetyTimeout",disable!==false)
        },
        handleMessageFromJava: function (messageJSON) {
            _dispatchMessageFromJava(messageJSON); 
        },
        hasNativeMethod:function(name,responseCallback){
         this.callHandler('hasNativeMethod',name,responseCallback);
        }
    };

    bridge.registerHandler('hasJavascriptMethod',function(data,responseCallback){
      responseCallback(!!messageHandlers[data])
    })

    function _dispatchMessageFromJava(message) {
            var messageHandler;
            var responseCallback;
            if (message.responseId) {
                responseCallback = responseCallbacks[message.responseId];
                if (!responseCallback) {
                    return;
                }
                responseCallback(message.responseData);
                delete responseCallbacks[message.responseId];
            } else {
                if (message.callbackId) {
                    var callbackResponseId = message.callbackId;
                    responseCallback = function (responseData) {
                        _doSend({
                            handlerName: message.handlerName,
                            responseId: callbackResponseId,
                            responseData: responseData
                        });
                    };
                }
                var handler = messageHandlers[message.handlerName];
                if (!handler) {
                    console.log("WebViewJavascriptBridge: WARNING: no handler for message from java", message);
                } else {
                    handler(message.data, responseCallback);
                }
            }
    }

    var callbacks = window.WVJBCallbacks;
    delete window.WVJBCallbacks;
    if (callbacks) {
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](bridge);
        }
    }
    window.WebViewJavascriptBridge=bridge;
})();
