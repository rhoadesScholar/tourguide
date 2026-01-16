import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
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
export var VolumeChunkEncoding;
(function (VolumeChunkEncoding) {
  VolumeChunkEncoding[VolumeChunkEncoding["JPEG"] = 0] = "JPEG";
  VolumeChunkEncoding[VolumeChunkEncoding["NPZ"] = 1] = "NPZ";
  VolumeChunkEncoding[VolumeChunkEncoding["RAW"] = 2] = "RAW";
})(VolumeChunkEncoding || (VolumeChunkEncoding = {}));
export var PythonSourceParameters = function PythonSourceParameters() {
  _classCallCheck(this, PythonSourceParameters);
};
export var VolumeChunkSourceParameters = function (_PythonSourceParamete) {
  _inherits(VolumeChunkSourceParameters, _PythonSourceParamete);

  function VolumeChunkSourceParameters() {
    _classCallCheck(this, VolumeChunkSourceParameters);

    return _possibleConstructorReturn(this, (VolumeChunkSourceParameters.__proto__ || _Object$getPrototypeOf(VolumeChunkSourceParameters)).apply(this, arguments));
  }

  return VolumeChunkSourceParameters;
}(PythonSourceParameters);
VolumeChunkSourceParameters.RPC_ID = 'python/VolumeChunkSource';
export var MeshSourceParameters = function (_PythonSourceParamete2) {
  _inherits(MeshSourceParameters, _PythonSourceParamete2);

  function MeshSourceParameters() {
    _classCallCheck(this, MeshSourceParameters);

    return _possibleConstructorReturn(this, (MeshSourceParameters.__proto__ || _Object$getPrototypeOf(MeshSourceParameters)).apply(this, arguments));
  }

  return MeshSourceParameters;
}(PythonSourceParameters);
MeshSourceParameters.RPC_ID = 'python/MeshSource';
export var SkeletonSourceParameters = function (_PythonSourceParamete3) {
  _inherits(SkeletonSourceParameters, _PythonSourceParamete3);

  function SkeletonSourceParameters() {
    _classCallCheck(this, SkeletonSourceParameters);

    return _possibleConstructorReturn(this, (SkeletonSourceParameters.__proto__ || _Object$getPrototypeOf(SkeletonSourceParameters)).apply(this, arguments));
  }

  return SkeletonSourceParameters;
}(PythonSourceParameters);
SkeletonSourceParameters.RPC_ID = 'python/SkeletonSource';
//# sourceMappingURL=base.js.map