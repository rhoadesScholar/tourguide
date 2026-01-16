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
export var VolumeChunkSourceParameters = function VolumeChunkSourceParameters() {
    _classCallCheck(this, VolumeChunkSourceParameters);
};
VolumeChunkSourceParameters.RPC_ID = 'precomputed/VolumeChunkSource';
export var MeshSourceParameters = function MeshSourceParameters() {
    _classCallCheck(this, MeshSourceParameters);
};
MeshSourceParameters.RPC_ID = 'precomputed/MeshSource';
export var DataEncoding;
(function (DataEncoding) {
    DataEncoding[DataEncoding["RAW"] = 0] = "RAW";
    DataEncoding[DataEncoding["GZIP"] = 1] = "GZIP";
})(DataEncoding || (DataEncoding = {}));
export var ShardingHashFunction;
(function (ShardingHashFunction) {
    ShardingHashFunction[ShardingHashFunction["IDENTITY"] = 0] = "IDENTITY";
    ShardingHashFunction[ShardingHashFunction["MURMURHASH3_X86_128"] = 1] = "MURMURHASH3_X86_128";
})(ShardingHashFunction || (ShardingHashFunction = {}));
export var MultiscaleMeshMetadata = function MultiscaleMeshMetadata() {
    _classCallCheck(this, MultiscaleMeshMetadata);
};
export var MultiscaleMeshSourceParameters = function MultiscaleMeshSourceParameters() {
    _classCallCheck(this, MultiscaleMeshSourceParameters);
};
MultiscaleMeshSourceParameters.RPC_ID = 'precomputed/MultiscaleMeshSource';
export var SkeletonSourceParameters = function SkeletonSourceParameters() {
    _classCallCheck(this, SkeletonSourceParameters);
};
SkeletonSourceParameters.RPC_ID = 'precomputed/SkeletonSource';
//# sourceMappingURL=base.js.map