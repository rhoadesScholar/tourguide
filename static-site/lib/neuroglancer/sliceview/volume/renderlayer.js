import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { ChunkState } from '../../chunk_manager/base';
import { getTransformedSources } from '../base';
import { BoundingBoxCrossSectionRenderHelper } from '../bounding_box_shader_helper';
import { RenderLayer as SliceViewRenderLayer } from '../renderlayer';
import { BoundingBox, mat4, vec3, vec3Key } from '../../util/geom';
import { ShaderGetter } from '../../webgl/dynamic_shader';
import { getShaderType } from '../../webgl/shader_lib';
var DEBUG_VERTICES = false;
/**
 * Extra amount by which the chunk position computed in the vertex shader is shifted in the
 * direction of the component-wise absolute value of the plane normal.  In Neuroglancer, a
 * cross-section plane exactly on the boundary between two voxels is a common occurrence and is
 * intended to result in the display of the "next" (i.e. higher coordinate) plane rather than the
 * "previous" (lower coordinate) plane.  However, due to various sources of floating point
 * inaccuracy (in particular, shader code which has relaxed rules), values exactly on the boundary
 * between voxels may be slightly shifted in either direction.  To ensure that this doesn't result
 * in the display of the wrong data (i.e. the previous rather than next plane), we always shift
 * toward the "next" plane by this small amount.
 */
var CHUNK_POSITION_EPSILON = 1e-3;
export var glsl_getPositionWithinChunk = '\nhighp ivec3 getPositionWithinChunk () {\n  return ivec3(min(vChunkPosition, uChunkDataSize - 1.0));\n}\n';
var tempMat4 = mat4.create();
var tempVec3 = vec3.create();

