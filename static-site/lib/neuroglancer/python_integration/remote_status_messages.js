import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Object$keys from 'babel-runtime/core-js/object/keys';
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
/**
 * @file Facility for displaying remote status messages.
 */
import debounce from 'lodash/debounce';
import { StatusMessage } from '../status';
import { NullarySignal } from '../util/signal';
import { RefCounted } from '../util/disposable';
import { verifyObject, verifyString } from '../util/json';
export var TrackableBasedStatusMessages = function (_RefCounted) {
    _inherits(TrackableBasedStatusMessages, _RefCounted);

    function TrackableBasedStatusMessages() {
        _classCallCheck(this, TrackableBasedStatusMessages);

        var _this = _possibleConstructorReturn(this, (TrackableBasedStatusMessages.__proto__ || _Object$getPrototypeOf(TrackableBasedStatusMessages)).call(this));

        _this.existingMessages = new _Map();
        _this.changed = new NullarySignal();
        _this.messages = new _Map();
        _this.changed.add(_this.registerCancellable(debounce(function () {
            return _this.updateMessages();
        }, 0)));
        return _this;
    }

    _createClass(TrackableBasedStatusMessages, [{
        key: 'reset',
        value: function reset() {
            this.messages.clear();
            this.changed.dispatch();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            verifyObject(obj);
            this.messages.clear();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(_Object$keys(obj)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var key = _step.value;

                    var value = obj[key];
                    var text = verifyString(value);
                    this.messages.set(key, text);
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
        key: 'disposed',
        value: function disposed() {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.existingMessages.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var message = _step2.value;

                    message.dispose();
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

            this.existingMessages.clear();
        }
    }, {
        key: 'updateMessages',
        value: function updateMessages() {
            var existingMessages = this.existingMessages;

            var newMessages = this.messages;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(existingMessages), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _ref = _step3.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var key = _ref2[0];
                    var existingMessage = _ref2[1];

                    var newMessage = newMessages.get(key);
                    if (newMessage === undefined) {
                        existingMessage.dispose();
                        existingMessages.delete(key);
                    } else {
                        existingMessage.setText(newMessage);
                    }
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

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(newMessages), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _ref3 = _step4.value;

                    var _ref4 = _slicedToArray(_ref3, 2);

                    var _key = _ref4[0];
                    var newMessage = _ref4[1];

                    if (existingMessages.has(_key)) {
                        // Already handled by previous loop.
                        continue;
                    }
                    var _existingMessage = new StatusMessage();
                    _existingMessage.setText(newMessage);
                    existingMessages.set(_key, _existingMessage);
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var result = {};
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(this.messages), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _ref5 = _step5.value;

                    var _ref6 = _slicedToArray(_ref5, 2);

                    var key = _ref6[0];
                    var value = _ref6[1];

                    result[key] = value;
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            return result;
        }
    }]);

    return TrackableBasedStatusMessages;
}(RefCounted);
//# sourceMappingURL=remote_status_messages.js.map