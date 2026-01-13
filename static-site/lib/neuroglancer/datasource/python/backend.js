import _Promise from "babel-runtime/core-js/promise";
import _regeneratorRuntime from "babel-runtime/regenerator";
import _asyncToGenerator from "babel-runtime/helpers/asyncToGenerator";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Map from "babel-runtime/core-js/map";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
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
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
import { WithParameters } from "../../chunk_manager/backend";
import { MeshSourceParameters, SkeletonSourceParameters, VolumeChunkEncoding, VolumeChunkSourceParameters } from "./base";
import { assignMeshFragmentData, decodeTriangleVertexPositionsAndIndices, MeshSource } from "../../mesh/backend";
import { SkeletonSource } from "../../skeleton/backend";
import { decodeSkeletonChunk } from "../../skeleton/decode_precomputed_skeleton";
import { decodeJpegChunk } from "../../sliceview/backend_chunk_decoders/jpeg";
import { decodeNdstoreNpzChunk } from "../../sliceview/backend_chunk_decoders/ndstoreNpz";
import { decodeRawChunk } from "../../sliceview/backend_chunk_decoders/raw";
import { VolumeChunkSource } from "../../sliceview/volume/backend";
import { Endianness } from "../../util/endian";
import { cancellableFetchOk, responseArrayBuffer } from "../../util/http_request";
import { registerSharedObject } from "../../worker_rpc";
var chunkDecoders = new _Map();
chunkDecoders.set(VolumeChunkEncoding.NPZ, decodeNdstoreNpzChunk);
chunkDecoders.set(VolumeChunkEncoding.JPEG, decodeJpegChunk);
chunkDecoders.set(VolumeChunkEncoding.RAW, decodeRawChunk);
var PythonVolumeChunkSource = function (_WithParameters) {
    _inherits(PythonVolumeChunkSource, _WithParameters);

    function PythonVolumeChunkSource() {
        _classCallCheck(this, PythonVolumeChunkSource);

        var _this = _possibleConstructorReturn(this, (PythonVolumeChunkSource.__proto__ || _Object$getPrototypeOf(PythonVolumeChunkSource)).apply(this, arguments));

        _this.chunkDecoder = chunkDecoders.get(_this.parameters['encoding']);
        _this.encoding = VolumeChunkEncoding[_this.parameters.encoding].toLowerCase();
        return _this;
    }

    _createClass(PythonVolumeChunkSource, [{
        key: "download",
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken) {
                var parameters, path, chunkPosition, chunkDataSize, i, response;
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                parameters = this.parameters;
                                path = "/neuroglancer/" + this.encoding + "/" + parameters.key + "/" + parameters.scaleKey;

                                // chunkPosition must not be captured, since it will be invalidated by the next call to
                                // computeChunkBounds.
                                chunkPosition = this.computeChunkBounds(chunk);
                                chunkDataSize = chunk.chunkDataSize;

                                for (i = 0; i < 3; ++i) {
                                    path += "/" + chunkPosition[i] + "," + (chunkPosition[i] + chunkDataSize[i]);
                                }
                                _context.next = 7;
                                return cancellableFetchOk(path, {}, responseArrayBuffer, cancellationToken);

                            case 7:
                                response = _context.sent;
                                _context.next = 10;
                                return this.chunkDecoder(chunk, cancellationToken, response);

                            case 10:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function download(_x, _x2) {
                return _ref.apply(this, arguments);
            }

            return download;
        }()
    }]);

    return PythonVolumeChunkSource;
}(WithParameters(VolumeChunkSource, VolumeChunkSourceParameters));
PythonVolumeChunkSource = __decorate([registerSharedObject()], PythonVolumeChunkSource);
export { PythonVolumeChunkSource };
export function decodeFragmentChunk(chunk, response) {
    var dv = new DataView(response);
    var numVertices = dv.getUint32(0, true);
    assignMeshFragmentData(chunk, decodeTriangleVertexPositionsAndIndices(response, Endianness.LITTLE, /*vertexByteOffset=*/4, numVertices));
}
var PythonMeshSource = function (_WithParameters2) {
    _inherits(PythonMeshSource, _WithParameters2);

    function PythonMeshSource() {
        _classCallCheck(this, PythonMeshSource);

        return _possibleConstructorReturn(this, (PythonMeshSource.__proto__ || _Object$getPrototypeOf(PythonMeshSource)).apply(this, arguments));
    }

    _createClass(PythonMeshSource, [{
        key: "download",
        value: function download(chunk) {
            // No manifest chunk to download, as there is always only a single fragment.
            chunk.fragmentIds = [''];
            return _Promise.resolve(undefined);
        }
    }, {
        key: "downloadFragment",
        value: function downloadFragment(chunk, cancellationToken) {
            var parameters = this.parameters;

            var requestPath = "/neuroglancer/mesh/" + parameters.key + "/" + chunk.manifestChunk.objectId;
            return cancellableFetchOk(requestPath, {}, responseArrayBuffer, cancellationToken).then(function (response) {
                return decodeFragmentChunk(chunk, response);
            });
        }
    }]);

    return PythonMeshSource;
}(WithParameters(MeshSource, MeshSourceParameters));
PythonMeshSource = __decorate([registerSharedObject()], PythonMeshSource);
export { PythonMeshSource };
var PythonSkeletonSource = function (_WithParameters3) {
    _inherits(PythonSkeletonSource, _WithParameters3);

    function PythonSkeletonSource() {
        _classCallCheck(this, PythonSkeletonSource);

        return _possibleConstructorReturn(this, (PythonSkeletonSource.__proto__ || _Object$getPrototypeOf(PythonSkeletonSource)).apply(this, arguments));
    }

    _createClass(PythonSkeletonSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            var parameters = this.parameters;

            var requestPath = "/neuroglancer/skeleton/" + parameters.key + "/" + chunk.objectId;
            return cancellableFetchOk(requestPath, {}, responseArrayBuffer, cancellationToken).then(function (response) {
                return decodeSkeletonChunk(chunk, response, parameters.vertexAttributes);
            });
        }
    }]);

    return PythonSkeletonSource;
}(WithParameters(SkeletonSource, SkeletonSourceParameters));
PythonSkeletonSource = __decorate([registerSharedObject()], PythonSkeletonSource);
export { PythonSkeletonSource };
//# sourceMappingURL=backend.js.map