var VolumeSliceVertexComputationManager = function (_BoundingBoxCrossSect) {
    _inherits(VolumeSliceVertexComputationManager, _BoundingBoxCrossSect);

    function VolumeSliceVertexComputationManager() {
        _classCallCheck(this, VolumeSliceVertexComputationManager);

        return _possibleConstructorReturn(this, (VolumeSliceVertexComputationManager.__proto__ || _Object$getPrototypeOf(VolumeSliceVertexComputationManager)).apply(this, arguments));
    }

    _createClass(VolumeSliceVertexComputationManager, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(VolumeSliceVertexComputationManager.prototype.__proto__ || _Object$getPrototypeOf(VolumeSliceVertexComputationManager.prototype), 'defineShader', this).call(this, builder);
            // A number in [0, 6) specifying which vertex to compute.
            builder.addAttribute('highp float', 'aVertexIndexFloat');
            // Specifies translation of the current chunk.
            builder.addUniform('highp vec3', 'uTranslation');
            // Matrix by which computed vertices will be transformed.
            builder.addUniform('highp mat4', 'uProjectionMatrix');
            // Chunk size in voxels.
            builder.addUniform('highp vec3', 'uChunkDataSize');
            // Size of a voxel in nanometers.
            builder.addUniform('highp vec3', 'uVoxelSize');
            builder.addUniform('highp vec3', 'uLowerClipBound');
            builder.addUniform('highp vec3', 'uUpperClipBound');
            // Position within chunk of vertex, in floating point range [0, chunkDataSize].
            builder.addVarying('highp vec3', 'vChunkPosition');
            builder.setVertexMain('\nvec3 chunkSize = uChunkDataSize * uVoxelSize;\nvec3 position = getBoundingBoxPlaneIntersectionVertexPosition(chunkSize, uTranslation, uLowerClipBound, uUpperClipBound, int(aVertexIndexFloat));\ngl_Position = uProjectionMatrix * vec4(position, 1.0);\nvChunkPosition = (position - uTranslation) / uVoxelSize +\n    ' + CHUNK_POSITION_EPSILON + ' * abs(uPlaneNormal);\n');
            builder.addFragmentCode(glsl_getPositionWithinChunk);
        }
    }, {
        key: 'computeVerticesDebug',
        value: function computeVerticesDebug(uChunkDataSize, uVoxelSize, uLowerClipBound, uUpperClipBound, uPlaneDistance, uPlaneNormal, uTranslation, uProjectionMatrix) {
            var chunkSize = vec3.multiply(vec3.create(), uChunkDataSize, uVoxelSize);
            var gl_Position = vec3.create(),
                vChunkPosition = vec3.create(),
                planeNormalAbs = vec3.fromValues(Math.abs(uPlaneNormal[0]), Math.abs(uPlaneNormal[1]), Math.abs(uPlaneNormal[2]));
            for (var vertexIndex = 0; vertexIndex < 6; ++vertexIndex) {
                var position = this.computeVertexPositionDebug(chunkSize, uLowerClipBound, uUpperClipBound, uPlaneDistance, uPlaneNormal, uTranslation, vertexIndex);
                if (position === undefined) {
                    console.log('no intersection found');
                    return;
                }
                vec3.transformMat4(gl_Position, position, uProjectionMatrix);
                vec3.sub(vChunkPosition, position, uTranslation);
                vec3.divide(vChunkPosition, vChunkPosition, uVoxelSize);
                vec3.scaleAndAdd(vChunkPosition, vChunkPosition, planeNormalAbs, CHUNK_POSITION_EPSILON);
                console.log('vertex ' + vertexIndex + ', at ' + gl_Position + ', vChunkPosition = ' + vChunkPosition);
            }
        }
    }, {
        key: 'beginSlice',
        value: function beginSlice(_gl, shader) {
            var aVertexIndexFloat = shader.attribute('aVertexIndexFloat');
            this.data.outputVertexIndices.bindToVertexAttrib(aVertexIndexFloat, 1);
        }
    }, {
        key: 'endSlice',
        value: function endSlice(gl, shader) {
            var aVertexIndexFloat = shader.attribute('aVertexIndexFloat');
            gl.disableVertexAttribArray(aVertexIndexFloat);
        }
    }, {
        key: 'beginSource',
        value: function beginSource(gl, shader, sliceView, dataToDeviceMatrix, spec, chunkLayout) {
            this.setViewportPlane(shader, sliceView.viewportAxes[2], sliceView.centerDataPosition, chunkLayout.invTransform);
            // Compute projection matrix that transforms chunk layout coordinates to device coordinates.
            gl.uniformMatrix4fv(shader.uniform('uProjectionMatrix'), false, mat4.multiply(tempMat4, dataToDeviceMatrix, chunkLayout.transform));
            gl.uniform3fv(shader.uniform('uVoxelSize'), spec.voxelSize);
            gl.uniform3fv(shader.uniform('uLowerClipBound'), spec.lowerClipBound);
            gl.uniform3fv(shader.uniform('uUpperClipBound'), spec.upperClipBound);
            if (DEBUG_VERTICES) {
                window['debug_sliceView_uVoxelSize'] = spec.voxelSize;
                window['debug_sliceView_uLowerClipBound'] = spec.lowerClipBound;
                window['debug_sliceView_uUpperClipBound'] = spec.upperClipBound;
                window['debug_sliceView'] = sliceView;
                window['debug_sliceView_dataToDevice'] = dataToDeviceMatrix;
            }
        }
    }, {
        key: 'setupChunkDataSize',
        value: function setupChunkDataSize(gl, shader, chunkDataSize) {
            gl.uniform3fv(shader.uniform('uChunkDataSize'), chunkDataSize);
            if (DEBUG_VERTICES) {
                window['debug_sliceView_chunkDataSize'] = chunkDataSize;
            }
        }
    }, {
        key: 'drawChunk',
        value: function drawChunk(gl, shader, chunkPosition) {
            gl.uniform3fv(shader.uniform('uTranslation'), chunkPosition);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);
            if (DEBUG_VERTICES) {
                var sliceView = window['debug_sliceView'];
                var chunkDataSize = window['debug_sliceView_chunkDataSize'];
                var voxelSize = window['debug_sliceView_uVoxelSize'];
                var lowerClipBound = window['debug_sliceView_uLowerClipBound'];
                var upperClipBound = window['debug_sliceView_uUpperClipBound'];
                console.log('Drawing chunk: ' + vec3Key(chunkPosition) + ' of data size ' + vec3Key(chunkDataSize));
                var dataToDeviceMatrix = window['debug_sliceView_dataToDevice'];
                this.computeVerticesDebug(chunkDataSize, voxelSize, lowerClipBound, upperClipBound, sliceView.viewportPlaneDistanceToOrigin, sliceView.viewportAxes[2], chunkPosition, dataToDeviceMatrix);
            }
        }
    }], [{
        key: 'get',
        value: function get(gl) {
            return gl.memoize.get('volume.VolumeSliceVertexComputationManager', function () {
                return new VolumeSliceVertexComputationManager(gl);
            });
        }
    }]);

    return VolumeSliceVertexComputationManager;
}(BoundingBoxCrossSectionRenderHelper);

