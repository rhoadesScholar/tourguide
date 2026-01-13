import _Symbol$iterator from 'babel-runtime/core-js/symbol/iterator';
import _Set from 'babel-runtime/core-js/set';
import _get from 'babel-runtime/helpers/get';
import _toConsumableArray from 'babel-runtime/helpers/toConsumableArray';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
import debounce from 'lodash/debounce';
import { RefCounted } from './util/disposable';
import { NullarySignal } from './util/signal';
export var WatchableValue = function () {
    function WatchableValue(value_) {
        _classCallCheck(this, WatchableValue);

        this.value_ = value_;
        this.changed = new NullarySignal();
    }

    _createClass(WatchableValue, [{
        key: 'value',
        get: function get() {
            return this.value_;
        },
        set: function set(newValue) {
            if (newValue !== this.value_) {
                this.value_ = newValue;
                this.changed.dispatch();
            }
        }
    }]);

    return WatchableValue;
}();
export var TrackableValue = function (_WatchableValue) {
    _inherits(TrackableValue, _WatchableValue);

    function TrackableValue(value, validator) {
        var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : value;

        _classCallCheck(this, TrackableValue);

        var _this = _possibleConstructorReturn(this, (TrackableValue.__proto__ || _Object$getPrototypeOf(TrackableValue)).call(this, value));

        _this.validator = validator;
        _this.defaultValue = defaultValue;
        return _this;
    }

    _createClass(TrackableValue, [{
        key: 'toJSON',
        value: function toJSON() {
            var value_ = this.value_;

            if (value_ === this.defaultValue) {
                return undefined;
            }
            return this.value_;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.value = this.defaultValue;
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            if (x !== undefined) {
                var validator = this.validator;

                try {
                    this.value = validator(x);
                    return;
                } catch (ignoredError) {}
            }
            this.value = this.defaultValue;
        }
    }]);

    return TrackableValue;
}(WatchableValue);

var DerivedWatchableValue = function (_RefCounted) {
    _inherits(DerivedWatchableValue, _RefCounted);

    function DerivedWatchableValue(f, ws) {
        _classCallCheck(this, DerivedWatchableValue);

        var _this2 = _possibleConstructorReturn(this, (DerivedWatchableValue.__proto__ || _Object$getPrototypeOf(DerivedWatchableValue)).call(this));

        _this2.changed = new NullarySignal();
        _this2.f = f;
        _this2.ws = ws;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(ws), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var w = _step.value;

                _this2.registerDisposer(w.changed.add(_this2.changed.dispatch));
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

        return _this2;
    }

    _createClass(DerivedWatchableValue, [{
        key: 'value',
        get: function get() {
            return this.f.apply(this, _toConsumableArray(this.ws.map(function (w) {
                return w.value;
            })));
        }
    }]);

    return DerivedWatchableValue;
}(RefCounted);

