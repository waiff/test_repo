import PubSub from 'pubsub-js';
export { default as PubSub } from 'pubsub-js';
import { useCallback, useEffect, useState } from 'react';

var useSubscribe = function (_a) {
    var token = _a.token, handler = _a.handler, _b = _a.isUnsubscribe, isUnsubscribe = _b === void 0 ? false : _b;
    var unsubscribe = useCallback(function () {
        PubSub.unsubscribe(handler);
    }, [handler]);
    var resubscribe = useCallback(function () {
        PubSub.unsubscribe(handler);
        PubSub.subscribe(token, handler);
    }, [token, handler]);
    useEffect(function () {
        if (isUnsubscribe) {
            unsubscribe();
        }
        else {
            PubSub.subscribe(token, handler);
        }
        return function () {
            unsubscribe();
        };
    }, [isUnsubscribe]);
    return { unsubscribe: unsubscribe, resubscribe: resubscribe };
};

/* eslint-disable func-names */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-multi-assign */
function debounce(func, wait, immediate) {
    if (wait === void 0) { wait = 100; }
    if (immediate === void 0) { immediate = false; }
    var timeout;
    var args;
    var context;
    var timestamp;
    var result;
    function later() {
        var last = Date.now() - timestamp;
        if (last < wait && last >= 0) {
            timeout = setTimeout(later, wait - last);
        }
        else {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
                context = args = null;
            }
        }
    }
    var debounced = function () {
        // @ts-ignore
        context = this;
        args = arguments;
        timestamp = Date.now();
        var callNow = immediate && !timeout;
        if (!timeout)
            timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }
        return result;
    };
    debounced.clear = function () {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };
    debounced.flush = function () {
        if (timeout) {
            result = func.apply(context, args);
            context = args = null;
            clearTimeout(timeout);
            timeout = null;
        }
    };
    return debounced;
}
// Adds compatibility for ES modules
debounce.debounce = debounce;

var usePublish = function (_a) {
    var token = _a.token, message = _a.message, _b = _a.isAutomatic, isAutomatic = _b === void 0 ? false : _b, _c = _a.isInitialPublish, isInitialPublish = _c === void 0 ? false : _c, _d = _a.isImmediate, isImmediate = _d === void 0 ? false : _d, _e = _a.debounceMs, debounceMs = _e === void 0 ? 300 : _e;
    var _f = useState(false), lastPublish = _f[0], setLastPublish = _f[1];
    var publish = useCallback(function () {
        var isPublished = PubSub.publish(token, message);
        setLastPublish(isPublished);
    }, [token, message]);
    useEffect(function () {
        if (isInitialPublish) {
            publish();
        }
    }, []);
    useEffect(function () {
        var debouncedPublished = debounce(publish, +debounceMs, isImmediate);
        if (isAutomatic && message) {
            debouncedPublished();
        }
        return function () {
            debouncedPublished.clear();
        };
    }, [publish, isImmediate, isAutomatic, debounceMs]);
    return { lastPublish: lastPublish, publish: publish };
};

var index = { PubSub: PubSub, useSubscribe: useSubscribe, usePublish: usePublish };

export default index;
export { usePublish, useSubscribe };
//# sourceMappingURL=index.es.js.map
