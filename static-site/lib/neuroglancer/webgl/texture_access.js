import _toConsumableArray from 'babel-runtime/helpers/toConsumableArray';
import _createClass from 'babel-runtime/helpers/createClass';
import _Math$log from 'babel-runtime/core-js/math/log2';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
/**
 * @file
 * Facilities for reading various data types from 2-D and 3-D WebGL textures.
 *
 * WebGL2 only supports 2-D and 3-D textures, and because implementations typically limit the size
 * of each dimension, a large 1-D array has to be fit to a rectangular 2-D texture, which may
 * require padding.
 */
import { maybePadArray } from '../util/array';
import { DataType } from '../util/data_type';
import { getShaderType, glsl_float, glsl_uint16, glsl_uint32, glsl_uint64, glsl_uint8, glsl_unpackUint64leFromUint32 } from './shader_lib';
import { setRawTexture3DParameters, setRawTextureParameters } from './texture';
export var OneDimensionalTextureLayout = function OneDimensionalTextureLayout() {
    _classCallCheck(this, OneDimensionalTextureLayout);
};
export var TextureFormat = function TextureFormat() {
    _classCallCheck(this, TextureFormat);
};
export var integerTextureFormatForNumComponents = [-1, WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.RG_INTEGER, WebGL2RenderingContext.RGB_INTEGER, WebGL2RenderingContext.RGBA_INTEGER];
export var floatTextureFormatForNumComponents = [-1, WebGL2RenderingContext.RED, WebGL2RenderingContext.RG, WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGBA];
export var textureSelectorForNumComponents = ['', 'r', 'rg', 'rgb', 'rgba'];
export var internalUint8FormatForNumComponents = [-1, WebGL2RenderingContext.R8UI, WebGL2RenderingContext.RG8UI, WebGL2RenderingContext.RGB8UI, WebGL2RenderingContext.RGBA8UI];
export var internalUint16FormatForNumComponents = [-1, WebGL2RenderingContext.R16UI, WebGL2RenderingContext.RG16UI, WebGL2RenderingContext.RGB16UI, WebGL2RenderingContext.RGBA16UI];
export var internalUint32FormatForNumComponents = [-1, WebGL2RenderingContext.R32UI, WebGL2RenderingContext.RG32UI, WebGL2RenderingContext.RGB32UI, WebGL2RenderingContext.RGBA32UI];
export var internalFloatFormatForNumComponents = [-1, WebGL2RenderingContext.R32F, WebGL2RenderingContext.RG32F, WebGL2RenderingContext.RGB32F, WebGL2RenderingContext.RGBA32F];
export function getSamplerPrefixForDataType(dataType) {
    return dataType === DataType.FLOAT32 ? '' : 'u';
}
/**
 * Fills in a OneDimensionalTextureFormat object with the suitable texture format for the specified
 * DataType and number of components.
 */
