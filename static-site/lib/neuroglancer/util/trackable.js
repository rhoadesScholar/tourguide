import _WeakMap from 'babel-runtime/core-js/weak-map';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
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
/**
 * @file Defines a generic interface for a simple state tracking mechanism.
 */
import { RefCounted } from './disposable';
import { verifyObject } from './json';
import { NullarySignal } from './signal';
export var CompoundTrackable = function (_RefCounted) {
    _inherits(CompoundTrackable, _RefCounted);

    function CompoundTrackable() {
        _classCallCheck(this, CompoundTrackable);

        var _this = _possibleConstructorReturn(this, (CompoundTrackable.__proto__ || _Object$getPrototypeOf(CompoundTrackable)).apply(this, arguments));

        _this.children = new _Map();
        _this.changed = new NullarySignal();
        return _this;
    }

    _createClass(CompoundTrackable, [{
        key: 'add',
        value: function add(key, value) {
            var _this2 = this;

            var children = this.children;

            if (children.has(key)) {
                throw new Error('Key ' + _JSON$stringify(key) + ' already registered.');
            }
            this.children.set(key, value);
            value.changed.add(this.changed.dispatch);
            this.changed.dispatch();
            return function () {
                _this2.remove(key);
            };
        }
    }, {
        key: 'remove',
        value: function remove(key) {
            var children = this.children;

            if (children.has(key)) {
                throw new Error('Key ' + _JSON$stringify(key) + ' not registered.');
            }
            var value = children.get(key);
            this.children.delete(key);
            value.changed.remove(this.changed.dispatch);
            this.changed.dispatch();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var changed = this.changed;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.children.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var value = _step.value;

                    value.changed.remove(changed.dispatch);
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

            this.children = undefined;
            _get(CompoundTrackable.prototype.__proto__ || _Object$getPrototypeOf(CompoundTrackable.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var result = this.baseJSON();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.children), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _ref = _step2.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var key = _ref2[0];
                    var value = _ref2[1];

                    result[key] = value.toJSON();
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
    }, {
        key: 'baseJSON',
        value: function baseJSON() {
            return {};
        }
    }, {
        key: 'reset',
        value: function reset() {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(this.children.values()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var value = _step3.value;

                    value.reset();
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
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            verifyObject(x);
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(this.children), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _ref3 = _step4.value;

                    var _ref4 = _slicedToArray(_ref3, 2);

                    var key = _ref4[0];
                    var value = _ref4[1];

                    try {
                        if (x.hasOwnProperty(key)) {
                            var subValue = x[key];
                            if (subValue === undefined) {
                                continue;
                            }
                            value.restoreState(subValue);
                        }
                    } catch (restoreError) {
                        throw new Error('Error restoring property ' + _JSON$stringify(key) + ': ' + restoreError.message);
                    }
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
    }]);

    return CompoundTrackable;
}(RefCounted);
export var PersistentCompoundTrackable = function (_CompoundTrackable) {
    _inherits(PersistentCompoundTrackable, _CompoundTrackable);

    function PersistentCompoundTrackable() {
        _classCallCheck(this, PersistentCompoundTrackable);

        var _this3 = _possibleConstructorReturn(this, (PersistentCompoundTrackable.__proto__ || _Object$getPrototypeOf(PersistentCompoundTrackable)).apply(this, arguments));

        _this3.lastState = {};
        return _this3;
    }

    _createClass(PersistentCompoundTrackable, [{
        key: 'restoreState',
        value: function restoreState(x) {
            verifyObject(x);
            this.lastState = x;
            _get(PersistentCompoundTrackable.prototype.__proto__ || _Object$getPrototypeOf(PersistentCompoundTrackable.prototype), 'restoreState', this).call(this, x);
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.lastState = {};
            _get(PersistentCompoundTrackable.prototype.__proto__ || _Object$getPrototypeOf(PersistentCompoundTrackable.prototype), 'reset', this).call(this);
        }
    }, {
        key: 'baseJSON',
        value: function baseJSON() {
            var result = _Object$assign(_get(PersistentCompoundTrackable.prototype.__proto__ || _Object$getPrototypeOf(PersistentCompoundTrackable.prototype), 'baseJSON', this).call(this), this.lastState);
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(this.children.keys()), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var key = _step5.value;

                    delete result[key];
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
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var result = _get(PersistentCompoundTrackable.prototype.__proto__ || _Object$getPrototypeOf(PersistentCompoundTrackable.prototype), 'toJSON', this).call(this);
            this.lastState = result;
            return result;
        }
    }, {
        key: 'add',
        value: function add(key, value) {
            var result = _get(PersistentCompoundTrackable.prototype.__proto__ || _Object$getPrototypeOf(PersistentCompoundTrackable.prototype), 'add', this).call(this, key, value);
            var existingValue = this.lastState[key];
            if (existingValue !== undefined) {
                value.reset();
                value.restoreState(existingValue);
            }
            return result;
        }
    }]);

    return PersistentCompoundTrackable;
}(CompoundTrackable);
/**
 * Cache used by getCachedJson.
 */
var jsonCache = new _WeakMap();
/**
 * Returns a JSON representation of a Trackable object.
 *
 * Recursively caches the result, such that it is only necessary to traverse the changed portions of
 * the object.
 *
 * The returned value must not be modified.
 */
export function getCachedJson(root) {
    var cacheState = jsonCache.get(root);
    var generation = root.changed.count;
    if (cacheState !== undefined) {
        if (cacheState.generation === generation) {
            return cacheState;
        }
    }
    var value = void 0;
    if (root instanceof CompoundTrackable) {
        value = root.baseJSON();
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
            for (var _iterator6 = _getIterator(root.children), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var _ref5 = _step6.value;

                var _ref6 = _slicedToArray(_ref5, 2);

                var k = _ref6[0];
                var v = _ref6[1];

                value[k] = getCachedJson(v).value;
            }
        } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion6 && _iterator6.return) {
                    _iterator6.return();
                }
            } finally {
                if (_didIteratorError6) {
                    throw _iteratorError6;
                }
            }
        }
    } else {
        value = root.toJSON();
    }
    if (cacheState === undefined) {
        cacheState = { generation: generation, value: value };
        jsonCache.set(root, cacheState);
    } else {
        cacheState.generation = generation;
        cacheState.value = value;
    }
    return cacheState;
}
//# sourceMappingURL=trackable.js.map