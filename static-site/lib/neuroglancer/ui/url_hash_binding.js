import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2016 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import debounce from 'lodash/debounce';
import { WatchableValue } from '../trackable_value';
import { RefCounted } from '../util/disposable';
import { urlSafeParse, verifyObject } from '../util/json';
import { getCachedJson } from '../util/trackable';
/**
 * @file Implements a binding between a Trackable value and the URL hash state.
 */
/**
 * Encodes a fragment string robustly.
 */
function encodeFragment(fragment) {
    return encodeURI(fragment).replace(/[!'()*;,]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
}
/**
 * An instance of this class manages a binding between a Trackable value and the URL hash state.
 * The binding is initialized in the constructor, and is removed when dispose is called.
 */
export var UrlHashBinding = function (_RefCounted) {
    _inherits(UrlHashBinding, _RefCounted);

    function UrlHashBinding(root) {
        var updateDelayMilliseconds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;

        _classCallCheck(this, UrlHashBinding);

        var _this = _possibleConstructorReturn(this, (UrlHashBinding.__proto__ || _Object$getPrototypeOf(UrlHashBinding)).call(this));

        _this.root = root;
        /**
         * Most recent error parsing URL hash.
         */
        _this.parseError = new WatchableValue(undefined);
        _this.registerEventListener(window, 'hashchange', function () {
            return _this.updateFromUrlHash();
        });
        var throttledSetUrlHash = debounce(function () {
            return _this.setUrlHash();
        }, updateDelayMilliseconds);
        _this.registerDisposer(root.changed.add(throttledSetUrlHash));
        _this.registerDisposer(function () {
            return throttledSetUrlHash.cancel();
        });
        return _this;
    }
    /**
     * Sets the URL hash to match the current state.
     */


    _createClass(UrlHashBinding, [{
        key: 'setUrlHash',
        value: function setUrlHash() {
            var cacheState = getCachedJson(this.root);
            var generation = cacheState.generation;

            if (generation !== this.prevStateGeneration) {
                this.prevStateGeneration = cacheState.generation;
                var stateString = encodeFragment(_JSON$stringify(cacheState.value));
                if (stateString !== this.prevStateString) {
                    this.prevStateString = stateString;
                    if (decodeURIComponent(stateString) === '{}') {
                        history.replaceState(null, '', '#');
                    } else {
                        history.replaceState(null, '', '#!' + stateString);
                    }
                }
            }
        }
        /**
         * Sets the current state to match the URL hash.  If it is desired to initialize the state based
         * on the URL hash, then this should be called immediately after construction.
         */

    }, {
        key: 'updateFromUrlHash',
        value: function updateFromUrlHash() {
            try {
                var s = location.href.replace(/^[^#]+/, '');
                if (s === '' || s === '#' || s === '#!') {
                    s = '#!{}';
                }
                if (s.startsWith('#!+')) {
                    s = s.slice(3);
                    // Firefox always %-encodes the URL even if it is not typed that way.
                    s = decodeURIComponent(s);
                    var state = urlSafeParse(s);
                    verifyObject(state);
                    this.root.restoreState(state);
                    this.prevStateString = undefined;
                } else if (s.startsWith('#!')) {
                    s = s.slice(2);
                    s = decodeURIComponent(s);
                    if (s === this.prevStateString) {
                        return;
                    }
                    this.prevStateString = s;
                    this.root.reset();
                    var _state = urlSafeParse(s);
                    verifyObject(_state);
                    this.root.restoreState(_state);
                } else {
                    throw new Error('URL hash is expected to be of the form "#!{...}" or "#!+{...}".');
                }
                this.parseError.value = undefined;
            } catch (parseError) {
                this.parseError.value = parseError;
            }
        }
    }]);

    return UrlHashBinding;
}(RefCounted);
//# sourceMappingURL=url_hash_binding.js.map