export function computeTextureFormat(format, dataType) {
    var numComponents = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

    switch (dataType) {
        case DataType.UINT8:
            if (numComponents < 1 || numComponents > 4) {
                break;
            }
            format.texelsPerElement = 1;
            format.textureInternalFormat = internalUint8FormatForNumComponents[numComponents];
            format.textureFormat = integerTextureFormatForNumComponents[numComponents];
            format.texelType = WebGL2RenderingContext.UNSIGNED_BYTE;
            format.arrayElementsPerTexel = numComponents;
            format.arrayConstructor = Uint8Array;
            format.samplerPrefix = 'u';
            return format;
        case DataType.UINT16:
            if (numComponents < 1 || numComponents > 4) {
                break;
            }
            format.texelsPerElement = 1;
            format.textureInternalFormat = internalUint16FormatForNumComponents[numComponents];
            format.textureFormat = integerTextureFormatForNumComponents[numComponents];
            format.texelType = WebGL2RenderingContext.UNSIGNED_SHORT;
            format.arrayElementsPerTexel = numComponents;
            format.arrayConstructor = Uint16Array;
            format.samplerPrefix = 'u';
            return format;
        case DataType.UINT64:
            if (numComponents < 1 || numComponents > 2) {
                break;
            }
            format.texelsPerElement = 1;
            format.textureInternalFormat = internalUint32FormatForNumComponents[numComponents * 2];
            format.textureFormat = integerTextureFormatForNumComponents[numComponents * 2];
            format.texelType = WebGL2RenderingContext.UNSIGNED_INT;
            format.arrayElementsPerTexel = 2 * numComponents;
            format.arrayConstructor = Uint32Array;
            format.samplerPrefix = 'u';
            return format;
        case DataType.UINT32:
            if (numComponents < 1 || numComponents > 4) {
                break;
            }
            format.texelsPerElement = 1;
            format.textureInternalFormat = internalUint32FormatForNumComponents[numComponents];
            format.textureFormat = integerTextureFormatForNumComponents[numComponents];
            format.texelType = WebGL2RenderingContext.UNSIGNED_INT;
            format.arrayElementsPerTexel = 1;
            format.arrayConstructor = Uint32Array;
            format.samplerPrefix = 'u';
            return format;
        case DataType.FLOAT32:
            if (numComponents < 1 || numComponents > 4) {
                break;
            }
            format.texelsPerElement = 1;
            format.textureInternalFormat = internalFloatFormatForNumComponents[numComponents];
            format.textureFormat = floatTextureFormatForNumComponents[numComponents];
            format.texelType = WebGL2RenderingContext.FLOAT;
            format.arrayElementsPerTexel = numComponents;
            format.arrayConstructor = Float32Array;
            format.samplerPrefix = '';
            return format;
    }
    throw new Error('No supported texture format for ' + DataType[dataType] + '[' + numComponents + '].');
}
export function compute1dTextureLayout(layout, gl, texelsPerElement, numElements) {
    var maxTextureSize = gl.maxTextureSize;

    if (numElements * texelsPerElement > maxTextureSize * maxTextureSize) {
        throw new Error('Number of elements exceeds maximum texture size: ' + texelsPerElement + ' * ' + numElements);
    }
    var minX = Math.ceil(numElements / maxTextureSize);
    var textureXBits = layout.textureXBits = Math.ceil(_Math$log(minX));
    layout.textureWidth = (1 << textureXBits) * texelsPerElement;
    layout.textureHeight = Math.ceil(numElements / (1 << textureXBits));
}
export function setOneDimensionalTextureData(gl, textureLayout, format, data) {
    var arrayConstructor = format.arrayConstructor,
        arrayElementsPerTexel = format.arrayElementsPerTexel,
        textureInternalFormat = format.textureInternalFormat,
        textureFormat = format.textureFormat;
    var textureWidth = textureLayout.textureWidth,
        textureHeight = textureLayout.textureHeight;

    var requiredSize = textureWidth * textureHeight * arrayElementsPerTexel;
    if (data.constructor !== arrayConstructor) {
        data = new arrayConstructor(data.buffer, data.byteOffset, data.byteLength / arrayConstructor.BYTES_PER_ELEMENT);
    }
    var padded = maybePadArray(data, requiredSize);
    gl.pixelStorei(WebGL2RenderingContext.UNPACK_ALIGNMENT, 1);
    setRawTextureParameters(gl);
    gl.texImage2D(WebGL2RenderingContext.TEXTURE_2D,
    /*level=*/0, textureInternalFormat,
    /*width=*/textureWidth,
    /*height=*/textureHeight,
    /*border=*/0, textureFormat, format.texelType, padded);
}
export function setThreeDimensionalTextureData(gl, format, data, width, height, depth) {
    var arrayConstructor = format.arrayConstructor,
        textureInternalFormat = format.textureInternalFormat,
        textureFormat = format.textureFormat,
        texelsPerElement = format.texelsPerElement;

    if (data.constructor !== arrayConstructor) {
        data = new arrayConstructor(data.buffer, data.byteOffset, data.byteLength / arrayConstructor.BYTES_PER_ELEMENT);
    }
    gl.pixelStorei(WebGL2RenderingContext.UNPACK_ALIGNMENT, 1);
    setRawTexture3DParameters(gl);
    gl.texImage3D(WebGL2RenderingContext.TEXTURE_3D,
    /*level=*/0, textureInternalFormat,
    /*width=*/width * texelsPerElement,
    /*height=*/height,
    /*depth=*/depth,
    /*border=*/0, textureFormat, format.texelType, data);
}
function getShaderCodeForDataType(dataType) {
    switch (dataType) {
        case DataType.UINT8:
            return glsl_uint8;
        case DataType.UINT16:
            return glsl_uint16;
        case DataType.UINT32:
            return glsl_uint32;
        case DataType.UINT64:
            return glsl_uint64;
        case DataType.FLOAT32:
            return glsl_float;
    }
}
function getAccessorFunction(functionName, readTextureValue, samplerName, indexType, dataType, numComponents) {
    var shaderType = getShaderType(dataType, numComponents);
    var parts = [getShaderCodeForDataType(dataType)];
    var code = '\n' + shaderType + ' ' + functionName + '(' + indexType + ' index) {\n';
    switch (dataType) {
        case DataType.UINT8:
        case DataType.UINT16:
        case DataType.UINT32:
            code += '\n  ' + shaderType + ' result;\n  highp uvec4 temp;\n  ' + readTextureValue + '(' + samplerName + ', index, temp);\n  result.value = temp.' + textureSelectorForNumComponents[numComponents] + ';\n  return result;\n';
            break;
        case DataType.UINT64:
            parts.push(glsl_unpackUint64leFromUint32);
            code += '\n  highp uvec4 temp;\n  ' + readTextureValue + '(' + samplerName + ', index, temp);\n  return unpackUint64leFromUint32(temp.' + textureSelectorForNumComponents[numComponents * 2] + ');\n';
            break;
        case DataType.FLOAT32:
            parts.push(glsl_float);
            code += '\n  highp vec4 temp;\n  ' + readTextureValue + '(' + samplerName + ', index, temp);\n  return temp.' + textureSelectorForNumComponents[numComponents] + ';\n';
            break;
    }
    code += '\n}\n';
    parts.push(code);
    return parts;
}
export var OneDimensionalTextureAccessHelper = function () {
    function OneDimensionalTextureAccessHelper(key) {
        _classCallCheck(this, OneDimensionalTextureAccessHelper);

        this.key = key;
        this.uniformName = 'uTextureXBits_' + this.key;
        this.readTextureValue = 'readTextureValue_' + this.key;
    }

    _createClass(OneDimensionalTextureAccessHelper, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            var uniformName = this.uniformName;

            builder.addUniform('highp uint', uniformName);
        }
    }, {
        key: 'getReadTextureValueCode',
        value: function getReadTextureValueCode(texelsPerElement, samplerPrefix) {
            var uniformName = this.uniformName;

            var code = '\nvoid ' + this.readTextureValue + '(highp ' + samplerPrefix + 'sampler2D sampler, highp uint index';
            for (var i = 0; i < texelsPerElement; ++i) {
                code += ', out ' + samplerPrefix + 'vec4 output' + i;
            }
            code += ') {\n\n  highp int y = int(index >> ' + uniformName + ');\n  highp int x = int((index - (uint(y) << ' + uniformName + ')) * ' + texelsPerElement + 'u);\n';
            for (var _i = 0; _i < texelsPerElement; ++_i) {
                code += '\n  output' + _i + ' = texelFetch(sampler, ivec2(x + ' + _i + ', y), 0);\n';
            }
            code += '\n}\n';
            return code;
        }
    }, {
        key: 'getAccessor',
        value: function getAccessor(functionName, samplerName, dataType) {
            var numComponents = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;

            var samplerPrefix = getSamplerPrefixForDataType(dataType);
            return [this.getReadTextureValueCode(1, samplerPrefix)].concat(_toConsumableArray(getAccessorFunction(functionName, this.readTextureValue, samplerName, 'highp uint', dataType, numComponents)));
        }
    }, {
        key: 'setupTextureLayout',
        value: function setupTextureLayout(gl, shader, textureLayout) {
            gl.uniform1ui(shader.uniform(this.uniformName), textureLayout.textureXBits);
        }
    }]);

    return OneDimensionalTextureAccessHelper;
}();
export var ThreeDimensionalTextureAccessHelper = function () {
    function ThreeDimensionalTextureAccessHelper(key) {
        _classCallCheck(this, ThreeDimensionalTextureAccessHelper);

        this.key = key;
        this.readTextureValue = 'readTextureValue_' + this.key;
    }

    _createClass(ThreeDimensionalTextureAccessHelper, [{
        key: 'getReadTextureValueCode',
        value: function getReadTextureValueCode(texelsPerElement, samplerPrefix) {
            var code = '\nvoid ' + this.readTextureValue + '(highp ' + samplerPrefix + 'sampler3D sampler, highp ivec3 p';
            for (var i = 0; i < texelsPerElement; ++i) {
                code += ', out ' + samplerPrefix + 'vec4 output' + i;
            }
            code += ') {\n';
            for (var _i2 = 0; _i2 < texelsPerElement; ++_i2) {
                code += '\n  output' + _i2 + ' = texelFetch(sampler, ivec3(p.x * ' + texelsPerElement + ' + ' + _i2 + ', p.y, p.z), 0);\n';
            }
            code += '\n}\n';
            return code;
        }
    }, {
        key: 'getAccessor',
        value: function getAccessor(functionName, samplerName, dataType) {
            var numComponents = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;

            var samplerPrefix = getSamplerPrefixForDataType(dataType);
            return [this.getReadTextureValueCode(1, samplerPrefix)].concat(_toConsumableArray(getAccessorFunction(functionName, this.readTextureValue, samplerName, 'highp ivec3', dataType, numComponents)));
        }
    }]);

    return ThreeDimensionalTextureAccessHelper;
}();
//# sourceMappingURL=texture_access.js.map