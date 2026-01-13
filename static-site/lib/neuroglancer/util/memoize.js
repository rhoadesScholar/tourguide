import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _Map from 'babel-runtime/core-js/map';
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
import { RefCountedValue } from './disposable';
import { stableStringify } from './json';
export var Memoize = function () {
    function Memoize() {
        _classCallCheck(this, Memoize);

        this.map = new _Map();
    }
    /**
     * If getter throws an exception, no value is added.
     */


    _createClass(Memoize, [{
        key: 'get',
        value: function get(key, getter) {
            var map = this.map;

            var obj = map.get(key);
            if (obj === undefined) {
                obj = getter();
                obj.registerDisposer(function () {
                    if (map.get(key) == obj) {
                        //make sure it has not been removed from the map
                        map.delete(key);
                    }
                });
                map.set(key, obj);
            } else {
                obj.addRef();
            }
            return obj;
        }
    }, {
        key: 'forget',
        value: function forget(key) {
            var map = this.map;

            var obj = map.get(key);
            if (obj) {
                map.delete(key);
            }
        }
    }]);

    return Memoize;
}();
export var StringMemoize = function (_Memoize) {
    _inherits(StringMemoize, _Memoize);

    function StringMemoize() {
        _classCallCheck(this, StringMemoize);

        return _possibleConstructorReturn(this, (StringMemoize.__proto__ || _Object$getPrototypeOf(StringMemoize)).apply(this, arguments));
    }

    _createClass(StringMemoize, [{
        key: 'get',
        value: function get(x, getter) {
            if (typeof x !== 'string') {
                x = stableStringify(x);
            }
            return _get(StringMemoize.prototype.__proto__ || _Object$getPrototypeOf(StringMemoize.prototype), 'get', this).call(this, x, getter);
        }
    }, {
        key: 'getUncounted',
        value: function getUncounted(x, getter) {
            return this.get(x, function () {
                return new RefCountedValue(getter());
            }).value;
        }
    }, {
        key: 'forget',
        value: function forget(x) {
            if (typeof x !== 'string') {
                x = stableStringify(x);
            }
            _get(StringMemoize.prototype.__proto__ || _Object$getPrototypeOf(StringMemoize.prototype), 'forget', this).call(this, x);
        }
    }]);

    return StringMemoize;
}(Memoize);
//# sourceMappingURL=memoize.js.map