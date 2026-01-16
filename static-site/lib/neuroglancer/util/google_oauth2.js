import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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
import { CredentialsProvider, makeCredentialsGetter } from '../credentials_provider';
import { StatusMessage } from '../status';
import { CANCELED, CancellationTokenSource, uncancelableToken } from './cancellation';
import { removeFromParent } from './dom';
import { parseArray, verifyObject, verifyString } from './json';
import { getRandomHexString } from './random';
import { Signal } from './signal';
export var AUTH_SERVER = 'https://accounts.google.com/o/oauth2/auth';
var AUTH_ORIGIN = 'https://accounts.google.com';
export function embedRelayFrame(proxyName, rpcToken) {
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.id = proxyName;
    iframe.name = proxyName;
    var origin = location.origin;
    iframe.src = 'https://accounts.google.com/o/oauth2/postmessageRelay?' + ('parent=' + encodeURIComponent(origin) + '#rpctoken=' + rpcToken);
    document.body.appendChild(iframe);
}

var PendingRequest = function PendingRequest() {
    _classCallCheck(this, PendingRequest);

    this.finished = new Signal();
};

var AuthHandler = function () {
    function AuthHandler() {
        var _this = this;

        _classCallCheck(this, AuthHandler);

        this.proxyName = 'postmessageRelay' + getRandomHexString();
        this.rpcToken = '' + getRandomHexString();
        this.relayReadyService = 'oauth2relayReady:' + this.rpcToken;
        this.oauth2CallbackService = 'oauth2callback:' + this.rpcToken;
        this.pendingRequests = new _Map();
        embedRelayFrame(this.proxyName, this.rpcToken);
        this.relayReadyPromise = new _Promise(function (relayReadyPromiseResolve) {
            addEventListener('message', function (event) {
                if (event.origin !== AUTH_ORIGIN) {
                    return;
                }
                try {
                    var data = verifyObject(JSON.parse(event.data));
                    var service = verifyString(data['s']);
                    if (service === _this.relayReadyService) {
                        relayReadyPromiseResolve();
                    }
                    if (service === _this.oauth2CallbackService) {
                        var args = parseArray(data['a'], function (x) {
                            return x;
                        });
                        var arg = verifyString(args[0]);
                        var origin = location.origin;
                        if (!arg.startsWith(origin + '#') && !arg.startsWith(origin + '?')) {
                            throw new Error('oauth2callback: URL ' + _JSON$stringify(arg) + ' ' + ('does not match current origin ' + origin + '.'));
                        }
                        var hashPart = arg.substring(origin.length + 1);
                        var parts = hashPart.split('&');
                        var params = new _Map();
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = _getIterator(parts), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var part = _step.value;

                                var match = part.match('^([a-z_]+)=(.*)$');
                                if (match === null) {
                                    throw new Error('oauth2callback: URL part ' + _JSON$stringify(match) + ' ' + 'does not match expected pattern.');
                                }
                                params.set(match[1], match[2]);
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }

                        var state = params.get('state');
                        if (state === undefined) {
                            throw new Error('oauth2callback: State argument is missing.');
                        }
                        var request = _this.pendingRequests.get(state);
                        if (request === undefined) {
                            // Request may have been cancelled.
                            return;
                        }
                        var error = params.get('error');
                        if (error !== undefined) {
                            var errorSubtype = params.get('error_subtype');
                            var fullMessage = error;
                            if (errorSubtype !== undefined) {
                                fullMessage += ': ' + errorSubtype;
                            }
                            request.finished.dispatch(undefined, new Error('Error obtaining Google OAuth2 token: ' + fullMessage));
                            return;
                        }
                        var accessToken = params.get('access_token');
                        var tokenType = params.get('token_type');
                        var expiresIn = params.get('expires_in');
                        var scope = params.get('scope');
                        if (accessToken === undefined || tokenType === undefined || expiresIn === undefined || scope === undefined) {
                            throw new Error('oauth2callback: URL lacks expected parameters.');
                        }
                        request.finished.dispatch({
                            accessToken: accessToken,
                            tokenType: tokenType,
                            expiresIn: expiresIn,
                            scope: scope
                        });
                        return;
                    }
                } catch (parseError) {
                    throw new Error('Invalid message received from ' + AUTH_ORIGIN + ': ' + _JSON$stringify(event.data) + ': ' + (parseError.message + '.'));
                }
            });
        });
    }

    _createClass(AuthHandler, [{
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
            var url = AUTH_SERVER + '?client_id=' + encodeURIComponent(options.clientId);
            url += '&redirect_uri=postmessage';
            url += '&response_type=token';
            var _options$origin = options.origin,
                origin = _options$origin === undefined ? location.origin : _options$origin;

            url += '&origin=' + encodeURIComponent(origin);
            url += '&proxy=' + this.proxyName;
            url += '&include_granted_scopes=true';
            url += '&scope=' + encodeURIComponent(options.scopes.join(' '));
            if (options.state) {
                url += '&state=' + options.state;
            }
            if (options.approvalPrompt) {
                url += '&approval_prompt=' + encodeURIComponent(options.approvalPrompt);
            }
            if (options.loginHint) {
                url += '&login_hint=' + encodeURIComponent(options.loginHint);
            }
            if (options.immediate) {
                url += '&immediate=true';
            }
            if (options.authUser !== undefined) {
                url += '&authuser=' + options.authUser;
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
 * Obtain a Google OAuth2 authentication token.
 * @return A Promise that resolves to an authentication token.
 */
export function authenticateGoogleOAuth2(options) {
    var cancellationToken = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : uncancelableToken;

    var state = getRandomHexString();
    var handler = authHandler();
    var url = handler.makeAuthRequestUrl({
        state: state,
        clientId: options.clientId,
        scopes: options.scopes,
        approvalPrompt: options.approvalPrompt,
        loginHint: options.loginHint,
        immediate: options.immediate,
        authUser: options.authUser
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
    if (options.immediate) {
        // For immediate mode auth, we can wait until the relay is ready, since we aren't opening a new
        // window.
        handler.relayReadyPromise.then(function () {
            if (cancellationToken.isCanceled) {
                return;
            }
            var iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            request.finished.add(function () {
                removeFromParent(iframe);
            });
        });
    } else {
        if (!cancellationToken.isCanceled) {
            var newWindow = open(url);
            if (newWindow !== null) {
                request.finished.add(function () {
                    newWindow.close();
                });
            }
        }
    }
    return promise;
}
export var GoogleOAuth2CredentialsProvider = function (_CredentialsProvider) {
    _inherits(GoogleOAuth2CredentialsProvider, _CredentialsProvider);

    function GoogleOAuth2CredentialsProvider(options) {
        _classCallCheck(this, GoogleOAuth2CredentialsProvider);

        var _this3 = _possibleConstructorReturn(this, (GoogleOAuth2CredentialsProvider.__proto__ || _Object$getPrototypeOf(GoogleOAuth2CredentialsProvider)).call(this));

        _this3.options = options;
        _this3.get = makeCredentialsGetter(function (cancellationToken) {
            var options = _this3.options;

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
                    var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : options.description + ' authorization required.';
                    var linkMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Request authorization.';

                    status.setText(msg + '  ');
                    var button = document.createElement('button');
                    button.textContent = linkMessage;
                    status.element.appendChild(button);
                    button.addEventListener('click', function () {
                        login( /*immediate=*/false);
                    });
                    status.setVisible(true);
                }
                function login(immediate) {
                    if (cancellationSource !== undefined) {
                        cancellationSource.cancel();
                    }
                    cancellationSource = new CancellationTokenSource();
                    writeLoginStatus('Waiting for ' + options.description + ' authorization...', 'Retry');
                    authenticateGoogleOAuth2({
                        clientId: options.clientId,
                        scopes: options.scopes,
                        immediate: immediate,
                        authUser: 0
                    }, cancellationSource).then(function (token) {
                        if (cancellationSource !== undefined) {
                            dispose();
                            resolve(token);
                        }
                    }, function (reason) {
                        if (cancellationSource !== undefined) {
                            cancellationSource = undefined;
                            if (immediate) {
                                writeLoginStatus();
                            } else {
                                writeLoginStatus(options.description + ' authorization failed: ' + reason + '.', 'Retry');
                            }
                        }
                    });
                }
                login( /*immediate=*/true);
            });
        });
        return _this3;
    }

    return GoogleOAuth2CredentialsProvider;
}(CredentialsProvider);
export function fetchWithGoogleCredentials(credentialsProvider, input) {
    var init = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    function start(credentials) {
        var token = credentials.credentials;
        var headers = new Headers(init.headers);
        headers.append('Authorization', token.tokenType + ' ' + token.accessToken);
        return fetch(input, _Object$assign({}, init, { mode: 'cors', headers: headers })).then(function (response) {
            if (response.status === 401) {
                // 401: Authorization needed.  OAuth2 token may have expired.
                return credentialsProvider.get(credentials).then(start);
            }
            return response;
        });
    }
    var promise = credentialsProvider.get( /*invalidToken=*/undefined).then(start);
    var disposeRef = function disposeRef() {
        credentialsProvider.dispose();
    };
    promise.then(disposeRef, disposeRef);
    return promise;
}
//# sourceMappingURL=google_oauth2.js.map