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
  VolumeChunkEncoding[VolumeChunkEncoding["RAW"] = 1] = "RAW";
  VolumeChunkEncoding[VolumeChunkEncoding["COMPRESSED_SEGMENTATION"] = 2] = "COMPRESSED_SEGMENTATION";
  VolumeChunkEncoding[VolumeChunkEncoding["COMPRESSED_SEGMENTATIONARRAY"] = 3] = "COMPRESSED_SEGMENTATIONARRAY";
})(VolumeChunkEncoding || (VolumeChunkEncoding = {}));
// export class ChangeSpec {
//   changeStackId: string;
//   /**
//    * Apply changes prior to this timestamp (in milliseconds since epoch).  If 0, no changes should
//    * be applied.  If negative, all changes should be applied.
//    */
//   timeStamp?: number;
//   skipEquivalences?: boolean;
// }
export var DVIDSourceParameters = function DVIDSourceParameters() {
  _classCallCheck(this, DVIDSourceParameters);
};
export var VolumeChunkSourceParameters = function (_DVIDSourceParameters) {
  _inherits(VolumeChunkSourceParameters, _DVIDSourceParameters);

  function VolumeChunkSourceParameters() {
    _classCallCheck(this, VolumeChunkSourceParameters);

    return _possibleConstructorReturn(this, (VolumeChunkSourceParameters.__proto__ || _Object$getPrototypeOf(VolumeChunkSourceParameters)).apply(this, arguments));
  }

  return VolumeChunkSourceParameters;
}(DVIDSourceParameters);
VolumeChunkSourceParameters.RPC_ID = 'dvid/VolumeChunkSource';
export var SkeletonSourceParameters = function (_DVIDSourceParameters2) {
  _inherits(SkeletonSourceParameters, _DVIDSourceParameters2);

  function SkeletonSourceParameters() {
    _classCallCheck(this, SkeletonSourceParameters);

    return _possibleConstructorReturn(this, (SkeletonSourceParameters.__proto__ || _Object$getPrototypeOf(SkeletonSourceParameters)).apply(this, arguments));
  }

  return SkeletonSourceParameters;
}(DVIDSourceParameters);
SkeletonSourceParameters.RPC_ID = 'dvid/SkeletonSource';
export var MeshSourceParameters = function (_DVIDSourceParameters3) {
  _inherits(MeshSourceParameters, _DVIDSourceParameters3);

  function MeshSourceParameters() {
    _classCallCheck(this, MeshSourceParameters);

    return _possibleConstructorReturn(this, (MeshSourceParameters.__proto__ || _Object$getPrototypeOf(MeshSourceParameters)).apply(this, arguments));
  }

  return MeshSourceParameters;
}(DVIDSourceParameters);
MeshSourceParameters.RPC_ID = 'dvid/MeshSource';
export var AnnotationSourceParameters = function (_DVIDSourceParameters4) {
  _inherits(AnnotationSourceParameters, _DVIDSourceParameters4);

  function AnnotationSourceParameters() {
    _classCallCheck(this, AnnotationSourceParameters);

    return _possibleConstructorReturn(this, (AnnotationSourceParameters.__proto__ || _Object$getPrototypeOf(AnnotationSourceParameters)).apply(this, arguments));
  }

  return AnnotationSourceParameters;
}(DVIDSourceParameters);
AnnotationSourceParameters.RPC_ID = 'dvid/Annotation';
//# sourceMappingURL=base.js.map