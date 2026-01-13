import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Map from "babel-runtime/core-js/map";
import _regeneratorRuntime from "babel-runtime/regenerator";
import _asyncToGenerator from "babel-runtime/helpers/asyncToGenerator";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";

var decodeNiftiFile = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(buffer, cancellationToken) {
        var data, header;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (!isCompressed(buffer)) {
                            _context.next = 4;
                            break;
                        }

                        _context.next = 3;
                        return requestAsyncComputation(decodeGzip, cancellationToken, [buffer], new Uint8Array(buffer));

                    case 3:
                        buffer = _context.sent.buffer;

                    case 4:
                        data = new NiftiFileData();

                        data.uncompressedData = buffer;
                        header = readHeader(buffer);

                        if (!(header === null)) {
                            _context.next = 9;
                            break;
                        }

                        throw new Error('Failed to parse NIFTI header.');

                    case 9:
                        data.header = header;
                        return _context.abrupt("return", { data: data, size: buffer.byteLength });

                    case 11:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function decodeNiftiFile(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

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
import { decodeGzip } from "../../async_computation/decode_gzip_request";
import { requestAsyncComputation } from "../../async_computation/request";
import { WithParameters } from "../../chunk_manager/backend";
import { ChunkPriorityTier } from "../../chunk_manager/base";
import { GenericSharedDataSource } from "../../chunk_manager/generic_file_source";
import { GET_NIFTI_VOLUME_INFO_RPC_ID, NiftiDataType, VolumeSourceParameters } from "./base";
import { decodeRawChunk } from "../../sliceview/backend_chunk_decoders/raw";
import { VolumeChunkSource } from "../../sliceview/volume/backend";
import { DataType, VolumeType } from "../../sliceview/volume/base";
import { Endianness } from "../../util/endian";
import { mat4, quat, vec3 } from "../../util/geom";
import { registerPromiseRPC, registerSharedObject } from "../../worker_rpc";
import { isCompressed, NIFTI1, readHeader, readImage } from 'nifti-reader-js';
export var NiftiFileData = function NiftiFileData() {
    _classCallCheck(this, NiftiFileData);
};

function getNiftiFileData(chunkManager, url, getPriority, cancellationToken) {
    return GenericSharedDataSource.getUrl(chunkManager, decodeNiftiFile, url, getPriority, cancellationToken);
}
var NIFTI_HEADER_INFO_PRIORITY = 1000;
function getNiftiHeaderInfo(chunkManager, url, cancellationToken) {
    return getNiftiFileData(chunkManager, url, function () {
        return { priorityTier: ChunkPriorityTier.VISIBLE, priority: NIFTI_HEADER_INFO_PRIORITY };
    }, cancellationToken).then(function (data) {
        return data.header;
    });
}
function convertAffine(affine) {
    return mat4.fromValues(affine[0][0], affine[1][0], affine[2][0], affine[3][0], affine[0][1], affine[1][1], affine[2][1], affine[3][1], affine[0][2], affine[1][2], affine[2][2], affine[3][2], affine[0][3], affine[1][3], affine[2][3], affine[3][3]);
}
var DATA_TYPE_CONVERSIONS = new _Map([[NiftiDataType.INT8, { dataType: DataType.UINT8, volumeType: VolumeType.IMAGE }], [NiftiDataType.UINT8, { dataType: DataType.UINT8, volumeType: VolumeType.IMAGE }], [NiftiDataType.INT16, { dataType: DataType.UINT16, volumeType: VolumeType.IMAGE }], [NiftiDataType.UINT16, { dataType: DataType.UINT16, volumeType: VolumeType.IMAGE }], [NiftiDataType.INT32, { dataType: DataType.UINT32, volumeType: VolumeType.SEGMENTATION }], [NiftiDataType.UINT32, { dataType: DataType.UINT32, volumeType: VolumeType.SEGMENTATION }], [NiftiDataType.INT64, { dataType: DataType.UINT64, volumeType: VolumeType.SEGMENTATION }], [NiftiDataType.UINT64, { dataType: DataType.UINT64, volumeType: VolumeType.SEGMENTATION }], [NiftiDataType.FLOAT32, { dataType: DataType.FLOAT32, volumeType: VolumeType.IMAGE }]]);
registerPromiseRPC(GET_NIFTI_VOLUME_INFO_RPC_ID, function (x, cancellationToken) {
    var chunkManager = this.getRef(x['chunkManager']);
    var headerPromise = getNiftiHeaderInfo(chunkManager, x['url'], cancellationToken);
    chunkManager.dispose();
    return headerPromise.then(function (header) {
        var dataTypeInfo = DATA_TYPE_CONVERSIONS.get(header.datatypeCode);
        if (dataTypeInfo === undefined) {
            throw new Error("Unsupported data type: " + ((NiftiDataType[header.datatypeCode] || header.datatypeCode) + "."));
        }
        if (header.dims[4] !== 1) {
            throw new Error("Time series data not supported.");
        }
        var spatialUnits = header.xyzt_units & NIFTI1.SPATIAL_UNITS_MASK;
        var unitsPerNm = 1;
        switch (spatialUnits) {
            case NIFTI1.UNITS_METER:
                unitsPerNm = 1e9;
                break;
            case NIFTI1.UNITS_MM:
                unitsPerNm = 1e6;
                break;
            case NIFTI1.UNITS_MICRON:
                unitsPerNm = 1e3;
                break;
        }
        var quatern_b = header.quatern_b,
            quatern_c = header.quatern_c,
            quatern_d = header.quatern_d;

        var quatern_a = Math.sqrt(1.0 - quatern_b * quatern_b - quatern_c * quatern_c - quatern_d * quatern_d);
        var qfac = header.pixDims[0] === -1 ? -1 : 1;
        var info = {
            description: header.description,
            affine: convertAffine(header.affine),
            dataType: dataTypeInfo.dataType,
            numChannels: header.dims[5],
            volumeType: dataTypeInfo.volumeType,
            voxelSize: vec3.fromValues(unitsPerNm * header.pixDims[1], unitsPerNm * header.pixDims[2], unitsPerNm * header.pixDims[3]),
            volumeSize: vec3.fromValues(header.dims[1], header.dims[2], header.dims[3]),
            qoffset: vec3.fromValues(unitsPerNm * header.qoffset_x, unitsPerNm * header.qoffset_y, unitsPerNm * header.qoffset_z),
            qform_code: header.qform_code,
            sform_code: header.sform_code,
            qfac: qfac,
            quatern: quat.fromValues(quatern_b, quatern_c, quatern_d, quatern_a)
        };
        return { value: info };
    });
});
var NiftiVolumeChunkSource = function (_WithParameters) {
    _inherits(NiftiVolumeChunkSource, _WithParameters);

    function NiftiVolumeChunkSource() {
        _classCallCheck(this, NiftiVolumeChunkSource);

        return _possibleConstructorReturn(this, (NiftiVolumeChunkSource.__proto__ || _Object$getPrototypeOf(NiftiVolumeChunkSource)).apply(this, arguments));
    }

    _createClass(NiftiVolumeChunkSource, [{
        key: "download",
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(chunk, cancellationToken) {
                var data, imageBuffer;
                return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                chunk.chunkDataSize = this.spec.chunkDataSize;
                                _context2.next = 3;
                                return getNiftiFileData(this.chunkManager, this.parameters.url, function () {
                                    return { priorityTier: chunk.priorityTier, priority: chunk.priority };
                                }, cancellationToken);

                            case 3:
                                data = _context2.sent;
                                imageBuffer = readImage(data.header, data.uncompressedData);
                                _context2.next = 7;
                                return decodeRawChunk(chunk, cancellationToken, imageBuffer, data.header.littleEndian ? Endianness.LITTLE : Endianness.BIG);

                            case 7:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function download(_x3, _x4) {
                return _ref2.apply(this, arguments);
            }

            return download;
        }()
    }]);

    return NiftiVolumeChunkSource;
}(WithParameters(VolumeChunkSource, VolumeSourceParameters));
NiftiVolumeChunkSource = __decorate([registerSharedObject()], NiftiVolumeChunkSource);
export { NiftiVolumeChunkSource };
//# sourceMappingURL=backend.js.map