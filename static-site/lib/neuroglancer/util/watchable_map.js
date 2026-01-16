import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Symbol$iterator from 'babel-runtime/core-js/symbol/iterator';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2018 Google Inc.
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
import { RefCounted } from './disposable';
import { NullarySignal } from './signal';
export var WatchableMap = function (_RefCounted) {
    _inherits(WatchableMap, _RefCounted);

    function WatchableMap(register, unregister, values) {
        _classCallCheck(this, WatchableMap);

        var _this = _possibleConstructorReturn(this, (WatchableMap.__proto__ || _Object$getPrototypeOf(WatchableMap)).call(this));

        _this.register = register;
        _this.unregister = unregister;
        _this.changed = new NullarySignal();
        if (values === undefined) {
            _this.map = new _Map();
        } else {
            _this.map = new _Map(values);
            _this.map.forEach(_this.register);
        }
        return _this;
    }

    _createClass(WatchableMap, [{
        key: 'set',
        value: function set(key, value) {
            var map = this.map;

            var existing = map.get(key);
            if (existing !== undefined) {
                this.unregister(existing, key);
            }
            map.set(key, value);
            this.register(value, key);
            this.changed.dispatch();
            return this;
        }
    }, {
        key: 'delete',
        value: function _delete(key) {
            var map = this.map;

            var existing = map.get(key);
            if (existing !== undefined) {
                this.unregister(existing, key);
                this.changed.dispatch();
                return true;
            }
            return false;
        }
    }, {
        key: 'has',
        value: function has(key) {
            return this.map.has(key);
        }
    }, {
        key: _Symbol$iterator,
        value: function value() {
            return _getIterator(this.map);
        }
    }, {
        key: 'clear',
        value: function clear() {
            var map = this.map;

            if (map.size > 0) {
                map.forEach(this.unregister);
                map.clear();
                this.changed.dispatch();
            }
        }
    }, {
        key: 'values',
        value: function values() {
            return this.map.values();
        }
    }, {
        key: 'keys',
        value: function keys() {
            return this.map.keys();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var map = this.map;

            map.forEach(this.unregister);
            this.map.clear();
            _get(WatchableMap.prototype.__proto__ || _Object$getPrototypeOf(WatchableMap.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'size',
        get: function get() {
            return this.map.size;
        }
    }]);

    return WatchableMap;
}(RefCounted);
//# sourceMappingURL=watchable_map.js.map