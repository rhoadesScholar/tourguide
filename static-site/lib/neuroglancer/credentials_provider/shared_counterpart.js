import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
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
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
/**
 * @file Defines a CredentialsProvider that forwards requests to a SharedCredentialsProvider on
 * another thread.
 */
import { makeCachedCredentialsGetter } from "./index";
import { CREDENTIALS_PROVIDER_GET_RPC_ID, CREDENTIALS_PROVIDER_RPC_ID } from "./shared_common";
import { registerSharedObject, SharedObjectCounterpart } from "../worker_rpc";
var SharedCredentialsProviderCounterpart = function (_SharedObjectCounterp) {
    _inherits(SharedCredentialsProviderCounterpart, _SharedObjectCounterp);

    function SharedCredentialsProviderCounterpart() {
        _classCallCheck(this, SharedCredentialsProviderCounterpart);

        var _this = _possibleConstructorReturn(this, (SharedCredentialsProviderCounterpart.__proto__ || _Object$getPrototypeOf(SharedCredentialsProviderCounterpart)).apply(this, arguments));

        _this.get = makeCachedCredentialsGetter(function (invalidCredentials, cancellationToken) {
            return _this.rpc.promiseInvoke(CREDENTIALS_PROVIDER_GET_RPC_ID, { providerId: _this.rpcId, invalidCredentials: invalidCredentials }, cancellationToken);
        });
        return _this;
    }

    return SharedCredentialsProviderCounterpart;
}(SharedObjectCounterpart);
SharedCredentialsProviderCounterpart = __decorate([registerSharedObject(CREDENTIALS_PROVIDER_RPC_ID)], SharedCredentialsProviderCounterpart);
export { SharedCredentialsProviderCounterpart };
export function WithSharedCredentialsProviderCounterpart() {
    return function (Base) {
        return function (_Base) {
            _inherits(_class, _Base);

            function _class() {
                var _ref;

                _classCallCheck(this, _class);

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                var _this2 = _possibleConstructorReturn(this, (_ref = _class.__proto__ || _Object$getPrototypeOf(_class)).call.apply(_ref, [this].concat(args)));

                var options = args[1];
                _this2.credentialsProvider = _this2.rpc.getRef(options['credentialsProvider']);
                return _this2;
            }

            return _class;
        }(Base);
    };
}
//# sourceMappingURL=shared_counterpart.js.map