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
var SharedWatchableValue_1;
/**
 * @file Facility for sharing arbitrary values that support structural cloning between threads.
 */
import { WatchableValue } from "./trackable_value";
import { registerRPC, registerSharedObject, SharedObjectCounterpart } from "./worker_rpc";
var CHANGED_RPC_METHOD_ID = 'SharedWatchableValue.changed';
var SharedWatchableValue = SharedWatchableValue_1 = function (_SharedObjectCounterp) {
    _inherits(SharedWatchableValue, _SharedObjectCounterp);

    function SharedWatchableValue(rpc) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, SharedWatchableValue);

        /**
         * The value is being updated to reflect a remote change.
         * @internal
         */
        var _this = _possibleConstructorReturn(this, (SharedWatchableValue.__proto__ || _Object$getPrototypeOf(SharedWatchableValue)).call(this, rpc, options));

        _this.updatingValue_ = false;
        if (rpc !== undefined) {
            _this.base = new WatchableValue(options['value']);
            _this.setupChangedHandler();
        }
        return _this;
    }

    _createClass(SharedWatchableValue, [{
        key: "initializeCounterpart",
        value: function initializeCounterpart(rpc) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            options['value'] = this.value;
            _get(SharedWatchableValue.prototype.__proto__ || _Object$getPrototypeOf(SharedWatchableValue.prototype), "initializeCounterpart", this).call(this, rpc, options);
        }
    }, {
        key: "setupChangedHandler",
        value: function setupChangedHandler() {
            var _this2 = this;

            this.registerDisposer(this.base.changed.add(function () {
                if (_this2.updatingValue_) {
                    _this2.updatingValue_ = false;
                } else {
                    var rpc = _this2.rpc;

                    if (rpc !== null) {
                        rpc.invoke(CHANGED_RPC_METHOD_ID, { 'id': _this2.rpcId, 'value': _this2.value });
                    }
                }
            }));
        }
    }, {
        key: "value",
        get: function get() {
            return this.base.value;
        },
        set: function set(value) {
            this.base.value = value;
        }
    }, {
        key: "changed",
        get: function get() {
            return this.base.changed;
        }
    }], [{
        key: "makeFromExisting",
        value: function makeFromExisting(rpc, base) {
            var obj = new SharedWatchableValue_1();
            obj.base = base;
            obj.setupChangedHandler();
            obj.initializeCounterpart(rpc);
            return obj;
        }
    }, {
        key: "make",
        value: function make(rpc, value) {
            return SharedWatchableValue_1.makeFromExisting(rpc, new WatchableValue(value));
        }
    }]);

    return SharedWatchableValue;
}(SharedObjectCounterpart);
SharedWatchableValue = SharedWatchableValue_1 = __decorate([registerSharedObject('SharedWatchableValue')], SharedWatchableValue);
export { SharedWatchableValue };
registerRPC(CHANGED_RPC_METHOD_ID, function (x) {
    var obj = this.get(x['id']);
    obj.updatingValue_ = true;
    obj.base.value = x['value'];
    obj.updatingValue_ = false;
});
//# sourceMappingURL=shared_watchable_value.js.map