import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
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
 * @file Permits a CredentialsProvider to be shared with another thread.
 */
import { CREDENTIALS_PROVIDER_RPC_ID, CREDENTIALS_PROVIDER_GET_RPC_ID } from "./shared_common";
import { registerPromiseRPC, registerSharedObjectOwner, SharedObject } from "../worker_rpc";
var SharedCredentialsProvider = function (_SharedObject) {
    _inherits(SharedCredentialsProvider, _SharedObject);

    function SharedCredentialsProvider(provider, rpc) {
        _classCallCheck(this, SharedCredentialsProvider);

        var _this = _possibleConstructorReturn(this, (SharedCredentialsProvider.__proto__ || _Object$getPrototypeOf(SharedCredentialsProvider)).call(this));

        _this.provider = provider;
        _this.registerDisposer(provider);
        _this.initializeCounterpart(rpc);
        return _this;
    }

    _createClass(SharedCredentialsProvider, [{
        key: "get",
        value: function get(invalidCredentials, cancellationToken) {
            return this.provider.get(invalidCredentials, cancellationToken);
        }
    }]);

    return SharedCredentialsProvider;
}(SharedObject);
SharedCredentialsProvider = __decorate([registerSharedObjectOwner(CREDENTIALS_PROVIDER_RPC_ID)], SharedCredentialsProvider);
export { SharedCredentialsProvider };
registerPromiseRPC(CREDENTIALS_PROVIDER_GET_RPC_ID, function (x, cancellationToken) {
    var obj = this.get(x.providerId);
    return obj.get(x.invalidCredentials, cancellationToken).then(function (credentials) {
        return {
            value: credentials
        };
    });
});
//# sourceMappingURL=shared.js.map