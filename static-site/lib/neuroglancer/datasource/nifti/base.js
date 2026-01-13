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
export var GET_NIFTI_VOLUME_INFO_RPC_ID = 'nifti/getNiftiVolumeInfo';
export var NiftiDataType;
(function (NiftiDataType) {
    NiftiDataType[NiftiDataType["NONE"] = 0] = "NONE";
    NiftiDataType[NiftiDataType["BINARY"] = 1] = "BINARY";
    NiftiDataType[NiftiDataType["UINT8"] = 2] = "UINT8";
    NiftiDataType[NiftiDataType["INT16"] = 4] = "INT16";
    NiftiDataType[NiftiDataType["INT32"] = 8] = "INT32";
    NiftiDataType[NiftiDataType["FLOAT32"] = 16] = "FLOAT32";
    NiftiDataType[NiftiDataType["COMPLEX64"] = 32] = "COMPLEX64";
    NiftiDataType[NiftiDataType["FLOAT64"] = 64] = "FLOAT64";
    NiftiDataType[NiftiDataType["RGB24"] = 128] = "RGB24";
    NiftiDataType[NiftiDataType["INT8"] = 256] = "INT8";
    NiftiDataType[NiftiDataType["UINT16"] = 512] = "UINT16";
    NiftiDataType[NiftiDataType["UINT32"] = 768] = "UINT32";
    NiftiDataType[NiftiDataType["INT64"] = 1024] = "INT64";
    NiftiDataType[NiftiDataType["UINT64"] = 1280] = "UINT64";
    NiftiDataType[NiftiDataType["FLOAT128"] = 1536] = "FLOAT128";
    NiftiDataType[NiftiDataType["COMPLEX128"] = 1792] = "COMPLEX128";
    NiftiDataType[NiftiDataType["COMPLEX256"] = 2048] = "COMPLEX256";
})(NiftiDataType || (NiftiDataType = {}));
export var VolumeSourceParameters = function VolumeSourceParameters() {
    _classCallCheck(this, VolumeSourceParameters);
};
VolumeSourceParameters.RPC_ID = 'nifti/VolumeChunkSource';
//# sourceMappingURL=base.js.map