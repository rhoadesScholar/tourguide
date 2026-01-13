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
import { SingleTextureChunkFormat, SingleTextureVolumeChunk } from './single_texture_chunk_format';
import { DataType } from './volume/base';
import { registerChunkFormatHandler } from './volume/frontend';
import { RefCounted } from '../util/disposable';
import { vec3Key } from '../util/geom';
import { Uint64 } from '../util/uint64';
import { getShaderType } from '../webgl/shader_lib';
import { computeTextureFormat, setThreeDimensionalTextureData, ThreeDimensionalTextureAccessHelper } from '../webgl/texture_access';

var TextureLayout = function (_RefCounted) {
    _inherits(TextureLayout, _RefCounted);

    function TextureLayout(chunkDataSize, numChannels) {
        _classCallCheck(this, TextureLayout);

        var _this = _possibleConstructorReturn(this, (TextureLayout.__proto__ || _Object$getPrototypeOf(TextureLayout)).call(this));

        _this.chunkDataSize = chunkDataSize;
        _this.numChannels = numChannels;
        return _this;
    }

    _createClass(TextureLayout, null, [{
        key: 'get',
        value: function get(gl, chunkDataSize, numChannels) {
            return gl.memoize.get('sliceview.UncompressedTextureLayout:' + vec3Key(chunkDataSize) + ',' + numChannels, function () {
                return new TextureLayout(chunkDataSize, numChannels);
            });
        }
    }]);

    return TextureLayout;
}(RefCounted);

