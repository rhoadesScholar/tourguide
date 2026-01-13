import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { ComputationParameters } from '../base';
export var TENSORFLOW_COMPUTATION_RPC_ID = 'Computation.Tensorflow';
export var TENSORFLOW_INFERENCE_RPC_ID = 'Computation.Tensorflow.Inference';
export var TensorflowComputationParameters = function (_ComputationParameter) {
  _inherits(TensorflowComputationParameters, _ComputationParameter);

  function TensorflowComputationParameters() {
    _classCallCheck(this, TensorflowComputationParameters);

    return _possibleConstructorReturn(this, (TensorflowComputationParameters.__proto__ || _Object$getPrototypeOf(TensorflowComputationParameters)).apply(this, arguments));
  }

  return TensorflowComputationParameters;
}(ComputationParameters);
//# sourceMappingURL=base.js.map