import _JSON$stringify from "babel-runtime/core-js/json/stringify";
import _regeneratorRuntime from "babel-runtime/regenerator";
import _asyncToGenerator from "babel-runtime/helpers/asyncToGenerator";
import _Object$assign from "babel-runtime/core-js/object/assign";
import _Promise from "babel-runtime/core-js/promise";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
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
import { AnnotationSerializer, AnnotationType } from "../../annotation";
import { AnnotationGeometryData, AnnotationSource } from "../../annotation/backend";
import { verifyObject, verifyObjectProperty, verifyOptionalString, parseIntVec } from "../../util/json";
import { WithParameters } from "../../chunk_manager/backend";
import { MeshSourceParameters, SkeletonSourceParameters, VolumeChunkEncoding, VolumeChunkSourceParameters, AnnotationSourceParameters } from "./base";
import { assignMeshFragmentData, decodeTriangleVertexPositionsAndIndices, MeshSource } from "../../mesh/backend";
import { SkeletonSource } from "../../skeleton/backend";
import { decodeSwcSkeletonChunk } from "../../skeleton/decode_swc_skeleton";
import { decodeCompressedSegmentationChunk } from "../../sliceview/backend_chunk_decoders/compressed_segmentation";
import { decodeJpegChunk } from "../../sliceview/backend_chunk_decoders/jpeg";
import { VolumeChunkSource } from "../../sliceview/volume/backend";
import { Endianness } from "../../util/endian";
import { cancellableFetchOk, responseArrayBuffer } from "../../util/http_request";
import { registerSharedObject } from "../../worker_rpc";
import { vec3 } from "../../util/geom";
import { Uint64 } from "../../util/uint64";
import { DVIDInstance, makeRequest } from "./api";
var DVIDSkeletonSource = function (_WithParameters) {
    _inherits(DVIDSkeletonSource, _WithParameters);

    function DVIDSkeletonSource() {
        _classCallCheck(this, DVIDSkeletonSource);

        return _possibleConstructorReturn(this, (DVIDSkeletonSource.__proto__ || _Object$getPrototypeOf(DVIDSkeletonSource)).apply(this, arguments));
    }

    _createClass(DVIDSkeletonSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            var parameters = this.parameters;

            var bodyid = "" + chunk.objectId;
            var url = parameters.baseUrl + "/api/node/" + parameters['nodeKey'] + ("/" + parameters['dataInstanceKey'] + "/key/") + bodyid + '_swc';
            return cancellableFetchOk(url, {}, responseArrayBuffer, cancellationToken).then(function (response) {
                var enc = new TextDecoder('utf-8');
                decodeSwcSkeletonChunk(chunk, enc.decode(response));
            });
        }
    }]);

    return DVIDSkeletonSource;
}(WithParameters(SkeletonSource, SkeletonSourceParameters));
DVIDSkeletonSource = __decorate([registerSharedObject()], DVIDSkeletonSource);
export { DVIDSkeletonSource };
export function decodeFragmentChunk(chunk, response) {
    var dv = new DataView(response);
    var numVertices = dv.getUint32(0, true);
    assignMeshFragmentData(chunk, decodeTriangleVertexPositionsAndIndices(response, Endianness.LITTLE, /*vertexByteOffset=*/4, numVertices));
}
var DVIDMeshSource = function (_WithParameters2) {
    _inherits(DVIDMeshSource, _WithParameters2);

    function DVIDMeshSource() {
        _classCallCheck(this, DVIDMeshSource);

        return _possibleConstructorReturn(this, (DVIDMeshSource.__proto__ || _Object$getPrototypeOf(DVIDMeshSource)).apply(this, arguments));
    }

    _createClass(DVIDMeshSource, [{
        key: "download",
        value: function download(chunk) {
            // DVID does not currently store meshes chunked, the main
            // use-case is for low-resolution 3D views.
            // for now, fragmentId is the body id
            chunk.fragmentIds = ["" + chunk.objectId];
            return _Promise.resolve(undefined);
        }
    }, {
        key: "downloadFragment",
        value: function downloadFragment(chunk, cancellationToken) {
            var parameters = this.parameters;

            var url = parameters.baseUrl + "/api/node/" + parameters['nodeKey'] + "/" + parameters['dataInstanceKey'] + "/key/" + chunk.fragmentId + ".ngmesh";
            return cancellableFetchOk(url, {}, responseArrayBuffer, cancellationToken).then(function (response) {
                return decodeFragmentChunk(chunk, response);
            });
        }
    }]);

    return DVIDMeshSource;
}(WithParameters(MeshSource, MeshSourceParameters));
DVIDMeshSource = __decorate([registerSharedObject()], DVIDMeshSource);
export { DVIDMeshSource };
var spatialAnnotationTypes = ['LOCATION', 'LINE', 'VOLUME'];
export function parseUint64ToArray(out, v) {
    if (v) {
        out.push(Uint64.parseString(v));
    }
    return out;
}
function parseAnnotation(entry) {
    console.log("parsing", entry);
    var corner = verifyObjectProperty(entry, 'Pos', function (x) {
        return parseIntVec(vec3.create(), x);
    });
    var property = verifyObjectProperty(entry, 'Prop', verifyObject);
    if (property.type) {
        if (property.type == 'Merge') {
            property.displayCode = 1;
        } else if (property.type == 'Split') {
            property.displayCode = 2;
        }
    }
    var description = verifyObjectProperty(property, 'comment', verifyOptionalString);
    var segments = verifyObjectProperty(property, "body ID", function (x) {
        return parseUint64ToArray(Array(), x);
    });
    return {
        type: AnnotationType.POINT,
        id: corner[0] + "_" + corner[1] + "_" + corner[2],
        point: corner,
        description: description,
        segments: segments,
        property: property
    };
}
/*
function parseAnnotationResponse(response: any): Annotation {
  verifyObject(response);
  const entry = verifyObjectProperty(
      response, 'annotations', x => parseFixedLengthArray(<any[]>[undefined], x, verifyObject))[0];
  return parseAnnotation(entry);
}
*/
function parseAnnotations(chunk, responses) {
    console.log("parsing", responses);
    var serializer = new AnnotationSerializer();
    responses.forEach(function (response, responseIndex) {
        try {
            /*
            // verifyObje(response);
            const annotationsArray = response;
            
                // verifyObjectProperty(response, 'annotations', x => x === undefined ? [] : x);
            if (!Array.isArray(annotationsArray)) {
              throw new Error(`Expected array, but received ${JSON.stringify(typeof annotationsArray)}.`);
            }
            for (const entry of annotationsArray) {
              try {
                serializer.add(parseAnnotation(entry));
              } catch (e) {
                throw new Error(`Error parsing annotation: ${e.message}`);
              }
            }
            */
            try {
                serializer.add(parseAnnotation(response));
            } catch (e) {
                throw new Error("Error parsing annotation: " + e.message);
            }
        } catch (parseError) {
            throw new Error("Error parsing " + spatialAnnotationTypes[responseIndex] + " annotations: " + parseError.message);
        }
    });
    chunk.data = _Object$assign(new AnnotationGeometryData(), serializer.serialize());
}
function DvidSource(Base, parametersConstructor) {
    return WithParameters(Base, parametersConstructor);
}
var DVIDVolumeChunkSource = function (_WithParameters3) {
    _inherits(DVIDVolumeChunkSource, _WithParameters3);

    function DVIDVolumeChunkSource() {
        _classCallCheck(this, DVIDVolumeChunkSource);

        return _possibleConstructorReturn(this, (DVIDVolumeChunkSource.__proto__ || _Object$getPrototypeOf(DVIDVolumeChunkSource)).apply(this, arguments));
    }

    _createClass(DVIDVolumeChunkSource, [{
        key: "download",
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken) {
                var params, path, chunkPosition, chunkDataSize, decoder, response;
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                params = this.parameters;
                                path = void 0;

                                // chunkPosition must not be captured, since it will be invalidated by the next call to
                                // computeChunkBounds.
                                chunkPosition = this.computeChunkBounds(chunk);
                                chunkDataSize = chunk.chunkDataSize;
                                // if the volume is an image, get a jpeg

                                path = this.getPath(chunkPosition, chunkDataSize);
                                decoder = this.getDecoder(params);
                                _context.next = 8;
                                return cancellableFetchOk("" + params.baseUrl + path, {}, responseArrayBuffer, cancellationToken);

                            case 8:
                                response = _context.sent;
                                _context.next = 11;
                                return decoder(chunk, cancellationToken, params.encoding === VolumeChunkEncoding.JPEG ? response.slice(16) : response);

                            case 11:
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
    }, {
        key: "getPath",
        value: function getPath(chunkPosition, chunkDataSize) {
            var params = this.parameters;
            if (params.encoding === VolumeChunkEncoding.JPEG) {
                return "/api/node/" + params['nodeKey'] + "/" + params['dataInstanceKey'] + "/subvolblocks/" + (chunkDataSize[0] + "_" + chunkDataSize[1] + "_" + chunkDataSize[2] + "/") + (chunkPosition[0] + "_" + chunkPosition[1] + "_" + chunkPosition[2]);
            } else if (params.encoding === VolumeChunkEncoding.RAW) {
                return "/api/node/" + params['nodeKey'] + "/" + params['dataInstanceKey'] + "/raw/0_1_2/" + (chunkDataSize[0] + "_" + chunkDataSize[1] + "_" + chunkDataSize[2] + "/") + (chunkPosition[0] + "_" + chunkPosition[1] + "_" + chunkPosition[2] + "/jpeg");
            } else if (params.encoding === VolumeChunkEncoding.COMPRESSED_SEGMENTATIONARRAY) {
                return "/api/node/" + params['nodeKey'] + "/" + params['dataInstanceKey'] + "/raw/0_1_2/" + (chunkDataSize[0] + "_" + chunkDataSize[1] + "_" + chunkDataSize[2] + "/") + (chunkPosition[0] + "_" + chunkPosition[1] + "_" + chunkPosition[2] + "?compression=googlegzip&scale=" + params['dataScale']);
            } else {
                // encoding is COMPRESSED_SEGMENTATION
                return "/api/node/" + params['nodeKey'] + "/" + params['dataInstanceKey'] + "/raw/0_1_2/" + (chunkDataSize[0] + "_" + chunkDataSize[1] + "_" + chunkDataSize[2] + "/") + (chunkPosition[0] + "_" + chunkPosition[1] + "_" + chunkPosition[2] + "?compression=googlegzip");
            }
        }
    }, {
        key: "getDecoder",
        value: function getDecoder(params) {
            if (params.encoding === VolumeChunkEncoding.JPEG || params.encoding === VolumeChunkEncoding.RAW) {
                return decodeJpegChunk;
            } else {
                // encoding is COMPRESSED_SEGMENTATION
                return decodeCompressedSegmentationChunk;
            }
        }
    }]);

    return DVIDVolumeChunkSource;
}(WithParameters(VolumeChunkSource, VolumeChunkSourceParameters));
DVIDVolumeChunkSource = __decorate([registerSharedObject()], DVIDVolumeChunkSource);
export { DVIDVolumeChunkSource };
function annotationToDVID(annotation, user) {
    var payload = annotation.description || '';
    var objectLabels = annotation.segments === undefined ? undefined : annotation.segments.map(function (x) {
        return x.toString();
    });
    console.log(annotation);
    switch (annotation.type) {
        case AnnotationType.POINT:
            {
                var obj = {
                    Kind: 'Note',
                    Pos: [annotation.point[0], annotation.point[1], annotation.point[2]],
                    Prop: {
                        comment: payload
                    }
                };
                if (annotation.property) {
                    if (annotation.property.custom) {
                        obj['Prop']['custom'] = annotation.property.custom;
                    }
                    if (annotation.property.type) {
                        obj['Prop']['type'] = annotation.property.type;
                    }
                }
                if (objectLabels && objectLabels.length > 0) {
                    obj['Prop']['body ID'] = objectLabels[0];
                }
                if (user) {
                    obj['Tags'] = ["user:" + user];
                    obj['Prop']['user'] = user;
                }
                return obj;
            }
    }
}
var DvidAnnotationSource = function (_DvidSource) {
    _inherits(DvidAnnotationSource, _DvidSource);

    function DvidAnnotationSource() {
        _classCallCheck(this, DvidAnnotationSource);

        return _possibleConstructorReturn(this, (DvidAnnotationSource.__proto__ || _Object$getPrototypeOf(DvidAnnotationSource)).apply(this, arguments));
    }

    _createClass(DvidAnnotationSource, [{
        key: "getPath",
        value: function getPath(position, size) {
            //http://emdata4.int.janelia.org:8900/api/node/0c6f54d9677f4d3181eedfb272b1c0b0/bookmark_annotations/elements/1_1_1/20263_22133_20696
            return "/bookmark_annotations/elements/" + size[0] + "_" + size[1] + "_" + size[2] + "/" + position[0] + "_" + position[1] + "_" + position[2];
        }
    }, {
        key: "getPathByUserTag",
        value: function getPathByUserTag(user) {
            return "/bookmark_annotations/tag/user:" + user;
        }
    }, {
        key: "getPathByBodyId",
        value: function getPathByBodyId(bodyId) {
            return "/bookmark_annotations/label/" + bodyId;
        }
    }, {
        key: "getPathByBodyAnnotationId",
        value: function getPathByBodyAnnotationId(annotationId) {
            return "/bookmark_annotations/elements/1_1_1/" + annotationId;
        }
    }, {
        key: "downloadGeometry",
        value: function downloadGeometry(chunk, cancellationToken) {
            var _this5 = this;

            var parameters = this.parameters;

            console.log(parameters);
            if (parameters.user) {
                return makeRequest(new DVIDInstance(parameters.baseUrl, parameters.nodeKey), {
                    method: 'GET',
                    path: this.getPathByUserTag(parameters.user),
                    payload: undefined,
                    responseType: 'json'
                }, cancellationToken).then(function (values) {
                    parseAnnotations(chunk, values);
                });
            } else {
                var instance = new DVIDInstance(parameters.baseUrl, parameters.nodeKey);
                return _Promise.resolve(makeRequest(instance, {
                    method: 'GET',
                    path: "/" + parameters.dataInstanceKey + "/info",
                    payload: undefined,
                    responseType: 'json'
                }).then(function (response) {
                    console.log(response);
                    var extended = verifyObjectProperty(response, 'Extended', verifyObject);
                    var lowerVoxelBound = verifyObjectProperty(extended, 'MinPoint', function (x) {
                        return parseIntVec(vec3.create(), x);
                    });
                    var upperVoxelBound = verifyObjectProperty(extended, 'MaxPoint', function (x) {
                        return parseIntVec(vec3.create(), x);
                    });
                    var chunkPosition = lowerVoxelBound;
                    var chunkDataSize = vec3.subtract(vec3.create(), upperVoxelBound, lowerVoxelBound);
                    return makeRequest(new DVIDInstance(parameters.baseUrl, parameters.nodeKey), {
                        method: 'GET',
                        path: _this5.getPath(chunkPosition, chunkDataSize),
                        payload: undefined,
                        responseType: 'json'
                    }, cancellationToken).then(function (values) {
                        parseAnnotations(chunk, values);
                    });
                }));
            }
        }
    }, {
        key: "downloadSegmentFilteredGeometry",
        value: function downloadSegmentFilteredGeometry(chunk, cancellationToken) {
            var parameters = this.parameters;

            return makeRequest(new DVIDInstance(parameters.baseUrl, parameters.nodeKey), {
                method: 'GET',
                path: this.getPathByBodyId(chunk.objectId),
                payload: undefined,
                responseType: 'json'
            }, cancellationToken).then(function (values) {
                parseAnnotations(chunk, values);
            });
        }
    }, {
        key: "downloadMetadata",
        value: function downloadMetadata(chunk, cancellationToken) {
            console.log('downloading meta data of annotation');
            var parameters = this.parameters;

            var id = chunk.key;
            return makeRequest(new DVIDInstance(parameters.baseUrl, parameters.nodeKey), {
                method: 'GET',
                path: this.getPathByBodyAnnotationId(id),
                payload: undefined,
                responseType: 'json'
            }, cancellationToken).then(function (response) {
                if (response.length > 0) {
                    chunk.annotation = parseAnnotation(response[0]);
                } else {
                    chunk.annotation = null;
                }
            }, function () {
                chunk.annotation = null;
            });
        }
    }, {
        key: "add",
        value: function add(annotation) {
            var parameters = this.parameters;

            var dvidAnnotation = annotationToDVID(annotation, parameters.user);
            console.log(dvidAnnotation);
            return makeRequest(new DVIDInstance(parameters.baseUrl, parameters.nodeKey), {
                method: 'POST',
                path: '/bookmark_annotations/elements',
                payload: _JSON$stringify([dvidAnnotation]),
                responseType: ''
            }).then(function () {
                // console.log(response);
                if (annotation.type === AnnotationType.POINT) {
                    return annotation.point[0] + "_" + annotation.point[1] + "_" + annotation.point[2];
                } else {
                    throw new Error('Unexpected annotation type: ' + annotation.type);
                }
            });
        }
    }, {
        key: "update",
        value: function update(id, annotation) {
            console.log(id);
            var parameters = this.parameters;

            var dvidAnnotation = annotationToDVID(annotation, parameters.user);
            return makeRequest(new DVIDInstance(parameters.baseUrl, parameters.nodeKey), {
                method: 'POST',
                path: '/bookmark_annotations/elements',
                payload: _JSON$stringify([dvidAnnotation]),
                responseType: ''
            });
        }
    }, {
        key: "delete",
        value: function _delete(id) {
            var parameters = this.parameters;

            return makeRequest(new DVIDInstance(parameters.baseUrl, parameters.nodeKey), {
                method: 'DELETE',
                path: "/bookmark_annotations/element/" + id,
                payload: undefined,
                responseType: ''
            });
        }
    }]);

    return DvidAnnotationSource;
}(DvidSource(AnnotationSource, AnnotationSourceParameters));
DvidAnnotationSource = __decorate([registerSharedObject()], DvidAnnotationSource);
export { DvidAnnotationSource };
//# sourceMappingURL=backend.js.map