export function makeDerivedWatchableValue(f) {
    for (var _len = arguments.length, ws = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        ws[_key - 1] = arguments[_key];
    }

    return new DerivedWatchableValue(f, ws);
}
export var ComputedWatchableValue = function (_RefCounted2) {
    _inherits(ComputedWatchableValue, _RefCounted2);

    function ComputedWatchableValue(f) {
        _classCallCheck(this, ComputedWatchableValue);

        var _this3 = _possibleConstructorReturn(this, (ComputedWatchableValue.__proto__ || _Object$getPrototypeOf(ComputedWatchableValue)).call(this));

        _this3.f = f;
        _this3.changed = new NullarySignal();

        for (var _len2 = arguments.length, signals = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            signals[_key2 - 1] = arguments[_key2];
        }

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = _getIterator(signals), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var signal = _step2.value;

                _this3.registerDisposer(signal.add(_this3.changed.dispatch));
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

        return _this3;
    }

    _createClass(ComputedWatchableValue, [{
        key: 'value',
        get: function get() {
            return this.f();
        }
    }]);

    return ComputedWatchableValue;
}(RefCounted);
export var WatchableRefCounted = function (_RefCounted3) {
    _inherits(WatchableRefCounted, _RefCounted3);

    function WatchableRefCounted() {
        _classCallCheck(this, WatchableRefCounted);

        var _this4 = _possibleConstructorReturn(this, (WatchableRefCounted.__proto__ || _Object$getPrototypeOf(WatchableRefCounted)).apply(this, arguments));

        _this4.changed = new NullarySignal();
        return _this4;
    }

    _createClass(WatchableRefCounted, [{
        key: 'reset',
        value: function reset() {
            this.value = undefined;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            if (this.value_ !== undefined) {
                this.value_.unregisterDisposer(this.valueHandler);
                this.value_.dispose();
            }
            this.value_ = undefined;
            _get(WatchableRefCounted.prototype.__proto__ || _Object$getPrototypeOf(WatchableRefCounted.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'value',
        get: function get() {
            return this.value_;
        },
        set: function set(value) {
            var _this5 = this;

            var value_ = this.value_;

            this.value_ = value;
            if (value_ !== undefined) {
                value_.dispose();
                value_.unregisterDisposer(this.valueHandler);
                this.valueHandler = undefined;
            }
            if (value !== undefined) {
                var valueHandler = this.valueHandler = function () {
                    if (_this5.value_ === value) {
                        _this5.value_ = undefined;
                        _this5.changed.dispatch();
                    }
                };
                value.registerDisposer(valueHandler);
            }
            if (value !== value_) {
                this.changed.dispatch();
            }
        }
    }]);

    return WatchableRefCounted;
}(RefCounted);
export var TrackableRefCounted = function (_WatchableRefCounted) {
    _inherits(TrackableRefCounted, _WatchableRefCounted);

    function TrackableRefCounted(validator, jsonConverter) {
        _classCallCheck(this, TrackableRefCounted);

        var _this6 = _possibleConstructorReturn(this, (TrackableRefCounted.__proto__ || _Object$getPrototypeOf(TrackableRefCounted)).call(this));

        _this6.validator = validator;
        _this6.jsonConverter = jsonConverter;
        return _this6;
    }

    _createClass(TrackableRefCounted, [{
        key: 'toJSON',
        value: function toJSON() {
            var value = this.value;

            return value && this.jsonConverter(value);
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            this.value = this.validator(x);
        }
    }]);

    return TrackableRefCounted;
}(WatchableRefCounted);
export var WatchableSet = function () {
    function WatchableSet(values) {
        _classCallCheck(this, WatchableSet);

        this.changed = new NullarySignal();
        if (values === undefined) {
            this.values = new _Set();
        } else {
            this.values = new _Set(values);
        }
    }

    _createClass(WatchableSet, [{
        key: 'add',
        value: function add(x) {
            var values = this.values;

            if (!values.has(x)) {
                values.add(x);
                this.changed.dispatch();
            }
            return this;
        }
    }, {
        key: 'delete',
        value: function _delete(x) {
            var values = this.values;

            if (values.delete(x)) {
                this.changed.dispatch();
                return true;
            }
            return false;
        }
    }, {
        key: 'has',
        value: function has(x) {
            return this.values.has(x);
        }
    }, {
        key: _Symbol$iterator,
        value: function value() {
            return _getIterator(this.values);
        }
    }, {
        key: 'clear',
        value: function clear() {
            var values = this.values;

            if (values.size > 0) {
                values.clear();
                this.changed.dispatch();
            }
        }
    }, {
        key: 'size',
        get: function get() {
            return this.values.size;
        }
    }]);

    return WatchableSet;
}();
export function registerNested(baseState, f) {
    var value = void 0;
    var context = void 0;
    function updateValue() {
        value = baseState.value;
        context = new RefCounted();
        f(context, value);
    }
    var handleChange = debounce(function () {
        if (baseState.value !== value) {
            context.dispose();
            updateValue();
        }
    }, 0);
    var signalDisposer = baseState.changed.add(handleChange);
    updateValue();
    return function () {
        handleChange.cancel();
        signalDisposer();
        context.dispose();
    };
}
//# sourceMappingURL=trackable_value.js.map