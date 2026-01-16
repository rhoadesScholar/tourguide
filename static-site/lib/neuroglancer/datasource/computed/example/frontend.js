import _Promise from "babel-runtime/core-js/promise";
import _objectDestructuringEmpty from "babel-runtime/helpers/objectDestructuringEmpty";
import _createClass from "babel-runtime/helpers/createClass";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
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
import { EXAMPLE_COMPUTATION_RPC_ID } from "./base";
import { VolumeComputationFrontend } from "../frontend";
import { verify3dVec } from "../../../util/json";
import { registerSharedObjectOwner } from "../../../worker_rpc";
var ExampleComputation = function (_VolumeComputationFro) {
    _inherits(ExampleComputation, _VolumeComputationFro);

    function ExampleComputation() {
        _classCallCheck(this, ExampleComputation);

        return _possibleConstructorReturn(this, (ExampleComputation.__proto__ || _Object$getPrototypeOf(ExampleComputation)).apply(this, arguments));
    }

    return ExampleComputation;
}(VolumeComputationFrontend);
ExampleComputation = __decorate([registerSharedObjectOwner(EXAMPLE_COMPUTATION_RPC_ID)], ExampleComputation);
export { ExampleComputation };
export var ExampleComputationProvider = function () {
    function ExampleComputationProvider() {
        _classCallCheck(this, ExampleComputationProvider);
    }

    _createClass(ExampleComputationProvider, [{
        key: "getComputation",
        value: function getComputation(config, _ref, params) {
            _objectDestructuringEmpty(_ref);

            var computeParams = params.computationParameters;
            if (config['inputSize'] !== undefined) {
                var inputSize = verify3dVec(config['inputSize']);
                computeParams.inputSpec.size.set(inputSize);
            }
            if (config['outputSize'] !== undefined) {
                var outputSize = verify3dVec(config['outputSize']);
                computeParams.outputSpec.size.set(outputSize);
            }
            return _Promise.resolve(new ExampleComputation(computeParams));
        }
    }]);

    return ExampleComputationProvider;
}();
//# sourceMappingURL=frontend.js.map