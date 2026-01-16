import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
 * @file Facility for updating an EventActionMap based on a JSON representation.
 */
import { verifyObject, verifyString } from '../util/json';
import { NullarySignal } from '../util/signal';
import { EventActionMap } from '../util/event_action_map';
export var TrackableBasedEventActionMap = function () {
    function TrackableBasedEventActionMap() {
        _classCallCheck(this, TrackableBasedEventActionMap);

        this.eventActionMap = new EventActionMap();
        this.changed = new NullarySignal();
    }

    _createClass(TrackableBasedEventActionMap, [{
        key: 'reset',
        value: function reset() {
            this.eventActionMap.clear();
            this.changed.dispatch();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            verifyObject(obj);
            var eventActionMap = this.eventActionMap;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(_Object$keys(obj)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var key = _step.value;

                    var action = verifyString(obj[key]);
                    eventActionMap.set(key, action);
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

            this.changed.dispatch();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var result = {};
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.eventActionMap.bindings), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _ref = _step2.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var key = _ref2[0];
                    var eventAction = _ref2[1];

                    result[key] = eventAction.action;
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

            return result;
        }
    }]);

    return TrackableBasedEventActionMap;
}();
//# sourceMappingURL=event_action_map.js.map