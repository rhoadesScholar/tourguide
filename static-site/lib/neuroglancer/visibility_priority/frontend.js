import _get from 'babel-runtime/helpers/get';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
import { SharedWatchableValue } from '../shared_watchable_value';
import { WatchableValue } from '../trackable_value';
export var WatchableVisibilityPriority = function (_WatchableValue) {
    _inherits(WatchableVisibilityPriority, _WatchableValue);

    function WatchableVisibilityPriority() {
        var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Number.NEGATIVE_INFINITY;

        _classCallCheck(this, WatchableVisibilityPriority);

        return _possibleConstructorReturn(this, (WatchableVisibilityPriority.__proto__ || _Object$getPrototypeOf(WatchableVisibilityPriority)).call(this, value));
    }

    _createClass(WatchableVisibilityPriority, [{
        key: 'visible',
        get: function get() {
            return this.value === Number.POSITIVE_INFINITY;
        }
    }, {
        key: 'ignored',
        get: function get() {
            return this.value === Number.NEGATIVE_INFINITY;
        }
    }]);

    return WatchableVisibilityPriority;
}(WatchableValue);
WatchableVisibilityPriority.VISIBLE = Number.POSITIVE_INFINITY;
WatchableVisibilityPriority.IGNORED = Number.NEGATIVE_INFINITY;
/**
 * Maintains the maximum value of multiple WatchableVisibilityPriority values.
 */
export var VisibilityPriorityAggregator = function (_WatchableVisibilityP) {
    _inherits(VisibilityPriorityAggregator, _WatchableVisibilityP);

    function VisibilityPriorityAggregator() {
        _classCallCheck(this, VisibilityPriorityAggregator);

        var _this2 = _possibleConstructorReturn(this, (VisibilityPriorityAggregator.__proto__ || _Object$getPrototypeOf(VisibilityPriorityAggregator)).apply(this, arguments));

        _this2.contributors = new _Map();
        return _this2;
    }
    /**
     * Registers `x` to be included in the set of values to be aggregated.
     *
     * @returns A disposer function that unregisters the specified value.
     */


    _createClass(VisibilityPriorityAggregator, [{
        key: 'add',
        value: function add(x) {
            var _this3 = this;

            var contributors = this.contributors;

            var changedDisposer = x.changed.add(function () {
                _this3.update();
            });
            var disposer = function disposer() {
                contributors.delete(disposer);
                changedDisposer();
                _this3.update();
            };
            contributors.set(disposer, x);
            this.update();
            return disposer;
        }
    }, {
        key: 'update',
        value: function update() {
            var priority = Number.NEGATIVE_INFINITY;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.contributors.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var x = _step.value;

                    priority = Math.max(priority, x.value);
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

            this.value = priority;
        }
    }]);

    return VisibilityPriorityAggregator;
}(WatchableVisibilityPriority);
/**
 * Mixin that adds a `visibility` property which is shared with the counterpart.
 */
export function withSharedVisibility(Base) {
    return function (_Base) {
        _inherits(_class, _Base);

        function _class() {
            _classCallCheck(this, _class);

            var _this4 = _possibleConstructorReturn(this, (_class.__proto__ || _Object$getPrototypeOf(_class)).apply(this, arguments));

            _this4.visibility = new VisibilityPriorityAggregator();
            return _this4;
        }

        _createClass(_class, [{
            key: 'initializeCounterpart',
            value: function initializeCounterpart(rpc) {
                var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                // Backend doesn't need to own a reference to SharedWatchableValue because frontend, which is
                // the owner of this SharedObject, owns a reference.
                options['visibility'] = this.registerDisposer(SharedWatchableValue.makeFromExisting(rpc, this.visibility)).rpcId;
                _get(_class.prototype.__proto__ || _Object$getPrototypeOf(_class.prototype), 'initializeCounterpart', this).call(this, rpc, options);
            }
        }]);

        return _class;
    }(Base);
}
//# sourceMappingURL=frontend.js.map