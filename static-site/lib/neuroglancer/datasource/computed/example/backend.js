import _Promise from "babel-runtime/core-js/promise";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
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
import { copyBufferOverlap, VolumeComputationBackend } from "../backend";
import { getArrayView } from "../base";
import { EXAMPLE_COMPUTATION_RPC_ID } from "./base";
import { DataType } from "../../../util/data_type";
import { vec3 } from "../../../util/geom";
import { registerSharedObject } from "../../../worker_rpc";
var ExampleComputation = function (_VolumeComputationBac) {
    _inherits(ExampleComputation, _VolumeComputationBac);

    function ExampleComputation() {
        _classCallCheck(this, ExampleComputation);

        return _possibleConstructorReturn(this, (ExampleComputation.__proto__ || _Object$getPrototypeOf(ExampleComputation)).apply(this, arguments));
    }

    _createClass(ExampleComputation, [{
        key: "compute",
        value: function compute(inputBuffer) {
            var _params = this.params,
                inputSpec = _params.inputSpec,
                outputSpec = _params.outputSpec;

            var inputBufferView = getArrayView(inputBuffer, inputSpec.dataType);
            var outputBuffer = this.createOutputBuffer();
            var outputBufferView = getArrayView(outputBuffer, outputSpec.dataType);
            // const offset = vec3.floor(vec3.create(), vec3.divide(vec3.create(),
            // vec3.subtract(vec3.create(), inputSpec.size, outputSpec.size), [2, 2, 2]));
            var zeros = vec3.create();
            zeros.set([0, 0, 0]);
            copyBufferOverlap(zeros, inputSpec.size, inputBufferView, zeros, outputSpec.size, outputBufferView, outputSpec.dataType);
            if (inputSpec.dataType === DataType.UINT8) {
                for (var i = 0; i < outputBufferView.length; ++i) {
                    outputBufferView[i] = 255 - outputBufferView[i];
                }
            }
            return _Promise.resolve(outputBuffer);
        }
    }]);

    return ExampleComputation;
}(VolumeComputationBackend);
ExampleComputation = __decorate([registerSharedObject(EXAMPLE_COMPUTATION_RPC_ID)], ExampleComputation);
export { ExampleComputation };
//# sourceMappingURL=backend.js.map