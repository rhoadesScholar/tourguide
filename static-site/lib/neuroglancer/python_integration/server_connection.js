import _typeof from 'babel-runtime/helpers/typeof';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
import { AtomicStateClient } from './atomic_state_client';
import { RefCounted } from '../util/disposable';
import SockJS from 'sockjs-client';
import { StatusMessage } from '../status';
function getServerConnectionURL() {
    var match = window.location.pathname.match(/^(.*)\/v\/([^\/]+)/);
    if (match === null) {
        throw new Error('Failed to determine token from URL.');
    }
    return '' + window.location.origin + match[1] + '/socket/' + match[2];
}
var defaultReconnectionDelay = 1000;
var updateDelayMilliseconds = 100;
export var ServerConnection = function (_RefCounted) {
    _inherits(ServerConnection, _RefCounted);

    function ServerConnection(sharedState, privateState, configState) {
        var url = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : getServerConnectionURL();

        _classCallCheck(this, ServerConnection);

        var _this = _possibleConstructorReturn(this, (ServerConnection.__proto__ || _Object$getPrototypeOf(ServerConnection)).call(this));

        _this.sharedState = sharedState;
        _this.privateState = privateState;
        _this.configState = configState;
        _this.url = url;
        _this.reconnectionDelay = defaultReconnectionDelay;
        _this.waitingToReconnect = -1;
        _this.isOpen = false;
        _this.updateClients = new _Map();
        _this.status = _this.registerDisposer(new StatusMessage(true));
        _this.actionQueue = [];
        _this.nextActionId = 0;
        _this.lastActionAcknowledged = -1;
        var statesToUpdate = [{ key: 'p', state: privateState, receiveUpdates: false, sendUpdates: 0 }, { key: 'c', state: configState, receiveUpdates: true, sendUpdates: null }];
        if (sharedState !== undefined) {
            statesToUpdate.push({
                key: 's',
                state: sharedState,
                receiveUpdates: true,
                sendUpdates: updateDelayMilliseconds
            });
        }

        var _loop = function _loop(key, state, receiveUpdates, sendUpdates) {
            var updateClient = _this.registerDisposer(new AtomicStateClient(state, sendUpdates, receiveUpdates));
            _this.updateClients.set(key, updateClient);
            if (sendUpdates !== null) {
                updateClient.sendUpdateRequested.add(function (value, generation) {
                    return _this.send('setState', { k: key, s: value, g: generation });
                });
            }
            if (receiveUpdates) {
                updateClient.receiveUpdateRequested.add(function (generation) {
                    return _this.send('getState', { g: generation, k: key });
                });
            }
        };

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(statesToUpdate), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _ref = _step.value;
                var key = _ref.key;
                var state = _ref.state;
                var receiveUpdates = _ref.receiveUpdates;
                var sendUpdates = _ref.sendUpdates;

                _loop(key, state, receiveUpdates, sendUpdates);
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

        _this.connect();
        return _this;
    }

    _createClass(ServerConnection, [{
        key: 'dispose',
        value: function dispose() {
            if (this.socket !== undefined) {
                this.socket.close();
                this.socket = undefined;
            }
            if (this.waitingToReconnect !== -1) {
                clearInterval(this.waitingToReconnect);
                this.waitingToReconnect = -1;
            }
        }
    }, {
        key: 'send',
        value: function send(messageType, message) {
            message['t'] = messageType;
            this.socket.send(_JSON$stringify(message));
        }
    }, {
        key: 'connect',
        value: function connect() {
            var _this2 = this;

            this.status.setText('Connecting to Python server');
            this.status.setVisible(true);
            var socket = this.socket = new SockJS(this.url, { transports: ['websocket', 'xhr-streaming'] });
            socket.onopen = function () {
                _this2.isOpen = true;
                _this2.reconnectionDelay = defaultReconnectionDelay;
                _this2.status.setVisible(false);
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = _getIterator(_this2.updateClients.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var client = _step2.value;

                        client.connected = true;
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                _this2.flushActionQueue();
            };
            socket.onclose = function () {
                _this2.isOpen = false;
                var reconnectionDelay = _this2.reconnectionDelay;
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = _getIterator(_this2.updateClients.values()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var client = _step3.value;

                        client.connected = false;
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                var reconnectTime = Date.now() + reconnectionDelay;
                _this2.status.setVisible(true);
                var updateStatus = function updateStatus(remaining) {
                    _this2.status.setText('Disconnected from Python server.  ' + ('Retrying in ' + Math.ceil(remaining / 1000) + ' seconds.'));
                };
                _this2.waitingToReconnect = setInterval(function () {
                    var remaining = reconnectTime - Date.now();
                    if (remaining < 0) {
                        clearInterval(_this2.waitingToReconnect);
                        _this2.waitingToReconnect = -1;
                        _this2.connect();
                    } else {
                        updateStatus(remaining);
                    }
                }, 1000);
                updateStatus(reconnectionDelay);
                _this2.reconnectionDelay = Math.min(30 * 1000, reconnectionDelay * 2);
            };
            socket.onmessage = function (e) {
                var x = JSON.parse(e.data);
                if ((typeof x === 'undefined' ? 'undefined' : _typeof(x)) !== 'object' || Array.isArray(x)) {
                    throw new Error('Invalid message received over server connection.');
                }
                switch (x['t']) {
                    case 'setState':
                        {
                            var _updateClient = _this2.updateClients.get(x['k']);
                            if (_updateClient === undefined) {
                                throw new Error('Invalid state key: ' + _JSON$stringify(x['k']));
                            }
                            _updateClient.setState(x['s'], x['g']);
                            break;
                        }
                    case 'ackAction':
                        {
                            var lastId = parseInt(x['id'], 10);
                            if (lastId < _this2.lastActionAcknowledged || lastId >= _this2.nextActionId) {
                                throw new Error('Invalid action acknowledged message');
                            }
                            _this2.actionQueue.splice(0, lastId - _this2.lastActionAcknowledged);
                            _this2.lastActionAcknowledged = lastId;
                            break;
                        }
                }
            };
        }
    }, {
        key: 'flushActionQueue',
        value: function flushActionQueue() {
            var actionQueue = this.actionQueue;

            if (actionQueue.length === 0) {
                return;
            }
            this.send('action', { id: this.nextActionId - 1, actions: actionQueue });
        }
    }, {
        key: 'sendActionNotification',
        value: function sendActionNotification(action, state) {
            this.actionQueue.push({ action: action, state: state });
            ++this.nextActionId;
            if (this.isOpen) {
                this.flushActionQueue();
            }
        }
    }]);

    return ServerConnection;
}(RefCounted);
//# sourceMappingURL=server_connection.js.map