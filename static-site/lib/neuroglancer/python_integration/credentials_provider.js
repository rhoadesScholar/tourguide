import _createClass from 'babel-runtime/helpers/createClass';
import _Promise from 'babel-runtime/core-js/promise';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2017 Google Inc.
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
/**
 * @file Implementation of a CredentialsProvider based on an input and output TrackableValue.
 */
import { CredentialsProvider, makeCachedCredentialsGetter } from '../credentials_provider';
import { TrackableValue } from '../trackable_value';
import { Memoize } from '../util/memoize';
import { PersistentCompoundTrackable } from '../util/trackable';
import { stableStringify } from '../util/json';

var TrackableBasedCredentialsProvider = function (_CredentialsProvider) {
    _inherits(TrackableBasedCredentialsProvider, _CredentialsProvider);

    function TrackableBasedCredentialsProvider() {
        _classCallCheck(this, TrackableBasedCredentialsProvider);

        var _this = _possibleConstructorReturn(this, (TrackableBasedCredentialsProvider.__proto__ || _Object$getPrototypeOf(TrackableBasedCredentialsProvider)).apply(this, arguments));

        _this.invalidCredentials = new TrackableValue(undefined, function (x) {
            return x;
        });
        _this.validCredentials = new TrackableValue(undefined, function (x) {
            return x;
        });
        _this.get = makeCachedCredentialsGetter(function (invalidCredentials) {
            return new _Promise(function (resolve) {
                var validCredentials = _this.validCredentials.value;
                var invalidGeneration = invalidCredentials !== undefined ? invalidCredentials.generation : null;
                var isValidCredentials = function isValidCredentials(credentials) {
                    return credentials !== undefined && invalidGeneration !== credentials.generation;
                };
                if (isValidCredentials(validCredentials)) {
                    resolve(validCredentials);
                    return;
                }
                _this.invalidCredentials.value = invalidGeneration;
                var disposer = void 0;
                disposer = _this.validCredentials.changed.add(function () {
                    var newCredentials = _this.validCredentials.value;
                    if (isValidCredentials(newCredentials)) {
                        disposer();
                        resolve(newCredentials);
                    }
                });
            });
        });
        return _this;
    }

    return TrackableBasedCredentialsProvider;
}(CredentialsProvider);

export var TrackableBasedCredentialsManager = function () {
    function TrackableBasedCredentialsManager() {
        _classCallCheck(this, TrackableBasedCredentialsManager);

        this.inputState = new PersistentCompoundTrackable();
        this.outputState = new PersistentCompoundTrackable();
        this.memoize = new Memoize();
    }

    _createClass(TrackableBasedCredentialsManager, [{
        key: 'getCredentialsProvider',
        value: function getCredentialsProvider(key, parameters) {
            var _this2 = this;

            if (parameters === undefined) {
                parameters = null;
            }
            var combinedKey = stableStringify({ key: key, parameters: parameters });
            return this.memoize.get(combinedKey, function () {
                var provider = new TrackableBasedCredentialsProvider();
                provider.registerDisposer(_this2.inputState.add(combinedKey, provider.validCredentials));
                provider.registerDisposer(_this2.outputState.add(combinedKey, provider.invalidCredentials));
                return provider;
            });
        }
    }]);

    return TrackableBasedCredentialsManager;
}();
//# sourceMappingURL=credentials_provider.js.map