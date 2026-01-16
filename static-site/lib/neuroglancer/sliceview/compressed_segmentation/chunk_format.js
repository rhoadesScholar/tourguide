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
import { readSingleChannelValue as readSingleChannelValueUint32 } from './decode_uint32';
import { readSingleChannelValue as readSingleChannelValueUint64 } from './decode_uint64';
import { SingleTextureChunkFormat, SingleTextureVolumeChunk } from '../single_texture_chunk_format';
import { DataType } from '../volume/base';
import { registerChunkFormatHandler } from '../volume/frontend';
import { RefCounted } from '../../util/disposable';
import { vec3, vec3Key } from '../../util/geom';
import { Uint64 } from '../../util/uint64';
import { getShaderType, glsl_getFortranOrderIndex, glsl_uint32, glsl_uint64 } from '../../webgl/shader_lib';
import { compute1dTextureLayout, computeTextureFormat, OneDimensionalTextureAccessHelper, setOneDimensionalTextureData, TextureFormat } from '../../webgl/texture_access';

var TextureLayout = function (_RefCounted) {
    _inherits(TextureLayout, _RefCounted);

    function TextureLayout(gl, chunkDataSize, subchunkSize, dataLength) {
        _classCallCheck(this, TextureLayout);

        var _this = _possibleConstructorReturn(this, (TextureLayout.__proto__ || _Object$getPrototypeOf(TextureLayout)).call(this));

        _this.chunkDataSize = chunkDataSize;
        _this.subchunkSize = subchunkSize;
        compute1dTextureLayout(_this, gl, /*texelsPerElement=*/1, dataLength);
        var subchunkGridSize = _this.subchunkGridSize = vec3.create();
        for (var i = 0; i < 3; ++i) {
            subchunkGridSize[i] = Math.ceil(chunkDataSize[i] / subchunkSize[i]);
        }
        return _this;
    }

    _createClass(TextureLayout, null, [{
        key: 'get',
        value: function get(gl, chunkDataSize, subchunkSize, dataLength) {
            return gl.memoize.get('sliceview.CompressedSegmentationTextureLayout:' + vec3Key(chunkDataSize) + ',' + (vec3Key(subchunkSize) + ',' + dataLength), function () {
                return new TextureLayout(gl, chunkDataSize, subchunkSize, dataLength);
            });
        }
    }]);

    return TextureLayout;
}(RefCounted);

