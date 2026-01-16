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
 * Copyright 2017 Google Inc.
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
import { WithSharedCredentialsProviderCounterpart } from "../../credentials_provider/shared_counterpart";
import { fetchWithBossCredentials } from "./api";
import { MeshSourceParameters, VolumeChunkSourceParameters } from "./base";
import { assignMeshFragmentData, decodeJsonManifestChunk, decodeTriangleVertexPositionsAndIndices, MeshSource } from "../../mesh/backend";
import { decodeBossNpzChunk } from "../../sliceview/backend_chunk_decoders/bossNpz";
import { decodeJpegChunk } from "../../sliceview/backend_chunk_decoders/jpeg";
import { VolumeChunkSource } from "../../sliceview/volume/backend";
import { Endianness } from "../../util/endian";
import { cancellableFetchOk, responseArrayBuffer } from "../../util/http_request";
import { registerSharedObject } from "../../worker_rpc";
var chunkDecoders = new _Map();
chunkDecoders.set('npz', decodeBossNpzChunk);
chunkDecoders.set('jpeg', decodeJpegChunk);
var acceptHeaders = new _Map();
acceptHeaders.set('npz', 'application/npygz');
acceptHeaders.set('jpeg', 'image/jpeg');
function BossSource(Base, parametersConstructor) {
    return WithParameters(WithSharedCredentialsProviderCounterpart()(Base), parametersConstructor);
}
var BossVolumeChunkSource = function (_BossSource) {
    _inherits(BossVolumeChunkSource, _BossSource);

    function BossVolumeChunkSource() {
        _classCallCheck(this, BossVolumeChunkSource);

        var _this = _possibleConstructorReturn(this, (BossVolumeChunkSource.__proto__ || _Object$getPrototypeOf(BossVolumeChunkSource)).apply(this, arguments));

        _this.chunkDecoder = chunkDecoders.get(_this.parameters.encoding);
        return _this;
    }

    _createClass(BossVolumeChunkSource, [{
        key: "download",
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken) {
                var parameters, url, chunkPosition, chunkDataSize, i, response;
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                parameters = this.parameters;
                                url = parameters.baseUrl + "/latest/cutout/" + parameters.collection + "/" + parameters.experiment + "/" + parameters.channel + "/" + parameters.resolution;

                                // chunkPosition must not be captured, since it will be invalidated by the next call to
                                // computeChunkBounds.
                                chunkPosition = this.computeChunkBounds(chunk);
                                chunkDataSize = chunk.chunkDataSize;

                                for (i = 0; i < 3; ++i) {
                                    url += "/" + chunkPosition[i] + ":" + (chunkPosition[i] + chunkDataSize[i]);
                                }

                                url += '/';
                                if (parameters.window !== undefined) {
                                    url += "?window=" + parameters.window[0] + "," + parameters.window[1];
                                }
                                _context.next = 9;
                                return fetchWithBossCredentials(this.credentialsProvider, url, { headers: { 'Accept': acceptHeaders.get(parameters.encoding) } }, responseArrayBuffer, cancellationToken);

                            case 9:
                                response = _context.sent;
                                _context.next = 12;
                                return this.chunkDecoder(chunk, cancellationToken, response);

                            case 12:
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

    return BossVolumeChunkSource;
}(BossSource(VolumeChunkSource, VolumeChunkSourceParameters));
BossVolumeChunkSource = __decorate([registerSharedObject()], BossVolumeChunkSource);
export { BossVolumeChunkSource };
function decodeManifestChunk(chunk, response) {
    return decodeJsonManifestChunk(chunk, response, 'fragments');
}
function decodeFragmentChunk(chunk, response) {
    var dv = new DataView(response);
    var numVertices = dv.getUint32(0, true);
    assignMeshFragmentData(chunk, decodeTriangleVertexPositionsAndIndices(response, Endianness.LITTLE, /*vertexByteOffset=*/4, numVertices));
}
var BossMeshSource = function (_BossSource2) {
    _inherits(BossMeshSource, _BossSource2);

    function BossMeshSource() {
        _classCallCheck(this, BossMeshSource);

        return _possibleConstructorReturn(this, (BossMeshSource.__proto__ || _Object$getPrototypeOf(BossMeshSource)).apply(this, arguments));
    }

    _createClass(BossMeshSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            var parameters = this.parameters;

            return cancellableFetchOk("" + parameters.baseUrl + chunk.objectId, {}, responseArrayBuffer, cancellationToken).then(function (response) {
                return decodeManifestChunk(chunk, response);
            });
        }
    }, {
        key: "downloadFragment",
        value: function downloadFragment(chunk, cancellationToken) {
            var parameters = this.parameters;

            return cancellableFetchOk("" + parameters.baseUrl + chunk.fragmentId, {}, responseArrayBuffer, cancellationToken).then(function (response) {
                return decodeFragmentChunk(chunk, response);
            });
        }
    }]);

    return BossMeshSource;
}(BossSource(MeshSource, MeshSourceParameters));
BossMeshSource = __decorate([registerSharedObject()], BossMeshSource);
export { BossMeshSource };
//# sourceMappingURL=backend.js.map