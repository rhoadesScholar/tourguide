import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _Promise from 'babel-runtime/core-js/promise';
import _Map from 'babel-runtime/core-js/map';
import _createClass from 'babel-runtime/helpers/createClass';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
/**
 * @file
 * This implements a CredentialsProvider based on Keycloak.
 * The current implementation uses the implicit flow for ease of implementation.
 * TODO: Implement the authorization or hybrid flows.
 * TODO: Use an iframe to test for immediate login (active session).
 */
import { CredentialsProvider, makeCredentialsGetter } from '../../credentials_provider';
import { StatusMessage } from '../../status';
import { CANCELED, CancellationTokenSource, uncancelableToken } from '../../util/cancellation';
import { verifyObject, verifyString } from '../../util/json';
import { getRandomHexString } from '../../util/random';
import { Signal } from '../../util/signal';

var PendingRequest = function PendingRequest() {
    _classCallCheck(this, PendingRequest);

    this.finished = new Signal();
};

var AuthHandler = function () {
    function AuthHandler() {
        _classCallCheck(this, AuthHandler);

        this.oidcCallbackService = 'bossAuthCallback';
        this.pendingRequests = new _Map();
        this.registerListener();
    }

    _createClass(AuthHandler, [{
        key: 'registerListener',
        value: function registerListener() {
            var _this = this;

            addEventListener('message', function (event) {
                if (event.origin !== location.origin) {
                    // Ignore messages from different origins.
                    return;
                }
                try {
                    var data = verifyObject(JSON.parse(event.data));
                    var service = verifyString(data['service']);
                    if (service === _this.oidcCallbackService) {
                        var accessToken = verifyString(data['access_token']);
                        var state = verifyString(data['state']);
                        var request = _this.pendingRequests.get(state);
                        if (request === undefined) {
                            // Request may have been cancelled.
                            return;
                        }
                        request.finished.dispatch(accessToken);
                    }
                } catch (parseError) {
                    // Ignore invalid message.
                }
            });
        }
    }, {
        key: 'addPendingRequest',
        value: function addPendingRequest(state) {
            var _this2 = this;

            var request = new PendingRequest();
            this.pendingRequests.set(state, request);
            request.finished.add(function () {
                _this2.pendingRequests.delete(state);
            });
            return request;
        }
    }, {
        key: 'makeAuthRequestUrl',
        value: function makeAuthRequestUrl(options) {
            var url = options.authServer + '/realms/BOSS/protocol/openid-connect/auth?';
            url += 'client_id=' + encodeURIComponent(options.clientId);
            url += '&redirect_uri=' + encodeURIComponent(options.redirect_uri);
            url += '&response_mode=fragment';
            url += '&response_type=code%20id_token%20token';
            if (options.state) {
                url += '&state=' + options.state;
            }
            if (options.nonce) {
                url += '&nonce=' + options.nonce;
            }
            return url;
        }
    }]);

    return AuthHandler;
}();

var authHandlerInstance = void 0;
function authHandler() {
    if (authHandlerInstance === undefined) {
        authHandlerInstance = new AuthHandler();
    }
    return authHandlerInstance;
}
/**
 * Obtain a Keycloak OIDC authentication token.
 * @return A Promise that resolves to an authentication token.
 */
export function authenticateKeycloakOIDC(options) {
    var cancellationToken = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : uncancelableToken;

    var state = getRandomHexString();
    var nonce = getRandomHexString();
    var handler = authHandler();
    var url = handler.makeAuthRequestUrl({
        state: state,
        clientId: options.clientId,
        redirect_uri: new URL('bossauth.html', window.location.href).href,
        authServer: options.authServer,
        nonce: nonce
    });
    var request = handler.addPendingRequest(state);
    var promise = new _Promise(function (resolve, reject) {
        request.finished.add(function (token, error) {
            if (token !== undefined) {
                resolve(token);
            } else {
                reject(error);
            }
        });
    });
    request.finished.add(cancellationToken.add(function () {
        request.finished.dispatch(undefined, CANCELED);
    }));
    if (!cancellationToken.isCanceled) {
        var newWindow = open(url);
        if (newWindow !== null) {
            request.finished.add(function () {
                newWindow.close();
            });
        }
    }
    return promise;
}
export var BossCredentialsProvider = function (_CredentialsProvider) {
    _inherits(BossCredentialsProvider, _CredentialsProvider);

    function BossCredentialsProvider(authServer) {
        _classCallCheck(this, BossCredentialsProvider);

        var _this3 = _possibleConstructorReturn(this, (BossCredentialsProvider.__proto__ || _Object$getPrototypeOf(BossCredentialsProvider)).call(this));

        _this3.authServer = authServer;
        _this3.get = makeCredentialsGetter(function (cancellationToken) {
            var status = new StatusMessage( /*delay=*/true);
            var cancellationSource = void 0;
            return new _Promise(function (resolve, reject) {
                var dispose = function dispose() {
                    cancellationSource = undefined;
                    status.dispose();
                };
                cancellationToken.add(function () {
                    if (cancellationSource !== undefined) {
                        cancellationSource.cancel();
                        cancellationSource = undefined;
                        status.dispose();
                        reject(CANCELED);
                    }
                });
                function writeLoginStatus() {
                    var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Boss authorization required.';
                    var linkMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Request authorization.';

                    status.setText(msg + ' ');
                    var button = document.createElement('button');
                    button.textContent = linkMessage;
                    status.element.appendChild(button);
                    button.addEventListener('click', function () {
                        login();
                    });
                    status.setVisible(true);
                }
                var authServer = _this3.authServer;
                function login() {
                    if (cancellationSource !== undefined) {
                        cancellationSource.cancel();
                    }
                    cancellationSource = new CancellationTokenSource();
                    writeLoginStatus('Waiting for Boss authorization...', 'Retry');
                    authenticateKeycloakOIDC({ realm: 'boss', clientId: 'endpoint', authServer: authServer }, cancellationSource).then(function (token) {
                        if (cancellationSource !== undefined) {
                            dispose();
                            resolve(token);
                        }
                    }, function (reason) {
                        if (cancellationSource !== undefined) {
                            cancellationSource = undefined;
                            writeLoginStatus('Boss authorization failed: ' + reason + '.', 'Retry');
                        }
                    });
                }
                writeLoginStatus();
            });
        });
        return _this3;
    }

    return BossCredentialsProvider;
}(CredentialsProvider);
//# sourceMappingURL=credentials_provider.js.map