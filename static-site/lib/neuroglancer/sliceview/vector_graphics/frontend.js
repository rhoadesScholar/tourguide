import _get from 'babel-runtime/helpers/get';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
import { SliceViewChunk, SliceViewChunkSource } from '../frontend';
import { RenderLayer as GenericSliceViewRenderLayer } from '../renderlayer';
import { Buffer } from '../../webgl/buffer';
import { ShaderGetter } from '../../webgl/dynamic_shader';
export var RenderLayer = function (_GenericSliceViewRend) {
    _inherits(RenderLayer, _GenericSliceViewRend);

    function RenderLayer(multiscaleSource) {
        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$sourceOptions = _ref.sourceOptions,
            sourceOptions = _ref$sourceOptions === undefined ? {} : _ref$sourceOptions;

        _classCallCheck(this, RenderLayer);

        var _this = _possibleConstructorReturn(this, (RenderLayer.__proto__ || _Object$getPrototypeOf(RenderLayer)).call(this, multiscaleSource.chunkManager, multiscaleSource.getSources(sourceOptions), {}));

        _this.shader = undefined;
        _this.rpcId = null;
        _this.shaderGetter = _this.registerDisposer(new ShaderGetter(_this.gl, function (builder) {
            return _this.defineShader(builder);
        }, function () {
            return _this.getShaderKey();
        }));
        return _this;
    }

    _createClass(RenderLayer, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            builder.addFragmentCode('\nvoid emit(vec4 color) {\n  v4f_fragColor = color;\n}\nvoid emitRGBA(vec4 rgba) {\n  emit(vec4(rgba.rgb, rgba.a * uOpacity));\n}\nvoid emitRGB(vec3 rgb) {\n  emit(vec4(rgb, uOpacity));\n}\nvoid emitGrayscale(float value) {\n  emit(vec4(value, value, value, uOpacity));\n}\nvoid emitTransparent() {\n  emit(vec4(0.0, 0.0, 0.0, 0.0));\n}\n');
        }
    }, {
        key: 'beginSlice',
        value: function beginSlice(_sliceView) {
            var shader = this.shaderGetter.get();
            if (shader === undefined) {
                return undefined;
            }
            shader.bind();
            return shader;
        }
    }]);

    return RenderLayer;
}(GenericSliceViewRenderLayer);
export var VectorGraphicsChunk = function (_SliceViewChunk) {
    _inherits(VectorGraphicsChunk, _SliceViewChunk);

    function VectorGraphicsChunk(source, x) {
        _classCallCheck(this, VectorGraphicsChunk);

        var _this2 = _possibleConstructorReturn(this, (VectorGraphicsChunk.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunk)).call(this, source, x));

        _this2.vertexPositions = x['vertexPositions'];
        _this2.numPoints = Math.floor(_this2.vertexPositions.length / 3);
        return _this2;
    }

    _createClass(VectorGraphicsChunk, [{
        key: 'copyToGPU',
        value: function copyToGPU(gl) {
            _get(VectorGraphicsChunk.prototype.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunk.prototype), 'copyToGPU', this).call(this, gl);
            this.vertexBuffer = Buffer.fromData(gl, this.vertexPositions, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
        }
    }, {
        key: 'freeGPUMemory',
        value: function freeGPUMemory(gl) {
            _get(VectorGraphicsChunk.prototype.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunk.prototype), 'freeGPUMemory', this).call(this, gl);
            this.vertexBuffer.dispose();
        }
    }]);

    return VectorGraphicsChunk;
}(SliceViewChunk);
export var VectorGraphicsChunkSource = function (_SliceViewChunkSource) {
    _inherits(VectorGraphicsChunkSource, _SliceViewChunkSource);

    function VectorGraphicsChunkSource() {
        _classCallCheck(this, VectorGraphicsChunkSource);

        return _possibleConstructorReturn(this, (VectorGraphicsChunkSource.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunkSource)).apply(this, arguments));
    }

    _createClass(VectorGraphicsChunkSource, [{
        key: 'getChunk',
        value: function getChunk(x) {
            return new VectorGraphicsChunk(this, x);
        }
        /**
         * Specifies whether the point vertex coordinates are specified in units of voxels rather than
         * nanometers.
         */

    }, {
        key: 'vectorGraphicsCoordinatesInVoxels',
        get: function get() {
            return true;
        }
    }]);

    return VectorGraphicsChunkSource;
}(SliceViewChunkSource);
//# sourceMappingURL=frontend.js.map