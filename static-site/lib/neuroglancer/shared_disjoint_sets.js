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
import { DisjointUint64Sets } from "./util/disjoint_sets";
import { parseArray } from "./util/json";
import { NullarySignal } from "./util/signal";
import { Uint64 } from "./util/uint64";
import { registerRPC, registerSharedObject, SharedObjectCounterpart } from "./worker_rpc";
var RPC_TYPE_ID = 'DisjointUint64Sets';
var ADD_METHOD_ID = 'DisjointUint64Sets.add';
var CLEAR_METHOD_ID = 'DisjointUint64Sets.clear';
var SharedDisjointUint64Sets = function (_SharedObjectCounterp) {
    _inherits(SharedDisjointUint64Sets, _SharedObjectCounterp);

    function SharedDisjointUint64Sets() {
        _classCallCheck(this, SharedDisjointUint64Sets);

        var _this = _possibleConstructorReturn(this, (SharedDisjointUint64Sets.__proto__ || _Object$getPrototypeOf(SharedDisjointUint64Sets)).apply(this, arguments));

        _this.disjointSets = new DisjointUint64Sets();
        _this.changed = new NullarySignal();
        return _this;
    }

    _createClass(SharedDisjointUint64Sets, [{
        key: "disposed",
        value: function disposed() {
            this.disjointSets = undefined;
            this.changed = undefined;
            _get(SharedDisjointUint64Sets.prototype.__proto__ || _Object$getPrototypeOf(SharedDisjointUint64Sets.prototype), "disposed", this).call(this);
        }
    }, {
        key: "link",
        value: function link(a, b) {
            if (this.disjointSets.link(a, b)) {
                var rpc = this.rpc;

                if (rpc) {
                    rpc.invoke(ADD_METHOD_ID, { 'id': this.rpcId, 'al': a.low, 'ah': a.high, 'bl': b.low, 'bh': b.high });
                }
                this.changed.dispatch();
            }
        }
    }, {
        key: "get",
        value: function get(x) {
            return this.disjointSets.get(x);
        }
    }, {
        key: "clear",
        value: function clear() {
            if (this.disjointSets.clear()) {
                var rpc = this.rpc;

                if (rpc) {
                    rpc.invoke(CLEAR_METHOD_ID, { 'id': this.rpcId });
                }
                this.changed.dispatch();
            }
        }
    }, {
        key: "setElements",
        value: function setElements(a) {
            return this.disjointSets.setElements(a);
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            return this.disjointSets.toJSON();
        }
        /**
         * Restores the state from a JSON representation.
         */

    }, {
        key: "restoreState",
        value: function restoreState(obj) {
            var _this2 = this;

            this.clear();
            if (obj !== undefined) {
                var ids = [new Uint64(), new Uint64()];
                parseArray(obj, function (z) {
                    parseArray(z, function (s, index) {
                        ids[index % 2].parseString(String(s), 10);
                        if (index !== 0) {
                            _this2.link(ids[0], ids[1]);
                        }
                    });
                });
            }
        }
    }, {
        key: "size",
        get: function get() {
            return this.disjointSets.size;
        }
    }], [{
        key: "makeWithCounterpart",
        value: function makeWithCounterpart(rpc) {
            var obj = new this();
            obj.initializeCounterpart(rpc);
            return obj;
        }
    }]);

    return SharedDisjointUint64Sets;
}(SharedObjectCounterpart);
SharedDisjointUint64Sets = __decorate([registerSharedObject(RPC_TYPE_ID)], SharedDisjointUint64Sets);
export { SharedDisjointUint64Sets };
var tempA = new Uint64();
var tempB = new Uint64();
registerRPC(ADD_METHOD_ID, function (x) {
    var obj = this.get(x['id']);
    tempA.low = x['al'];
    tempA.high = x['ah'];
    tempB.low = x['bl'];
    tempB.high = x['bh'];
    if (obj.disjointSets.link(tempA, tempB)) {
        obj.changed.dispatch();
    }
});
registerRPC(CLEAR_METHOD_ID, function (x) {
    var obj = this.get(x['id']);
    if (obj.disjointSets.clear()) {
        obj.changed.dispatch();
    }
});
//# sourceMappingURL=shared_disjoint_sets.js.map