import _getIterator from "babel-runtime/core-js/get-iterator";
import _objectDestructuringEmpty from "babel-runtime/helpers/objectDestructuringEmpty";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Promise from "babel-runtime/core-js/promise";
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
import { VolumeComputationFrontend } from "../frontend";
import { TENSORFLOW_COMPUTATION_RPC_ID, TENSORFLOW_INFERENCE_RPC_ID } from "./base";
import { DataType, VolumeType } from "../../../sliceview/volume/base";
import { CANCELED } from "../../../util/cancellation";
import { verifyFloat, verifyString } from "../../../util/json";
import { registerPromiseRPC, registerSharedObjectOwner } from "../../../worker_rpc";
var tfjs = null;
export function loadTFjs() {
    if (tfjs) {
        return _Promise.resolve();
    }
    return import( /* webpackChunkName: "tfjs-library" */'@tensorflow/tfjs').then(function (module) {
        tfjs = module;
    });
}
var TensorflowComputation = function (_VolumeComputationFro) {
    _inherits(TensorflowComputation, _VolumeComputationFro);

    function TensorflowComputation(params, model_) {
        _classCallCheck(this, TensorflowComputation);

        var _this = _possibleConstructorReturn(this, (TensorflowComputation.__proto__ || _Object$getPrototypeOf(TensorflowComputation)).call(this, params));

        _this.model_ = model_;
        // The queue of pending inference requests. Maintained in order of increasing
        // priority, so that pop() always returns the next appropriate request.
        _this.inferenceQueue_ = [];
        // True iff the inference loop is in operation.
        _this.running_ = false;
        return _this;
    }
    /**
     * Adds a TF.js-compatible typed array to the inference queue and starts the
     * inference loop, if it isn't already running. Returns a promise that
     * resolves with the prediction output.
     *
     * Creates a PendingInference object and inserts it into the correct position
     * in the inference queue, which is guaranteed to be less than the length of
     * the backend computation queue in length. As such, it is most likely
     * faster to simply iterate the queue to insert the request rather than using
     * a more sophisticated method like binary insertion or a tree-based queue.
     * @param array the input data to run inference over
     * @param priority
     * @param cancellationToken
     */


    _createClass(TensorflowComputation, [{
        key: "predict",
        value: function predict(array, priority, cancellationToken) {
            var _this2 = this;

            return new _Promise(function (resolve, reject) {
                var i = void 0;
                var queue = _this2.inferenceQueue_;
                for (i = 0; i < queue.length && queue[i].priority < priority; ++i) {}
                queue.splice(i, 0, { array: array, cancellationToken: cancellationToken, priority: priority, resolve: resolve, reject: reject });
                _this2.startInference();
            }).then(function (result) {
                return { value: result, transfers: [result.outputBuffer.buffer] };
            });
        }
        /**
         * Start the inference loop, if it isn't already running.
         */

    }, {
        key: "startInference",
        value: function startInference() {
            var _this3 = this;

            if (this.running_) {
                return;
            }
            this.running_ = true;
            setTimeout(function () {
                return _this3.runInference_();
            }, 0);
        }
        /**
         * Run the inference loop recursively.
         */

    }, {
        key: "runInference_",
        value: function runInference_() {
            var _this4 = this;

            if (this.inferenceQueue_.length === 0) {
                this.running_ = false;
                return;
            }
            var pendingInference = this.inferenceQueue_.pop();
            if (pendingInference.cancellationToken.isCanceled) {
                pendingInference.reject(CANCELED);
                this.runInference_();
                return;
            }
            this.modelInference_(pendingInference).then(function () {
                return _this4.runInference_();
            });
        }
        /**
         * Executes tf.js prediction, resolving or rejecting the pending request's
         * promise, as appropriate.
         * @param inferenceRequest  the request to infer.
         */

    }, {
        key: "modelInference_",
        value: function modelInference_(inferenceRequest) {
            var _this5 = this;

            var inputLength = inferenceRequest.array.length;
            var expectedLength = this.params.inputTensorNumElements;
            if (inputLength !== expectedLength) {
                inferenceRequest.reject(new Error("Input array has " + inputLength + " elements. Expected " + expectedLength));
                return _Promise.resolve();
            }
            var prediction = tfjs.tidy(function () {
                var modelInput = tfjs.tensor(inferenceRequest.array).reshape(_this5.params.inputTensorShape);
                var model = _this5.model_;
                return model.predict(modelInput, {});
            });
            return prediction.data().then(function (outputBuffer) {
                prediction.dispose();
                var result = { outputBuffer: outputBuffer };
                inferenceRequest.resolve(result);
            }).then(function () {
                return new _Promise(function (resolve) {
                    setTimeout(function () {
                        return resolve();
                    }, 10);
                });
            });
        }
    }]);

    return TensorflowComputation;
}(VolumeComputationFrontend);
TensorflowComputation = __decorate([registerSharedObjectOwner(TENSORFLOW_COMPUTATION_RPC_ID)], TensorflowComputation);
export { TensorflowComputation };
export var TensorflowComputationProvider = function () {
    function TensorflowComputationProvider() {
        _classCallCheck(this, TensorflowComputationProvider);
    }

    _createClass(TensorflowComputationProvider, [{
        key: "getComputation",
        value: function getComputation(config, _ref, params) {
            _objectDestructuringEmpty(_ref);

            var modelPath = verifyString(config['modelPath']);
            if (!modelPath.endsWith('/')) {
                modelPath += '/';
            }
            var model = void 0;
            var stdDev = 1.0;
            var mean = 0.0;
            var outputType = VolumeType.SEGMENTATION;
            if (config['stdDev'] !== undefined) {
                stdDev = verifyFloat(config['stdDev']);
            }
            if (config['mean'] !== undefined) {
                mean = verifyFloat(config['mean']);
            }
            if (config['atype'] !== undefined) {
                var atype = verifyString(config['atype']);
                switch (atype) {
                    case 'classifier':
                        break;
                    case 'regressor':
                        outputType = VolumeType.IMAGE;
                        break;
                    default:
                        throw new Error("Unknown algorithm type " + atype + ". Must be \"classifier\" or \"regressor\"");
                }
            }
            // Load the model, then do a dummy inference run. This allows us to
            // explicitly discover the output dimensions, and to compile the
            // model on the gpu.
            return loadTFjs().then(function () {
                return tfjs.loadFrozenModel(modelPath + 'tensorflowjs_model.pb', modelPath + 'weights_manifest.json');
            }).then(function (tfModel) {
                model = tfModel;
                if (model.inputs.length !== 1) {
                    throw new Error('Only models with exactly one input are supported');
                }
                if (model.outputs.length !== 1) {
                    // Todo: support for multiple-output models.
                    throw new Error('Only models with exactly one output are supported');
                }
                // Create a blank tensor, run prediction, check output size
                var dummyOutput = tfjs.tidy(function () {
                    var dummyInput = tfjs.ones(model.inputs[0].shape);
                    return model.predict(dummyInput, {});
                });
                return dummyOutput.data().then(function () {
                    return dummyOutput;
                });
            }).then(function (outputTensor) {
                var inputShape = [1, 1, 1];
                var outputShape = [1, 1, 1];
                var inputTensor = model.inputs[0];
                var inputDType = inputTensor.dtype;
                var idx = 0;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(inputTensor.shape), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var dim = _step.value;

                        if (dim > 1) {
                            inputShape[idx] = dim;
                            ++idx;
                        }
                        if (idx >= 3) {
                            throw new Error("Cannot support tensorflow model with input ndim > 3: " + inputTensor.shape);
                        }
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

                idx = 0;
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = _getIterator(outputTensor.shape), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var _dim = _step2.value;

                        if (_dim > 1) {
                            outputShape[idx] = _dim;
                            ++idx;
                        }
                        if (idx >= 3) {
                            throw new Error("Cannot support tensorflow model with output ndim > 3: " + outputTensor.shape);
                        }
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                outputTensor.dispose();
                var numElements = 1.0;
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = _getIterator(inputTensor.shape), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var _dim2 = _step3.value;

                        numElements *= _dim2;
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                var tfParams = params.computationParameters;
                tfParams.inputSpec.size.set(inputShape);
                tfParams.outputSpec.size.set(outputShape);
                tfParams.outputSpec.dataType = DataType.UINT32;
                tfParams.outputSpec.volumeType = outputType;
                tfParams.inputDType = inputDType;
                tfParams.mean = mean;
                tfParams.stdDev = stdDev;
                tfParams.inputTensorShape = inputTensor.shape;
                tfParams.inputTensorNumElements = numElements;
                return new TensorflowComputation(tfParams, model);
            });
        }
    }]);

    return TensorflowComputationProvider;
}();
registerPromiseRPC(TENSORFLOW_INFERENCE_RPC_ID, function (x, cancellationToken) {
    var request = x.inferenceRequest;
    var computation = this.get(request.computationRef);
    return computation.predict(request.inputBuffer, request.priority, cancellationToken);
});
//# sourceMappingURL=frontend.js.map