function medianOf3(a, b, c) {
    return a > b ? c > a ? a : b > c ? b : c : c > b ? b : a > c ? a : c;
}
export var RenderLayer = function (_SliceViewRenderLayer) {
    _inherits(RenderLayer, _SliceViewRenderLayer);

    function RenderLayer(multiscaleSource, options) {
        _classCallCheck(this, RenderLayer);

        var _options$sourceOption = options.sourceOptions,
            sourceOptions = _options$sourceOption === undefined ? {} : _options$sourceOption,
            shaderError = options.shaderError;

        var _this2 = _possibleConstructorReturn(this, (RenderLayer.__proto__ || _Object$getPrototypeOf(RenderLayer)).call(this, multiscaleSource.chunkManager, multiscaleSource.getSources(sourceOptions), options));

        var gl = _this2.gl;

        _this2.shaderGetter = _this2.registerDisposer(new ShaderGetter(gl, function (builder) {
            return _this2.defineShader(builder);
        }, function () {
            return _this2.getShaderKey() + '/' + _this2.chunkFormat.shaderKey;
        }, shaderError));
        _this2.vertexComputationManager = VolumeSliceVertexComputationManager.get(gl);
        var transformedSources = getTransformedSources(_this2);
        {
            var _transformedSources$ = transformedSources[0][0],
                source = _transformedSources$.source,
                chunkLayout = _transformedSources$.chunkLayout;

            var spec = source.spec;
            var boundingBox = _this2.boundingBox = new BoundingBox(vec3.fromValues(Infinity, Infinity, Infinity), vec3.fromValues(-Infinity, -Infinity, -Infinity));
            var globalCorner = vec3.create();
            var localCorner = tempVec3;
            for (var cornerIndex = 0; cornerIndex < 8; ++cornerIndex) {
                for (var i = 0; i < 3; ++i) {
                    localCorner[i] = cornerIndex & 1 << i ? spec.upperClipBound[i] : spec.lowerClipBound[i];
                }
                chunkLayout.localSpatialToGlobal(globalCorner, localCorner);
                vec3.min(boundingBox.lower, boundingBox.lower, globalCorner);
                vec3.max(boundingBox.upper, boundingBox.upper, globalCorner);
            }
        }
        return _this2;
    }

    _createClass(RenderLayer, [{
        key: 'getValueAt',
        value: function getValueAt(position) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(getTransformedSources(this)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var alternatives = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = _getIterator(alternatives), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var transformedSource = _step2.value;

                            var source = transformedSource.source;
                            var result = source.getValueAt(position, transformedSource.chunkLayout);
                            if (result != null) {
                                return result;
                            }
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return null;
        }
    }, {
        key: 'getShaderKey',
        value: function getShaderKey() {
            return this.chunkFormat.shaderKey;
        }
    }, {
        key: 'defineShader',
        value: function defineShader(builder) {
            this.vertexComputationManager.defineShader(builder);
            builder.addOutputBuffer('vec4', 'v4f_fragData0', 0);
            builder.addFragmentCode('\nvoid emit(vec4 color) {\n  v4f_fragData0 = color;\n}\n');
            this.chunkFormat.defineShader(builder);
            builder.addFragmentCode('\n' + getShaderType(this.dataType) + ' getDataValue() { return getDataValue(0); }\n');
        }
    }, {
        key: 'beginSlice',
        value: function beginSlice(_sliceView) {
            var gl = this.gl;
            var shader = this.shaderGetter.get();
            if (shader === undefined) {
                return;
            }
            shader.bind();
            this.vertexComputationManager.beginSlice(gl, shader);
            return shader;
        }
    }, {
        key: 'endSlice',
        value: function endSlice(shader) {
            var gl = this.gl;
            this.vertexComputationManager.endSlice(gl, shader);
        }
    }, {
        key: 'draw',
        value: function draw(sliceView) {
            var visibleSources = sliceView.visibleLayers.get(this);
            if (visibleSources.length === 0) {
                return;
            }
            var gl = this.gl;
            var shader = this.beginSlice(sliceView);
            if (shader === undefined) {
                return;
            }
            var chunkPosition = vec3.create();
            var renderScaleHistogram = this.renderScaleHistogram,
                vertexComputationManager = this.vertexComputationManager;
            // All sources are required to have the same texture format.

            var chunkFormat = this.chunkFormat;
            chunkFormat.beginDrawing(gl, shader);
            if (renderScaleHistogram !== undefined) {
                renderScaleHistogram.begin(this.chunkManager.chunkQueueManager.frameNumberCounter.frameNumber);
            }

            var _loop = function _loop(transformedSource) {
                var chunkLayout = transformedSource.chunkLayout;
                var source = transformedSource.source;
                var chunks = source.chunks;
                var originalChunkSize = chunkLayout.size;
                var chunkDataSize = void 0;
                var visibleChunks = sliceView.visibleChunks.get(chunkLayout);
                if (!visibleChunks) {
                    return 'continue';
                }
                vertexComputationManager.beginSource(gl, shader, sliceView, sliceView.dataToDevice, source.spec, chunkLayout);
                var sourceChunkFormat = source.chunkFormat;
                sourceChunkFormat.beginSource(gl, shader);
                var setChunkDataSize = function setChunkDataSize(newChunkDataSize) {
                    chunkDataSize = newChunkDataSize;
                    vertexComputationManager.setupChunkDataSize(gl, shader, chunkDataSize);
                };
                var presentCount = 0,
                    notPresentCount = 0;
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = _getIterator(visibleChunks), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var key = _step4.value;

                        var chunk = chunks.get(key);
                        if (chunk && chunk.state === ChunkState.GPU_MEMORY) {
                            var newChunkDataSize = chunk.chunkDataSize;
                            if (newChunkDataSize !== chunkDataSize) {
                                setChunkDataSize(newChunkDataSize);
                            }
                            vec3.multiply(chunkPosition, originalChunkSize, chunk.chunkGridPosition);
                            sourceChunkFormat.bindChunk(gl, shader, chunk);
                            vertexComputationManager.drawChunk(gl, shader, chunkPosition);
                            ++presentCount;
                        } else {
                            ++notPresentCount;
                        }
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }

                if ((presentCount !== 0 || notPresentCount !== 0) && renderScaleHistogram !== undefined) {
                    var voxelSize = transformedSource.voxelSize;
                    // TODO(jbms): replace median hack with more accurate estimate, e.g. based on ellipsoid
                    // cross section.

                    var medianVoxelSize = medianOf3(voxelSize[0], voxelSize[1], voxelSize[2]);
                    renderScaleHistogram.add(medianVoxelSize, medianVoxelSize / sliceView.pixelSize, presentCount, notPresentCount);
                }
            };

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(visibleSources), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var transformedSource = _step3.value;

                    var _ret = _loop(transformedSource);

                    if (_ret === 'continue') continue;
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            chunkFormat.endDrawing(gl, shader);
            this.endSlice(shader);
        }
    }, {
        key: 'dataType',
        get: function get() {
            return this.sources[0][0].spec.dataType;
        }
    }, {
        key: 'chunkFormat',
        get: function get() {
            return this.sources[0][0].chunkFormat;
        }
    }]);

    return RenderLayer;
}(SliceViewRenderLayer);
//# sourceMappingURL=renderlayer.js.map