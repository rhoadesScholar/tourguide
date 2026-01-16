import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { RefCounted } from '../util/disposable';
import { getRandomHexString } from '../util/random';
import { Signal } from '../util/signal';
import { getCachedJson } from '../util/trackable';
export var AtomicStateClient = function (_RefCounted) {
    _inherits(AtomicStateClient, _RefCounted);

    /**
     * @param updateDelayMilliseconds If `null`, this client is receive only.  No updates are sent.
     * @param receiveUpdates If `false`, this client doesn't receive updates.
     */
    function AtomicStateClient(state) {
        var updateDelayMilliseconds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
        var receiveUpdates = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        _classCallCheck(this, AtomicStateClient);

        var _this = _possibleConstructorReturn(this, (AtomicStateClient.__proto__ || _Object$getPrototypeOf(AtomicStateClient)).call(this));

        _this.state = state;
        _this.receiveUpdates = receiveUpdates;
        _this.serverGeneration = '';
        _this.clientGeneration = -1;
        _this.connected_ = false;
        _this.receiveUpdateRequested = new Signal();
        _this.sendUpdateRequested = new Signal();
        if (updateDelayMilliseconds !== null) {
            _this.sendUpdates = true;
            _this.registerDisposer(state.changed.add(_this.registerCancellable(throttle(_this.registerCancellable(debounce(function () {
                return _this.handleStateChanged();
            }, 0)), updateDelayMilliseconds, { leading: false }))));
        } else {
            _this.sendUpdates = false;
        }
        return _this;
    }

    _createClass(AtomicStateClient, [{
        key: 'setState',
        value: function setState(value, generation) {
            if (!this.receiveUpdates) {
                return;
            }
            if (generation !== this.serverGeneration) {
                this.lastServerState = _JSON$stringify(value);
                this.state.reset();
                this.state.restoreState(value);
                this.serverGeneration = generation;
                this.clientGeneration = this.state.changed.count;
            }
        }
    }, {
        key: 'handleStateChanged',
        value: function handleStateChanged() {
            if (!this.sendUpdates) {
                return;
            }
            if (!this.connected_ || this.receiveUpdates && this.serverGeneration === '' || this.clientGeneration === this.state.changed.count) {
                return;
            }
            var newStateJson = getCachedJson(this.state).value;
            var newStateEncoded = _JSON$stringify(newStateJson);
            if (newStateEncoded === this.lastServerState) {
                // Avoid sending back the exact same state just received from or sent to the server.  This is
                // also important for making things work in the presence of multiple simultaneous clients.
                this.clientGeneration = this.state.changed.count;
                return;
            }
            var generation = getRandomHexString(160);
            this.serverGeneration = generation;
            this.lastServerState = newStateEncoded;
            this.sendUpdateRequested.dispatch(newStateJson, generation);
        }
    }, {
        key: 'connected',
        set: function set(value) {
            if (value !== this.connected_) {
                this.connected_ = value;
                if (value === true) {
                    if (this.receiveUpdates) {
                        this.receiveUpdateRequested.dispatch(this.serverGeneration);
                    }
                    this.handleStateChanged();
                }
            }
        },
        get: function get() {
            return this.connected_;
        }
    }]);

    return AtomicStateClient;
}(RefCounted);
//# sourceMappingURL=atomic_state_client.js.map