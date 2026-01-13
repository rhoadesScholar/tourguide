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
  VolumeChunkEncoding[VolumeChunkEncoding["RAW"] = 0] = "RAW";
  VolumeChunkEncoding[VolumeChunkEncoding["JPEG"] = 1] = "JPEG";
  VolumeChunkEncoding[VolumeChunkEncoding["COMPRESSED_SEGMENTATION"] = 2] = "COMPRESSED_SEGMENTATION";
})(VolumeChunkEncoding || (VolumeChunkEncoding = {}));
export var ChangeSpec = function ChangeSpec() {
  _classCallCheck(this, ChangeSpec);
};
export var VolumeSourceParameters = function VolumeSourceParameters() {
  _classCallCheck(this, VolumeSourceParameters);
};
VolumeSourceParameters.RPC_ID = 'brainmaps/VolumeChunkSource';
export var MultiscaleMeshSourceParameters = function MultiscaleMeshSourceParameters() {
  _classCallCheck(this, MultiscaleMeshSourceParameters);
};
MultiscaleMeshSourceParameters.RPC_ID = 'brainmaps/MultiscaleMeshSource';
export var MeshSourceParameters = function MeshSourceParameters() {
  _classCallCheck(this, MeshSourceParameters);
};
MeshSourceParameters.RPC_ID = 'brainmaps/MeshSource';
export var SkeletonSourceParameters = function SkeletonSourceParameters() {
  _classCallCheck(this, SkeletonSourceParameters);
};
SkeletonSourceParameters.RPC_ID = 'brainmaps/SkeletonSource';
export var AnnotationSourceParameters = function AnnotationSourceParameters() {
  _classCallCheck(this, AnnotationSourceParameters);
};
AnnotationSourceParameters.RPC_ID = 'brainmaps/Annotation';
//# sourceMappingURL=base.js.map