import _getIterator from "babel-runtime/core-js/get-iterator";
import _slicedToArray from "babel-runtime/helpers/slicedToArray";
import _Symbol$iterator from "babel-runtime/core-js/symbol/iterator";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _get from "babel-runtime/helpers/get";
import _inherits from "babel-runtime/helpers/inherits";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
/**
 * @license
 * This work is a derivative of the Google Neuroglancer project,
 * Copyright 2016 Google Inc.
 * The Derivative Work is covered by
 * Copyright 2019 Howard Hughes Medical Institute
 *
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
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
var Uint64Map_1;
import { HashMapUint64 } from "./gpu_hash/hash_table";
import { Signal } from "./util/signal";
import { registerRPC, registerSharedObject, SharedObjectCounterpart } from "./worker_rpc";
var Uint64Map = Uint64Map_1 = function (_SharedObjectCounterp) {
    _inherits(Uint64Map, _SharedObjectCounterp);

    function Uint64Map() {
        _classCallCheck(this, Uint64Map);

        var _this = _possibleConstructorReturn(this, (Uint64Map.__proto__ || _Object$getPrototypeOf(Uint64Map)).apply(this, arguments));

        _this.hashTable = new HashMapUint64();
        _this.changed = new Signal();
        return _this;
    }

    _createClass(Uint64Map, [{
        key: "disposed",
        value: function disposed() {
            _get(Uint64Map.prototype.__proto__ || _Object$getPrototypeOf(Uint64Map.prototype), "disposed", this).call(this);
            this.hashTable = undefined;
            this.changed = undefined;
        }
    }, {
        key: "set_",
        value: function set_(key, value) {
            return this.hashTable.set(key, value);
        }
    }, {
        key: "set",
        value: function set(key, value) {
            if (this.set_(key, value)) {
                var rpc = this.rpc;

                if (rpc) {
                    rpc.invoke('Uint64Map.set', { 'id': this.rpcId, 'key': key, 'value': value });
                }
                this.changed.dispatch(key, true);
            }
        }
    }, {
        key: "has",
        value: function has(key) {
            return this.hashTable.has(key);
        }
    }, {
        key: "get",
        value: function get(key, value) {
            return this.hashTable.get(key, value);
        }
    }, {
        key: _Symbol$iterator,
        value: function value() {
            return this.hashTable.entries();
        }
    }, {
        key: "delete_",
        value: function delete_(key) {
            return this.hashTable.delete(key);
        }
    }, {
        key: "delete",
        value: function _delete(key) {
            if (this.delete_(key)) {
                var rpc = this.rpc;

                if (rpc) {
                    rpc.invoke('Uint64Map.delete', { 'id': this.rpcId, 'key': key });
                }
                this.changed.dispatch(key, false);
            }
        }
    }, {
        key: "clear",
        value: function clear() {
            if (this.hashTable.clear()) {
                var rpc = this.rpc;

                if (rpc) {
                    rpc.invoke('Uint64Map.clear', { 'id': this.rpcId });
                }
                this.changed.dispatch(null, false);
            }
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            var result = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.hashTable.entries()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref = _step.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var key = _ref2[0];
                    var value = _ref2[1];

                    result[key.toString()] = value.toString();
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

            return result;
        }
    }, {
        key: "size",
        get: function get() {
            return this.hashTable.size;
        }
    }], [{
        key: "makeWithCounterpart",
        value: function makeWithCounterpart(rpc) {
            var obj = new Uint64Map_1();
            obj.initializeCounterpart(rpc);
            return obj;
        }
    }]);

    return Uint64Map;
}(SharedObjectCounterpart);
Uint64Map = Uint64Map_1 = __decorate([registerSharedObject('Uint64Map')], Uint64Map);
export { Uint64Map };
registerRPC('Uint64Map.set', function (x) {
    var obj = this.get(x['id']);
    if (obj.set_(x['key'], x['value'])) {
        obj.changed.dispatch();
    }
});
registerRPC('Uint64Map.delete', function (x) {
    var obj = this.get(x['id']);
    if (obj.delete_(x['key'])) {
        obj.changed.dispatch();
    }
});
registerRPC('Uint64Map.clear', function (x) {
    var obj = this.get(x['id']);
    if (obj.hashTable.clear()) {
        obj.changed.dispatch();
    }
});
//# sourceMappingURL=uint64_map.js.map