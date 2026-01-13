import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _regeneratorRuntime from "babel-runtime/regenerator";
import _asyncToGenerator from "babel-runtime/helpers/asyncToGenerator";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";

var decodeChunk = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken, response, encoding) {
        var dv, mode, numDimensions, offset, shape, i, buffer;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        dv = new DataView(response);
                        mode = dv.getUint16(0, /*littleEndian=*/false);

                        if (!(mode !== 0)) {
                            _context.next = 4;
                            break;
                        }

                        throw new Error("Unsupported mode: " + mode + ".");

                    case 4:
                        numDimensions = dv.getUint16(2, /*littleEndian=*/false);

                        if (!(numDimensions !== 3)) {
                            _context.next = 7;
                            break;
                        }

                        throw new Error("Number of dimensions must be 3.");

                    case 7:
                        offset = 4;
                        shape = new Uint32Array(numDimensions);

                        for (i = 0; i < numDimensions; ++i) {
                            shape[i] = dv.getUint32(offset, /*littleEndian=*/false);
                            offset += 4;
                        }
                        chunk.chunkDataSize = vec3.fromValues(shape[0], shape[1], shape[2]);
                        buffer = new Uint8Array(response, offset);

                        if (!(encoding === VolumeChunkEncoding.GZIP)) {
                            _context.next = 16;
                            break;
                        }

                        _context.next = 15;
                        return requestAsyncComputation(decodeGzip, cancellationToken, [buffer.buffer], buffer);

                    case 15:
                        buffer = _context.sent;

                    case 16:
                        _context.next = 18;
                        return decodeRawChunk(chunk, cancellationToken, buffer.buffer, Endianness.BIG, buffer.byteOffset, buffer.byteLength);

                    case 18:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function decodeChunk(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
    };
}();

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
import { decodeGzip } from "../../async_computation/decode_gzip_request";
import { requestAsyncComputation } from "../../async_computation/request";
import { WithParameters } from "../../chunk_manager/backend";
import { VolumeChunkEncoding, VolumeChunkSourceParameters } from "./base";
import { decodeRawChunk } from "../../sliceview/backend_chunk_decoders/raw";
import { VolumeChunkSource } from "../../sliceview/volume/backend";
import { Endianness } from "../../util/endian";
import { vec3 } from "../../util/geom";
import { cancellableFetchOk, responseArrayBuffer } from "../../util/http_request";
import { registerSharedObject } from "../../worker_rpc";

var PrecomputedVolumeChunkSource = function (_WithParameters) {
    _inherits(PrecomputedVolumeChunkSource, _WithParameters);

    function PrecomputedVolumeChunkSource() {
        _classCallCheck(this, PrecomputedVolumeChunkSource);

        return _possibleConstructorReturn(this, (PrecomputedVolumeChunkSource.__proto__ || _Object$getPrototypeOf(PrecomputedVolumeChunkSource)).apply(this, arguments));
    }

    _createClass(PrecomputedVolumeChunkSource, [{
        key: "download",
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(chunk, cancellationToken) {
                var parameters, chunkGridPosition, url, response;
                return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                parameters = this.parameters;
                                chunkGridPosition = chunk.chunkGridPosition;
                                url = parameters.url + "/" + chunkGridPosition[0] + "/" + chunkGridPosition[1] + "/" + chunkGridPosition[2];
                                _context2.next = 5;
                                return cancellableFetchOk(url, {}, responseArrayBuffer, cancellationToken);

                            case 5:
                                response = _context2.sent;
                                _context2.next = 8;
                                return decodeChunk(chunk, cancellationToken, response, parameters.encoding);

                            case 8:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function download(_x5, _x6) {
                return _ref2.apply(this, arguments);
            }

            return download;
        }()
    }]);

    return PrecomputedVolumeChunkSource;
}(WithParameters(VolumeChunkSource, VolumeChunkSourceParameters));
PrecomputedVolumeChunkSource = __decorate([registerSharedObject()], PrecomputedVolumeChunkSource);
export { PrecomputedVolumeChunkSource };
//# sourceMappingURL=backend.js.map