import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Set from 'babel-runtime/core-js/set';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
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
 * @file Facility for remote action handling.
 */
import debounce from 'lodash/debounce';
import { TrackableValue } from '../trackable_value';
import { RefCounted } from '../util/disposable';
import { registerActionListener } from '../util/event_action_map';
import { vec3 } from '../util/geom';
import { verifyStringArray } from '../util/json';
import { Signal } from '../util/signal';
import { getCachedJson } from '../util/trackable';
export var RemoteActionHandler = function (_RefCounted) {
    _inherits(RemoteActionHandler, _RefCounted);

    function RemoteActionHandler(viewer) {
        _classCallCheck(this, RemoteActionHandler);

        var _this = _possibleConstructorReturn(this, (RemoteActionHandler.__proto__ || _Object$getPrototypeOf(RemoteActionHandler)).call(this));

        _this.viewer = viewer;
        _this.actionSet = new TrackableValue(new _Set(), function (x) {
            return new _Set(verifyStringArray(x));
        });
        _this.actionDisposers = [];
        _this.sendActionRequested = new Signal();
        _this.actionSet.changed.add(debounce(function () {
            return _this.updateActions();
        }, 0));
        return _this;
    }

    _createClass(RemoteActionHandler, [{
        key: 'clearListeners',
        value: function clearListeners() {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.actionDisposers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var disposer = _step.value;

                    disposer();
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

            this.actionDisposers.length = 0;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.clearListeners();
            _get(RemoteActionHandler.prototype.__proto__ || _Object$getPrototypeOf(RemoteActionHandler.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'updateActions',
        value: function updateActions() {
            var _this2 = this;

            this.clearListeners();

            var _loop = function _loop(action) {
                _this2.actionDisposers.push(registerActionListener(_this2.viewer.element, action, function () {
                    return _this2.handleAction(action);
                }));
            };

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.actionSet.value), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var action = _step2.value;

                    _loop(action);
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
        }
    }, {
        key: 'handleAction',
        value: function handleAction(action) {
            var _viewer = this.viewer,
                mouseState = _viewer.mouseState,
                layerSelectedValues = _viewer.layerSelectedValues;

            var actionState = {};
            if (mouseState.updateUnconditionally()) {
                actionState.mouseSpatialCoordinates = Array.prototype.slice.call(mouseState.position);
                var voxelSize = this.viewer.navigationState.voxelSize;

                if (voxelSize.valid) {
                    actionState.mouseVoxelCoordinates = Array.prototype.slice.call(vec3.divide(vec3.create(), mouseState.position, voxelSize.size));
                }
            }
            actionState.selectedValues = layerSelectedValues;
            actionState.viewerState = getCachedJson(this.viewer.state).value;
            this.sendActionRequested.dispatch(action, JSON.parse(_JSON$stringify(actionState)));
        }
    }]);

    return RemoteActionHandler;
}(RefCounted);
//# sourceMappingURL=remote_actions.js.map