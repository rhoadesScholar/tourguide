import _get from 'babel-runtime/helpers/get';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _Symbol from 'babel-runtime/core-js/symbol';
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
import { VolumeChunk } from './volume/frontend';
import { RefCounted } from '../util/disposable';
import { textureTargetForSamplerType } from '../webgl/shader';
var textureUnitSymbol = _Symbol('SingleTextureVolumeChunk.textureUnit');
var textureLayoutSymbol = _Symbol('SingleTextureVolumeChunk.textureLayout');
export var SingleTextureChunkFormat = function (_RefCounted) {
    _inherits(SingleTextureChunkFormat, _RefCounted);

    function SingleTextureChunkFormat(shaderKey) {
        _classCallCheck(this, SingleTextureChunkFormat);

        var _this = _possibleConstructorReturn(this, (SingleTextureChunkFormat.__proto__ || _Object$getPrototypeOf(SingleTextureChunkFormat)).call(this));

        _this.shaderKey = shaderKey;
        return _this;
    }

    _createClass(SingleTextureChunkFormat, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            builder.addTextureSampler(this.shaderSamplerType, 'uVolumeChunkSampler', textureUnitSymbol);
        }
    }, {
        key: 'beginDrawing',
        value: function beginDrawing(gl, shader) {
            var textureUnit = shader.textureUnit(textureUnitSymbol);
            gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + textureUnit);
            shader[textureLayoutSymbol] = null;
        }
    }, {
        key: 'endDrawing',
        value: function endDrawing(gl, shader) {
            gl.bindTexture(textureTargetForSamplerType[this.shaderSamplerType], null);
            shader[textureLayoutSymbol] = null;
        }
    }, {
        key: 'bindChunk',
        value: function bindChunk(gl, shader, chunk) {
            var textureLayout = chunk.textureLayout;
            var existingTextureLayout = shader[textureLayoutSymbol];
            if (existingTextureLayout !== textureLayout) {
                shader[textureLayoutSymbol] = textureLayout;
                this.setupTextureLayout(gl, shader, textureLayout);
            }
            gl.bindTexture(textureTargetForSamplerType[this.shaderSamplerType], chunk.texture);
        }
        /**
         * Does nothing, but may be overridden by subclass.
         */

    }, {
        key: 'beginSource',
        value: function beginSource(_gl, _shader) {}
    }]);

    return SingleTextureChunkFormat;
}(RefCounted);
export var SingleTextureVolumeChunk = function (_VolumeChunk) {
    _inherits(SingleTextureVolumeChunk, _VolumeChunk);

    function SingleTextureVolumeChunk(source, x) {
        _classCallCheck(this, SingleTextureVolumeChunk);

        var _this2 = _possibleConstructorReturn(this, (SingleTextureVolumeChunk.__proto__ || _Object$getPrototypeOf(SingleTextureVolumeChunk)).call(this, source, x));

        _this2.texture = null;
        _this2.data = x['data'];
        return _this2;
    }

    _createClass(SingleTextureVolumeChunk, [{
        key: 'copyToGPU',
        value: function copyToGPU(gl) {
            _get(SingleTextureVolumeChunk.prototype.__proto__ || _Object$getPrototypeOf(SingleTextureVolumeChunk.prototype), 'copyToGPU', this).call(this, gl);
            var texture = this.texture = gl.createTexture();
            var textureTarget = textureTargetForSamplerType[this.chunkFormat.shaderSamplerType];
            gl.bindTexture(textureTarget, texture);
            this.setTextureData(gl);
            gl.bindTexture(textureTarget, null);
        }
    }, {
        key: 'freeGPUMemory',
        value: function freeGPUMemory(gl) {
            _get(SingleTextureVolumeChunk.prototype.__proto__ || _Object$getPrototypeOf(SingleTextureVolumeChunk.prototype), 'freeGPUMemory', this).call(this, gl);
            gl.deleteTexture(this.texture);
            this.texture = null;
            this.textureLayout.dispose();
            this.textureLayout = null;
        }
    }]);

    return SingleTextureVolumeChunk;
}(VolumeChunk);
//# sourceMappingURL=single_texture_chunk_format.js.map