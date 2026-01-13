import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { ChunkState } from '../../chunk_manager/base';
import { RenderLayer as GenericVectorGraphicsRenderLayer } from './frontend';
import { trackableAlphaValue } from '../../trackable_alpha';
import { trackableFiniteFloat } from '../../trackable_finite_float';
import { trackableVec3 } from '../../trackable_vec3';
import { mat4, vec3 } from '../../util/geom';
import { Buffer } from '../../webgl/buffer';
var tempMat4 = mat4.create();
export var VectorGraphicsLineRenderLayer = function (_GenericVectorGraphic) {
    _inherits(VectorGraphicsLineRenderLayer, _GenericVectorGraphic);

    function VectorGraphicsLineRenderLayer(multiscaleSource) {
        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$opacity = _ref.opacity,
            opacity = _ref$opacity === undefined ? trackableAlphaValue(0.5) : _ref$opacity,
            _ref$lineWidth = _ref.lineWidth,
            lineWidth = _ref$lineWidth === undefined ? trackableFiniteFloat(10.0) : _ref$lineWidth,
            _ref$color = _ref.color,
            color = _ref$color === undefined ? trackableVec3(vec3.fromValues(255.0, 255.0, 255.0)) : _ref$color,
            _ref$sourceOptions = _ref.sourceOptions,
            sourceOptions = _ref$sourceOptions === undefined ? {} : _ref$sourceOptions;

        _classCallCheck(this, VectorGraphicsLineRenderLayer);

        var _this = _possibleConstructorReturn(this, (VectorGraphicsLineRenderLayer.__proto__ || _Object$getPrototypeOf(VectorGraphicsLineRenderLayer)).call(this, multiscaleSource, { sourceOptions: sourceOptions }));

        _this.opacity = opacity;
        _this.registerDisposer(opacity.changed.add(function () {
            _this.redrawNeeded.dispatch();
        }));
        _this.lineWidth = lineWidth;
        _this.registerDisposer(lineWidth.changed.add(function () {
            _this.redrawNeeded.dispatch();
        }));
        _this.color = color;
        _this.registerDisposer(color.changed.add(function () {
            _this.redrawNeeded.dispatch();
        }));
        var gl = _this.gl;
        var vertexIndex = new Float32Array([1, 0, 0, 1, 1, 0, 0, 1]);
        _this.vertexIndexBuffer = _this.registerDisposer(Buffer.fromData(gl, vertexIndex, gl.ARRAY_BUFFER, gl.STATIC_DRAW));
        var normalDirection = new Float32Array([1, 1, -1, -1]);
        _this.normalDirectionBuffer = _this.registerDisposer(Buffer.fromData(gl, normalDirection, gl.ARRAY_BUFFER, gl.STATIC_DRAW));
        return _this;
    }

    _createClass(VectorGraphicsLineRenderLayer, [{
        key: 'getShaderKey',
        value: function getShaderKey() {
            return 'vectorgraphics.VectorGraphicsLineRenderLayer';
        }
    }, {
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(VectorGraphicsLineRenderLayer.prototype.__proto__ || _Object$getPrototypeOf(VectorGraphicsLineRenderLayer.prototype), 'defineShader', this).call(this, builder);
            builder.addUniform('highp float', 'uOpacity');
            builder.addUniform('highp float', 'ulineWidth');
            builder.addUniform('highp vec3', 'uColor');
            builder.addVarying('vec3', 'vNormal');
            builder.addAttribute('highp float', 'aNormalDirection');
            builder.addAttribute('highp vec2', 'aVertexIndex');
            builder.addAttribute('highp vec3', 'aVertexFirst');
            builder.addAttribute('highp vec3', 'aVertexSecond');
            builder.addUniform('highp mat4', 'uProjection');
            builder.setFragmentMain('\nfloat distance = length(vNormal);\n\nfloat antialiasing = 0.5;\n\nif (distance >= 1.0 - antialiasing) {\n  emitRGBA(vec4(uColor, (distance - 1.0) / -antialiasing ));\n}\nelse if (distance < 1.0 - antialiasing) {\n  emitRGB(uColor);\n}\n');
            builder.setVertexMain('\nvec3 direction = vec3(0., 0., 0.);\ndirection.z = aNormalDirection;\n\nvec3 difference = aVertexSecond - aVertexFirst;\ndifference.z = 0.;\n\nvec3 normal = cross(difference, direction);\nnormal = normalize(normal);\nvNormal = normal;\n\nvec4 delta = vec4(normal * ulineWidth, 0.0);\nvec4 pos = vec4(aVertexFirst * aVertexIndex.x + aVertexSecond * aVertexIndex.y, 1.0);\n\ngl_Position = uProjection * (pos + delta);\n');
        }
    }, {
        key: 'beginSlice',
        value: function beginSlice(_sliceView) {
            _get(VectorGraphicsLineRenderLayer.prototype.__proto__ || _Object$getPrototypeOf(VectorGraphicsLineRenderLayer.prototype), 'beginSlice', this).call(this, _sliceView);
            var gl = this.gl;
            var shader = this.shader;
            gl.uniform1f(shader.uniform('uOpacity'), this.opacity.value);
            gl.uniform1f(shader.uniform('ulineWidth'), this.lineWidth.value);
            gl.uniform3fv(shader.uniform('uColor'), this.color.value);
            this.vertexIndexBuffer.bindToVertexAttrib(shader.attribute('aVertexIndex'),
            /*components=*/2);
            this.normalDirectionBuffer.bindToVertexAttrib(shader.attribute('aNormalDirection'),
            /*components=*/1);
            return shader;
        }
    }, {
        key: 'endSlice',
        value: function endSlice(shader) {
            var gl = this.gl;
            gl.disableVertexAttribArray(shader.attribute('aVertexIndex'));
            gl.disableVertexAttribArray(shader.attribute('aNormalDirection'));
            gl.disableVertexAttribArray(shader.attribute('aVertexFirst'));
            gl.disableVertexAttribArray(shader.attribute('aVertexSecond'));
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
                console.log('error: shader undefined');
                return;
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(visibleSources), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var transformedSource = _step.value;

                    var chunkLayout = transformedSource.chunkLayout;
                    var source = transformedSource.source;
                    var voxelSize = source.spec.voxelSize;
                    var chunks = source.chunks;
                    var objectToDataMatrix = tempMat4;
                    mat4.identity(objectToDataMatrix);
                    if (source.vectorGraphicsCoordinatesInVoxels) {
                        mat4.scale(objectToDataMatrix, objectToDataMatrix, voxelSize);
                    }
                    mat4.multiply(objectToDataMatrix, chunkLayout.transform, objectToDataMatrix);
                    // Compute projection matrix that transforms vertex coordinates to device coordinates
                    gl.uniformMatrix4fv(shader.uniform('uProjection'), false, mat4.multiply(tempMat4, sliceView.dataToDevice, objectToDataMatrix));
                    var visibleChunks = sliceView.visibleChunks.get(chunkLayout);
                    if (!visibleChunks) {
                        continue;
                    }
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = _getIterator(visibleChunks), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var key = _step2.value;

                            var chunk = chunks.get(key);
                            if (chunk && chunk.state === ChunkState.GPU_MEMORY) {
                                var numInstances = chunk.numPoints / 2; // Two points == One vector
                                var aVertexFirst = shader.attribute('aVertexFirst');
                                chunk.vertexBuffer.bindToVertexAttrib(aVertexFirst,
                                /*components=*/3,
                                /*attributeType=*/WebGL2RenderingContext.FLOAT,
                                /*normalized=*/false,
                                /*stride=*/6 * 4,
                                /*offset=*/0);
                                gl.vertexAttribDivisor(aVertexFirst, 1);
                                var aVertexSecond = shader.attribute('aVertexSecond');
                                chunk.vertexBuffer.bindToVertexAttrib(aVertexSecond,
                                /*components=*/3,
                                /*attributeType=*/WebGL2RenderingContext.FLOAT,
                                /*normalized=*/false,
                                /*stride=*/6 * 4,
                                /*offset=*/3 * 4);
                                gl.vertexAttribDivisor(aVertexSecond, 1);
                                gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, numInstances);
                                gl.vertexAttribDivisor(aVertexFirst, 0);
                                gl.vertexAttribDivisor(aVertexSecond, 0);
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

            this.endSlice(shader);
        }
    }]);

    return VectorGraphicsLineRenderLayer;
}(GenericVectorGraphicsRenderLayer);
//# sourceMappingURL=vector_graphics_line_renderlayer.js.map