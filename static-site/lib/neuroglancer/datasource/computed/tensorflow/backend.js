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
 * Copyright 2019 Google Inc.
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
import { VolumeComputationBackend } from "../backend";
import { getArrayView } from "../base";
import { TENSORFLOW_COMPUTATION_RPC_ID, TENSORFLOW_INFERENCE_RPC_ID } from "./base";
import { registerSharedObject } from "../../../worker_rpc";
var TensorflowComputation = function (_VolumeComputationBac) {
    _inherits(TensorflowComputation, _VolumeComputationBac);

    function TensorflowComputation() {
        _classCallCheck(this, TensorflowComputation);

        return _possibleConstructorReturn(this, (TensorflowComputation.__proto__ || _Object$getPrototypeOf(TensorflowComputation)).apply(this, arguments));
    }

    _createClass(TensorflowComputation, [{
        key: "convertInputBuffer_",

        /**
         * Converts an input data buffer into a TF.js-compatible normalized typed
         * array.
         * @param buffer the input data buffer
         * @param dtype TF.js-centric dtype string
         */
        value: function convertInputBuffer_(buffer, dtype) {
            var inputArray = getArrayView(buffer, this.params.inputSpec.dataType);
            var outputArray = void 0;
            switch (dtype) {
                case 'float32':
                    outputArray = new Float32Array(inputArray.length);
                    break;
                case 'int32':
                    outputArray = new Int32Array(inputArray.length);
                    break;
                default:
                    throw new Error("Unsupported dtype: " + dtype);
            }
            for (var i = 0; i < inputArray.length; ++i) {
                outputArray[i] = (inputArray[i] - this.params.mean) / this.params.stdDev;
            }
            return outputArray;
        }
        /**
         * Copies a TF.js typed array prediction output into a type-correct data
         * buffer, to be used as computational output in a ComputedVolumeChunk.
         * @param inputArray TF.js prediction output
         */

    }, {
        key: "convertOutputBuffer_",
        value: function convertOutputBuffer_(inputArray) {
            var buffer = this.createOutputBuffer();
            var outputArray = getArrayView(buffer, this.params.outputSpec.dataType);
            outputArray.set(inputArray);
            return buffer;
        }
    }, {
        key: "compute",
        value: function compute(inputBuffer, cancellationToken, chunk) {
            var _this2 = this;

            this.addRef();
            var inferenceRequest = {
                inputBuffer: this.convertInputBuffer_(inputBuffer, this.params.inputDType),
                computationRef: this.rpcId,
                priority: chunk.priority
            };
            return this.rpc.promiseInvoke(TENSORFLOW_INFERENCE_RPC_ID, { inferenceRequest: inferenceRequest }, cancellationToken).then(function (result) {
                _this2.dispose();
                return _this2.convertOutputBuffer_(result.outputBuffer);
            }).catch(function (e) {
                _this2.dispose();
                throw e;
            });
        }
    }]);

    return TensorflowComputation;
}(VolumeComputationBackend);
TensorflowComputation = __decorate([registerSharedObject(TENSORFLOW_COMPUTATION_RPC_ID)], TensorflowComputation);
export { TensorflowComputation };
//# sourceMappingURL=backend.js.map