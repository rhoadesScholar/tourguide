import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Map from 'babel-runtime/core-js/map';
import _createClass from 'babel-runtime/helpers/createClass';
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
 * @file Generic facility for providing authentication/authorization credentials.
 */
import { MultipleConsumerCancellationTokenSource } from '../util/cancellation';
import { RefCounted } from '../util/disposable';
import { StringMemoize } from '../util/memoize';
export var CredentialsProvider = function (_RefCounted) {
    _inherits(CredentialsProvider, _RefCounted);

    function CredentialsProvider() {
        _classCallCheck(this, CredentialsProvider);

        return _possibleConstructorReturn(this, (CredentialsProvider.__proto__ || _Object$getPrototypeOf(CredentialsProvider)).apply(this, arguments));
    }

    return CredentialsProvider;
}(RefCounted);
export function makeCachedCredentialsGetter(getUncached) {
    var cachedCredentials = void 0;
    var pendingCredentials = void 0;
    var pendingCancellationToken = void 0;
    return function (invalidCredentials, cancellationToken) {
        if (pendingCredentials !== undefined && (cachedCredentials === undefined || invalidCredentials === undefined || cachedCredentials.generation !== invalidCredentials.generation)) {
            if (cachedCredentials === undefined) {
                pendingCancellationToken.addConsumer(cancellationToken);
            }
            return pendingCredentials;
        }
        cachedCredentials = undefined;
        pendingCancellationToken = new MultipleConsumerCancellationTokenSource();
        pendingCredentials = getUncached(invalidCredentials, pendingCancellationToken).then(function (credentials) {
            cachedCredentials = credentials;
            pendingCancellationToken = undefined;
            return credentials;
        }, function (reason) {
            if (pendingCancellationToken.isCanceled) {
                pendingCancellationToken = undefined;
                pendingCredentials = undefined;
            }
            throw reason;
        });
        return pendingCredentials;
    };
}
export function makeCredentialsGetter(getWithoutGeneration) {
    var generation = 0;
    return makeCachedCredentialsGetter(function (_invalidCredentials, cancellationToken) {
        return getWithoutGeneration(cancellationToken).then(function (credentials) {
            return { generation: ++generation, credentials: credentials };
        });
    });
}
/**
 * CredentialsManager that supports registration.
 */
export var MapBasedCredentialsManager = function () {
    function MapBasedCredentialsManager() {
        _classCallCheck(this, MapBasedCredentialsManager);

        this.providers = new _Map();
    }

    _createClass(MapBasedCredentialsManager, [{
        key: 'register',
        value: function register(key, providerGetter) {
            this.providers.set(key, providerGetter);
        }
    }, {
        key: 'getCredentialsProvider',
        value: function getCredentialsProvider(key, parameters) {
            var getter = this.providers.get(key);
            if (getter === undefined) {
                throw new Error('No registered credentials provider: ' + _JSON$stringify(key));
            }
            return getter(parameters);
        }
    }]);

    return MapBasedCredentialsManager;
}();
/**
 * CredentialsManager that wraps another and caches the CredentialsProvider objects.
 */
export var CachingCredentialsManager = function (_RefCounted2) {
    _inherits(CachingCredentialsManager, _RefCounted2);

    function CachingCredentialsManager(base) {
        _classCallCheck(this, CachingCredentialsManager);

        var _this2 = _possibleConstructorReturn(this, (CachingCredentialsManager.__proto__ || _Object$getPrototypeOf(CachingCredentialsManager)).call(this));

        _this2.base = base;
        _this2.memoize = new StringMemoize();
        return _this2;
    }

    _createClass(CachingCredentialsManager, [{
        key: 'getCredentialsProvider',
        value: function getCredentialsProvider(key, parameters) {
            var _this3 = this;

            return this.memoize.get({ key: key, parameters: parameters }, function () {
                return _this3.registerDisposer(_this3.base.getCredentialsProvider(key, parameters).addRef());
            });
        }
    }]);

    return CachingCredentialsManager;
}(RefCounted);
export var CachingMapBasedCredentialsManager = function (_CachingCredentialsMa) {
    _inherits(CachingMapBasedCredentialsManager, _CachingCredentialsMa);

    function CachingMapBasedCredentialsManager() {
        _classCallCheck(this, CachingMapBasedCredentialsManager);

        return _possibleConstructorReturn(this, (CachingMapBasedCredentialsManager.__proto__ || _Object$getPrototypeOf(CachingMapBasedCredentialsManager)).call(this, new MapBasedCredentialsManager()));
    }

    _createClass(CachingMapBasedCredentialsManager, [{
        key: 'register',
        value: function register(key, providerGetter) {
            this.base.register(key, providerGetter);
        }
    }]);

    return CachingMapBasedCredentialsManager;
}(CachingCredentialsManager);
//# sourceMappingURL=index.js.map