var textureFormat = computeTextureFormat(new TextureFormat(), DataType.UINT32);
export var ChunkFormat = function (_SingleTextureChunkFo) {
    _inherits(ChunkFormat, _SingleTextureChunkFo);

    function ChunkFormat(dataType, subchunkSize, numChannels, key) {
        _classCallCheck(this, ChunkFormat);

        var _this2 = _possibleConstructorReturn(this, (ChunkFormat.__proto__ || _Object$getPrototypeOf(ChunkFormat)).call(this, key));

        _this2.dataType = dataType;
        _this2.subchunkSize = subchunkSize;
        _this2.numChannels = numChannels;
        _this2.textureAccessHelper = new OneDimensionalTextureAccessHelper('chunkData');
        return _this2;
    }

    _createClass(ChunkFormat, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(ChunkFormat.prototype.__proto__ || _Object$getPrototypeOf(ChunkFormat.prototype), 'defineShader', this).call(this, builder);
            var textureAccessHelper = this.textureAccessHelper;

            textureAccessHelper.defineShader(builder);
            var local = function local(x) {
                return 'compressedSegmentationChunkFormat_' + x;
            };
            builder.addUniform('highp ivec3', 'uSubchunkGridSize');
            builder.addUniform('highp ivec3', 'uSubchunkSize');
            builder.addFragmentCode(glsl_getFortranOrderIndex);
            var dataType = this.dataType;

            var glslType = getShaderType(dataType);
            if (dataType === DataType.UINT64) {
                builder.addFragmentCode(glsl_uint64);
            } else {
                builder.addFragmentCode(glsl_uint32);
            }
            builder.addFragmentCode(textureAccessHelper.getAccessor(local('readTextureValue'), 'uVolumeChunkSampler', DataType.UINT32, 1));
            var fragmentCode = '\nuint ' + local('getChannelOffset') + '(int channelIndex) {\n  if (channelIndex == 0) {\n    return ' + this.numChannels + 'u;\n  }\n  return ' + local('readTextureValue') + '(uint(channelIndex)).value;\n}\n' + glslType + ' getDataValue (int channelIndex) {\n  ivec3 chunkPosition = getPositionWithinChunk();\n\n  // TODO: maybe premultiply this and store as uniform.\n  ivec3 subchunkGridPosition = chunkPosition / uSubchunkSize;\n  int subchunkGridOffset = getFortranOrderIndex(subchunkGridPosition, uSubchunkGridSize);\n\n  int channelOffset = int(' + local('getChannelOffset') + '(channelIndex));\n\n  // TODO: Maybe just combine this offset into subchunkGridStrides.\n  int subchunkHeaderOffset = subchunkGridOffset * 2 + channelOffset;\n\n  highp uint subchunkHeader0 = ' + local('readTextureValue') + '(uint(subchunkHeaderOffset)).value;\n  highp uint subchunkHeader1 = ' + local('readTextureValue') + '(uint(subchunkHeaderOffset + 1)).value;\n  highp uint outputValueOffset = (subchunkHeader0 & 0xFFFFFFu) + uint(channelOffset);\n  highp uint encodingBits = subchunkHeader0 >> 24u;\n  if (encodingBits > 0u) {\n    ivec3 subchunkPosition = chunkPosition - subchunkGridPosition * uSubchunkSize;\n    int subchunkOffset = getFortranOrderIndex(subchunkPosition, uSubchunkSize);\n    uint encodedValueBaseOffset = subchunkHeader1 + uint(channelOffset);\n    uint encodedValueOffset = encodedValueBaseOffset + uint(subchunkOffset) * encodingBits / 32u;\n    uint encodedValue = ' + local('readTextureValue') + '(encodedValueOffset).value;\n    uint wordOffset = uint(subchunkOffset) * encodingBits % 32u;\n    uint encodedValueShifted = encodedValue >> wordOffset;\n    uint decodedValue = encodedValueShifted - (encodedValueShifted >> encodingBits << encodingBits);\n    outputValueOffset += decodedValue * ' + (this.dataType === DataType.UINT64 ? '2u' : '1u') + ';\n  }\n  ' + glslType + ' result;\n';
            if (dataType === DataType.UINT64) {
                fragmentCode += '\n  result.value[0] = ' + local('readTextureValue') + '(outputValueOffset).value;\n  result.value[1] = ' + local('readTextureValue') + '(outputValueOffset+1u).value;\n';
            } else {
                fragmentCode += '\n  result.value = ' + local('readTextureValue') + '(outputValueOffset).value;\n';
            }
            fragmentCode += '\n  return result;\n}\n';
            builder.addFragmentCode(fragmentCode);
        }
        /**
         * Called each time textureLayout changes while drawing chunks.
         */

    }, {
        key: 'setupTextureLayout',
        value: function setupTextureLayout(gl, shader, textureLayout) {
            var subchunkGridSize = textureLayout.subchunkGridSize;

            gl.uniform3i(shader.uniform('uSubchunkGridSize'), subchunkGridSize[0], subchunkGridSize[1], subchunkGridSize[2]);
            this.textureAccessHelper.setupTextureLayout(gl, shader, textureLayout);
        }
    }, {
        key: 'setTextureData',
        value: function setTextureData(gl, textureLayout, data) {
            setOneDimensionalTextureData(gl, textureLayout, textureFormat, data);
        }
    }, {
        key: 'getTextureLayout',
        value: function getTextureLayout(gl, chunkDataSize, dataLength) {
            return TextureLayout.get(gl, chunkDataSize, this.subchunkSize, dataLength);
        }
    }, {
        key: 'beginSource',
        value: function beginSource(gl, shader) {
            _get(ChunkFormat.prototype.__proto__ || _Object$getPrototypeOf(ChunkFormat.prototype), 'beginSource', this).call(this, gl, shader);
            var subchunkSize = this.subchunkSize;

            gl.uniform3i(shader.uniform('uSubchunkSize'), subchunkSize[0], subchunkSize[1], subchunkSize[2]);
        }
    }, {
        key: 'shaderSamplerType',
        get: function get() {
            return 'usampler2D';
        }
    }], [{
        key: 'get',
        value: function get(gl, dataType, subchunkSize, numChannels) {
            var shaderKey = 'sliceview.CompressedSegmentationChunkFormat:' + dataType + ':' + numChannels;
            var cacheKey = shaderKey + ':' + vec3Key(subchunkSize);
            return gl.memoize.get(cacheKey, function () {
                return new ChunkFormat(dataType, subchunkSize, numChannels, shaderKey);
            });
        }
    }]);

    return ChunkFormat;
}(SingleTextureChunkFormat);
export var CompressedSegmentationVolumeChunk = function (_SingleTextureVolumeC) {
    _inherits(CompressedSegmentationVolumeChunk, _SingleTextureVolumeC);

    function CompressedSegmentationVolumeChunk() {
        _classCallCheck(this, CompressedSegmentationVolumeChunk);

        return _possibleConstructorReturn(this, (CompressedSegmentationVolumeChunk.__proto__ || _Object$getPrototypeOf(CompressedSegmentationVolumeChunk)).apply(this, arguments));
    }

    _createClass(CompressedSegmentationVolumeChunk, [{
        key: 'setTextureData',
        value: function setTextureData(gl) {
            var data = this.data;
            var chunkFormat = this.chunkFormat;

            var textureLayout = this.textureLayout = chunkFormat.getTextureLayout(gl, this.chunkDataSize, data.length);
            chunkFormat.setTextureData(gl, textureLayout, data);
        }
    }, {
        key: 'getChannelValueAt',
        value: function getChannelValueAt(dataPosition, channel) {
            var chunkDataSize = this.chunkDataSize,
                chunkFormat = this.chunkFormat;
            var data = this.data;

            var offset = data[channel];
            if (chunkFormat.dataType === DataType.UINT64) {
                var result = new Uint64();
                readSingleChannelValueUint64(result, data, /*baseOffset=*/offset, chunkDataSize, chunkFormat.subchunkSize, dataPosition);
                return result;
            } else {
                return readSingleChannelValueUint32(data, /*baseOffset=*/offset, chunkDataSize, chunkFormat.subchunkSize, dataPosition);
            }
        }
    }]);

    return CompressedSegmentationVolumeChunk;
}(SingleTextureVolumeChunk);
export var CompressedSegmentationChunkFormatHandler = function (_RefCounted2) {
    _inherits(CompressedSegmentationChunkFormatHandler, _RefCounted2);

    function CompressedSegmentationChunkFormatHandler(gl, spec) {
        _classCallCheck(this, CompressedSegmentationChunkFormatHandler);

        var _this4 = _possibleConstructorReturn(this, (CompressedSegmentationChunkFormatHandler.__proto__ || _Object$getPrototypeOf(CompressedSegmentationChunkFormatHandler)).call(this));

        var dataType = spec.dataType;

        if (dataType !== DataType.UINT64 && dataType !== DataType.UINT32) {
            throw new Error('Unsupported compressed segmentation data type: ' + DataType[dataType]);
        }
        _this4.chunkFormat = _this4.registerDisposer(ChunkFormat.get(gl, spec.dataType, spec.compressedSegmentationBlockSize, spec.numChannels));
        return _this4;
    }

    _createClass(CompressedSegmentationChunkFormatHandler, [{
        key: 'getChunk',
        value: function getChunk(source, x) {
            return new CompressedSegmentationVolumeChunk(source, x);
        }
    }]);

    return CompressedSegmentationChunkFormatHandler;
}(RefCounted);
registerChunkFormatHandler(function (gl, spec) {
    if (spec.compressedSegmentationBlockSize != null) {
        return new CompressedSegmentationChunkFormatHandler(gl, spec);
    }
    return null;
});
//# sourceMappingURL=chunk_format.js.map