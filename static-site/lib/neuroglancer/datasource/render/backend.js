import _regeneratorRuntime from "babel-runtime/regenerator";
import _asyncToGenerator from "babel-runtime/helpers/asyncToGenerator";
import _JSON$stringify from "babel-runtime/core-js/json/stringify";
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
import { PointMatchChunkSourceParameters, TileChunkSourceParameters } from "./base";
import { decodeJpegChunk } from "../../sliceview/backend_chunk_decoders/jpeg";
import { decodeRawChunk } from "../../sliceview/backend_chunk_decoders/raw";
import { VectorGraphicsChunkSource } from "../../sliceview/vector_graphics/backend";
import { VolumeChunkSource } from "../../sliceview/volume/backend";
import { Float32ArrayBuilder } from "../../util/float32array_builder";
import { vec3 } from "../../util/geom";
import { cancellableFetchOk, responseArrayBuffer, responseJson } from "../../util/http_request";
import { parseArray, verify3dVec, verifyObject, verifyString } from "../../util/json";
import { registerSharedObject } from "../../worker_rpc";
import { Endianness } from "../../util/endian";
var chunkDecoders = new _Map();
chunkDecoders.set('jpg', decodeJpegChunk);
chunkDecoders.set('raw16', function (chunk, cancellationToken, response) {
    return decodeRawChunk(chunk, cancellationToken, response, Endianness.BIG);
});
var TileChunkSource = function (_WithParameters) {
    _inherits(TileChunkSource, _WithParameters);

    function TileChunkSource() {
        _classCallCheck(this, TileChunkSource);

        var _this = _possibleConstructorReturn(this, (TileChunkSource.__proto__ || _Object$getPrototypeOf(TileChunkSource)).apply(this, arguments));

        _this.chunkDecoder = chunkDecoders.get(_this.parameters.encoding);
        _this.queryString = function () {
            var parameters = _this.parameters;

            var query_params = [];
            if (parameters.channel !== undefined) {
                query_params.push('channels=' + parameters.channel);
            }
            if (parameters.minIntensity !== undefined) {
                query_params.push("minIntensity=" + _JSON$stringify(parameters.minIntensity));
            }
            if (parameters.maxIntensity !== undefined) {
                query_params.push("maxIntensity=" + _JSON$stringify(parameters.maxIntensity));
            }
            if (parameters.maxTileSpecsToRender !== undefined) {
                query_params.push("maxTileSpecsToRender=" + _JSON$stringify(parameters.maxTileSpecsToRender));
            }
            if (parameters.filter !== undefined) {
                query_params.push("filter=" + _JSON$stringify(parameters.filter));
            }
            return query_params.join('&');
        }();
        return _this;
    }

    _createClass(TileChunkSource, [{
        key: "download",
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken) {
                var parameters, chunkGridPosition, scale, xTileSize, yTileSize, chunkPosition, imageMethod, path, response;
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                parameters = this.parameters;
                                chunkGridPosition = chunk.chunkGridPosition;
                                // Calculate scale.

                                scale = 1.0 / Math.pow(2, parameters.level);
                                // Needed by JPEG decoder.

                                chunk.chunkDataSize = this.spec.chunkDataSize;
                                xTileSize = chunk.chunkDataSize[0] * Math.pow(2, parameters.level);
                                yTileSize = chunk.chunkDataSize[1] * Math.pow(2, parameters.level);
                                // Convert grid position to global coordinates position.

                                chunkPosition = vec3.create();

                                chunkPosition[0] = chunkGridPosition[0] * xTileSize;
                                chunkPosition[1] = chunkGridPosition[1] * yTileSize;
                                chunkPosition[2] = chunkGridPosition[2];
                                // GET
                                // /v1/owner/{owner}/project/{project}/stack/{stack}/z/{z}/box/{x},{y},{width},{height},{scale}/jpeg-image
                                imageMethod = void 0;

                                if (parameters.encoding === 'raw16') {
                                    imageMethod = 'raw16-image';
                                } else {
                                    imageMethod = 'jpeg-image';
                                }
                                path = "/render-ws/v1/owner/" + parameters.owner + "/project/" + parameters.project + "/stack/" + parameters.stack + "/z/" + chunkPosition[2] + "/box/" + chunkPosition[0] + "," + chunkPosition[1] + "," + xTileSize + "," + yTileSize + "," + scale + "/" + imageMethod;
                                _context.next = 15;
                                return cancellableFetchOk("" + parameters.baseUrl + path + "?" + this.queryString, {}, responseArrayBuffer, cancellationToken);

                            case 15:
                                response = _context.sent;
                                _context.next = 18;
                                return this.chunkDecoder(chunk, cancellationToken, response);

                            case 18:
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

    return TileChunkSource;
}(WithParameters(VolumeChunkSource, TileChunkSourceParameters));
TileChunkSource = __decorate([registerSharedObject()], TileChunkSource);
export { TileChunkSource };
function decodeSectionIDs(response) {
    var sectionIDs = [];
    parseArray(response, function (x) {
        verifyObject(x);
        sectionIDs.push(verifyString(x['sectionId']));
    });
    return sectionIDs;
}
function createConversionObject(tileId, xcoord, ycoord) {
    return { 'tileId': tileId, 'local': [xcoord, ycoord] };
}
function conversionObjectToWorld(conversionObjectArray, parameters, cancellationToken) {
    var url = parameters.baseUrl + "/render-ws/v1/owner/" + parameters.owner + "/project/" + parameters.project + "/" + ("stack/" + parameters.stack + "/local-to-world-coordinates");
    return cancellableFetchOk(url, {
        method: 'PUT',
        body: _JSON$stringify(conversionObjectArray),
        headers: { 'Content-Type': 'application/json' }
    }, responseJson, cancellationToken);
}
function decodePointMatches(chunk, response, parameters, cancellationToken) {
    var conversionObjects = new Array();
    parseArray(response, function (matchObj) {
        var pId = verifyString(matchObj['pId']);
        var qId = verifyString(matchObj['qId']);
        var matches = verifyObject(matchObj['matches']);
        var pMatches = matches['p']; // [[x],[y]]
        var qMatches = matches['q'];
        // Create conversion objects
        for (var i = 0; i < pMatches[0].length; i++) {
            // Create pConversion
            conversionObjects.push(createConversionObject(pId, pMatches[0][i], pMatches[1][i]));
            // Create qConversion
            conversionObjects.push(createConversionObject(qId, qMatches[0][i], qMatches[1][i]));
        }
    });
    return conversionObjectToWorld(conversionObjects, parameters, cancellationToken).then(function (allConvertedCoordinates) {
        var vertexPositions = new Float32ArrayBuilder();
        for (var i = 0; i < allConvertedCoordinates.length; i++) {
            var convertedCoordinate = verifyObject(allConvertedCoordinates[i]);
            var point = verify3dVec(convertedCoordinate['world']);
            vertexPositions.appendArray(point);
        }
        chunk.vertexPositions = vertexPositions.view;
    });
}
function getPointMatches(chunk, sectionIds, parameters, cancellationToken) {
    var path = void 0;
    if (sectionIds.length === 1) {
        path = "/render-ws/v1/owner/" + parameters.owner + "/matchCollection/" + (parameters.matchCollection + "/group/" + sectionIds[0] + "/matchesWith/" + sectionIds[0]);
    } else if (sectionIds.length === 2) {
        path = "/render-ws/v1/owner/" + parameters.owner + "/matchCollection/" + (parameters.matchCollection + "/group/" + sectionIds[0] + "/matchesWith/" + sectionIds[1]);
    } else {
        throw new Error("Invalid section Id vector of length: " + _JSON$stringify(sectionIds.length));
    }
    return cancellableFetchOk("" + parameters.baseUrl + path, {}, responseJson, cancellationToken).then(function (response) {
        return decodePointMatches(chunk, response, parameters, cancellationToken);
    });
}
function downloadPointMatchChunk(chunk, path, parameters, cancellationToken) {
    return cancellableFetchOk("" + parameters.baseUrl + path, {}, responseJson, cancellationToken).then(function (response) {
        return getPointMatches(chunk, decodeSectionIDs(response), parameters, cancellationToken);
    });
}
var PointMatchSource = function (_WithParameters2) {
    _inherits(PointMatchSource, _WithParameters2);

    function PointMatchSource() {
        _classCallCheck(this, PointMatchSource);

        return _possibleConstructorReturn(this, (PointMatchSource.__proto__ || _Object$getPrototypeOf(PointMatchSource)).apply(this, arguments));
    }

    _createClass(PointMatchSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            var parameters = this.parameters;
            var chunkGridPosition = chunk.chunkGridPosition;
            // Get section IDs

            var path = "/render-ws/v1/owner/" + parameters.owner + "/project/" + parameters.project + "/" + ("stack/" + parameters.stack + "/sectionData?minZ=" + chunkGridPosition[2] + "&") + ("maxZ=" + (chunkGridPosition[2] + parameters.zoffset));
            return downloadPointMatchChunk(chunk, path, parameters, cancellationToken);
        }
    }]);

    return PointMatchSource;
}(WithParameters(VectorGraphicsChunkSource, PointMatchChunkSourceParameters));
PointMatchSource = __decorate([registerSharedObject()], PointMatchSource);
export { PointMatchSource };
//# sourceMappingURL=backend.js.map