export var ChunkFormat = function (_SingleTextureChunkFo) {
    _inherits(ChunkFormat, _SingleTextureChunkFo);

    function ChunkFormat(_gl, dataType, numChannels, key) {
        _classCallCheck(this, ChunkFormat);

        var _this2 = _possibleConstructorReturn(this, (ChunkFormat.__proto__ || _Object$getPrototypeOf(ChunkFormat)).call(this, key));

        _this2.dataType = dataType;
        _this2.numChannels = numChannels;
        computeTextureFormat(_this2, dataType);
        _this2.textureAccessHelper = new ThreeDimensionalTextureAccessHelper('chunkData');
        return _this2;
    }

    _createClass(ChunkFormat, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(ChunkFormat.prototype.__proto__ || _Object$getPrototypeOf(ChunkFormat.prototype), 'defineShader', this).call(this, builder);
            var textureAccessHelper = this.textureAccessHelper;

            builder.addFragmentCode(textureAccessHelper.getAccessor('readVolumeData', 'uVolumeChunkSampler', this.dataType));
            var numChannels = this.numChannels;

            if (numChannels > 1) {
                builder.addUniform('highp int', 'uChannelStride');
                builder.addFragmentCode('\nhighp int getChannelOffset(highp int channelIndex) {\n  return channelIndex * uChannelStride;\n}\n');
            } else {
                builder.addFragmentCode('highp int getChannelOffset(highp int channelIndex) { return 0; }');
            }
            var shaderType = getShaderType(this.dataType);
            builder.addFragmentCode('\n' + shaderType + ' getDataValue (highp int channelIndex) {\n  highp ivec3 p = getPositionWithinChunk();\n  return readVolumeData(ivec3(p.x, p.y, p.z + getChannelOffset(channelIndex)));\n}\n');
        }
        /**
         * Called each time textureLayout changes while drawing chunks.
         */

    }, {
        key: 'setupTextureLayout',
        value: function setupTextureLayout(gl, shader, textureLayout) {
            if (this.numChannels > 1) {
                gl.uniform1i(shader.uniform('uChannelStride'), textureLayout.chunkDataSize[2]);
            }
        }
    }, {
        key: 'getTextureLayout',
        value: function getTextureLayout(gl, chunkDataSize) {
            return TextureLayout.get(gl, chunkDataSize, this.numChannels);
        }
    }, {
        key: 'setTextureData',
        value: function setTextureData(gl, textureLayout, data) {
            var chunkDataSize = textureLayout.chunkDataSize;

            setThreeDimensionalTextureData(gl, this, data, chunkDataSize[0], chunkDataSize[1], chunkDataSize[2] * this.numChannels);
        }
    }, {
        key: 'shaderSamplerType',
        get: function get() {
            return this.samplerPrefix + 'sampler3D';
        }
    }], [{
        key: 'get',
        value: function get(gl, dataType, numChannels) {
            var key = 'sliceview.UncompressedChunkFormat:' + dataType + ':' + numChannels;
            return gl.memoize.get(key, function () {
                return new ChunkFormat(gl, dataType, numChannels, key);
            });
        }
    }]);

    return ChunkFormat;
}(SingleTextureChunkFormat);
export var UncompressedVolumeChunk = function (_SingleTextureVolumeC) {
    _inherits(UncompressedVolumeChunk, _SingleTextureVolumeC);

    function UncompressedVolumeChunk() {
        _classCallCheck(this, UncompressedVolumeChunk);

        return _possibleConstructorReturn(this, (UncompressedVolumeChunk.__proto__ || _Object$getPrototypeOf(UncompressedVolumeChunk)).apply(this, arguments));
    }

    _createClass(UncompressedVolumeChunk, [{
        key: 'setTextureData',
        value: function setTextureData(gl) {
            var source = this.source;
            var chunkFormatHandler = source.chunkFormatHandler;
            var chunkFormat = chunkFormatHandler.chunkFormat;

            var textureLayout = void 0;
            if (this.chunkDataSize === source.spec.chunkDataSize) {
                this.textureLayout = textureLayout = chunkFormatHandler.textureLayout.addRef();
            } else {
                this.textureLayout = textureLayout = chunkFormat.getTextureLayout(gl, this.chunkDataSize);
            }
            this.chunkFormat.setTextureData(gl, textureLayout, this.data);
        }
    }, {
        key: 'getChannelValueAt',
        value: function getChannelValueAt(dataPosition, channel) {
            var chunkFormat = this.chunkFormat;

            var chunkDataSize = this.chunkDataSize;
            var index = dataPosition[0] + chunkDataSize[0] * (dataPosition[1] + chunkDataSize[1] * (dataPosition[2] + chunkDataSize[2] * channel));
            var dataType = chunkFormat.dataType;
            var data = this.data;
            switch (dataType) {
                case DataType.UINT8:
                case DataType.FLOAT32:
                case DataType.UINT16:
                case DataType.UINT32:
                    return data[index];
                case DataType.UINT64:
                    {
                        var index2 = index * 2;
                        return new Uint64(data[index2], data[index2 + 1]);
                    }
            }
            throw new Error('Invalid data type: ' + dataType);
        }
    }]);

    return UncompressedVolumeChunk;
}(SingleTextureVolumeChunk);
export var UncompressedChunkFormatHandler = function (_RefCounted2) {
    _inherits(UncompressedChunkFormatHandler, _RefCounted2);

    function UncompressedChunkFormatHandler(gl, spec) {
        _classCallCheck(this, UncompressedChunkFormatHandler);

        var _this4 = _possibleConstructorReturn(this, (UncompressedChunkFormatHandler.__proto__ || _Object$getPrototypeOf(UncompressedChunkFormatHandler)).call(this));

        _this4.chunkFormat = _this4.registerDisposer(ChunkFormat.get(gl, spec.dataType, spec.numChannels));
        _this4.textureLayout = _this4.registerDisposer(_this4.chunkFormat.getTextureLayout(gl, spec.chunkDataSize));
        return _this4;
    }

    _createClass(UncompressedChunkFormatHandler, [{
        key: 'getChunk',
        value: function getChunk(source, x) {
            return new UncompressedVolumeChunk(source, x);
        }
    }]);

    return UncompressedChunkFormatHandler;
}(RefCounted);
registerChunkFormatHandler(function (gl, spec) {
    if (spec.compressedSegmentationBlockSize == null) {
        return new UncompressedChunkFormatHandler(gl, spec);
    }
    return null;
});
//# sourceMappingURL=uncompressed_chunk_format.js.map