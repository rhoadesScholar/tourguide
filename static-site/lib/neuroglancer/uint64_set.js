import _getIterator from "babel-runtime/core-js/get-iterator";
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
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
var Uint64Set_1;
import { HashSetUint64 } from "./gpu_hash/hash_table";
import { Signal } from "./util/signal";
import { registerRPC, registerSharedObject, SharedObjectCounterpart } from "./worker_rpc";
var Uint64Set = Uint64Set_1 = function (_SharedObjectCounterp) {
    _inherits(Uint64Set, _SharedObjectCounterp);

    function Uint64Set() {
        _classCallCheck(this, Uint64Set);

        var _this = _possibleConstructorReturn(this, (Uint64Set.__proto__ || _Object$getPrototypeOf(Uint64Set)).apply(this, arguments));

        _this.hashTable = new HashSetUint64();
        _this.changed = new Signal();
        return _this;
    }

    _createClass(Uint64Set, [{
        key: "disposed",
        value: function disposed() {
            _get(Uint64Set.prototype.__proto__ || _Object$getPrototypeOf(Uint64Set.prototype), "disposed", this).call(this);
            this.hashTable = undefined;
            this.changed = undefined;
        }
    }, {
        key: "add_",
        value: function add_(x) {
            return this.hashTable.add(x);
        }
    }, {
        key: "add",
        value: function add(x) {
            if (this.add_(x)) {
                var rpc = this.rpc;

                if (rpc) {
                    rpc.invoke('Uint64Set.add', { 'id': this.rpcId, 'value': x });
                }
                this.changed.dispatch(x, true);
            }
        }
    }, {
        key: "has",
        value: function has(x) {
            return this.hashTable.has(x);
        }
    }, {
        key: _Symbol$iterator,
        value: function value() {
            return this.hashTable.keys();
        }
    }, {
        key: "delete_",
        value: function delete_(x) {
            return this.hashTable.delete(x);
        }
    }, {
        key: "delete",
        value: function _delete(x) {
            if (this.delete_(x)) {
                var rpc = this.rpc;

                if (rpc) {
                    rpc.invoke('Uint64Set.delete', { 'id': this.rpcId, 'value': x });
                }
                this.changed.dispatch(x, false);
            }
        }
    }, {
        key: "clear",
        value: function clear() {
            if (this.hashTable.clear()) {
                var rpc = this.rpc;

                if (rpc) {
                    rpc.invoke('Uint64Set.clear', { 'id': this.rpcId });
                }
                this.changed.dispatch(null, false);
            }
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            var result = new Array();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var id = _step.value;

                    result.push(id.toString());
                }
                // Need to sort entries, otherwise serialization changes every time.
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

            result.sort();
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
            var obj = new Uint64Set_1();
            obj.initializeCounterpart(rpc);
            return obj;
        }
    }]);

    return Uint64Set;
}(SharedObjectCounterpart);
Uint64Set = Uint64Set_1 = __decorate([registerSharedObject('Uint64Set')], Uint64Set);
export { Uint64Set };
registerRPC('Uint64Set.add', function (x) {
    var obj = this.get(x['id']);
    if (obj.add_(x['value'])) {
        obj.changed.dispatch();
    }
});
registerRPC('Uint64Set.delete', function (x) {
    var obj = this.get(x['id']);
    if (obj.delete_(x['value'])) {
        obj.changed.dispatch();
    }
});
registerRPC('Uint64Set.clear', function (x) {
    var obj = this.get(x['id']);
    if (obj.hashTable.clear()) {
        obj.changed.dispatch();
    }
});
//# sourceMappingURL=uint64_set.js.map