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
import { DataType } from '../util/data_type';
// Hue, saturation, and value are in [0, 1] range.
export var glsl_hsvToRgb = '\nvec3 hueToRgb(float hue) {\n  float hue6 = hue * 6.0;\n  float r = abs(hue6 - 3.0) - 1.0;\n  float g = 2.0 - abs(hue6 - 2.0);\n  float b = 2.0 - abs(hue6 - 4.0);\n  return clamp(vec3(r, g, b), 0.0, 1.0);\n}\nvec3 hsvToRgb(vec3 c) {\n  vec3 hueRgb = hueToRgb(c.x);\n  return c.z * ((hueRgb - 1.0) * c.y + 1.0);\n}\n';
export var glsl_uint64 = '\nstruct uint64_t {\n  highp uvec2 value;\n};\nstruct uint64x2_t {\n  highp uvec4 value;\n};\nuint64_t toUint64(uint64_t x) { return x; }\n';
export var glsl_unpackUint64leFromUint32 = [glsl_uint64, '\nuint64_t unpackUint64leFromUint32(highp uvec2 x) {\n  uint64_t result;\n  result.value = x;\n  return result;\n}\nuint64x2_t unpackUint64leFromUint32(highp uvec4 x) {\n  uint64x2_t result;\n  result.value = x;\n  return result;\n}\n'];
export var glsl_equalUint64 = [glsl_uint64, '\nbool equals(uint64_t a, uint64_t b) {\n  return a.value == b.value;\n}\n'];
export var glsl_uint8 = [glsl_uint64, '\nstruct uint8_t {\n  highp uint value;\n};\nstruct uint8x2_t {\n  highp uvec2 value;\n};\nstruct uint8x3_t {\n  highp uvec3 value;\n};\nstruct uint8x4_t {\n  highp uvec4 value;\n};\nhighp uint toRaw(uint8_t x) { return x.value; }\nhighp float toNormalized(uint8_t x) { return float(x.value) / 255.0; }\nhighp uvec2 toRaw(uint8x2_t x) { return x.value; }\nhighp vec2 toNormalized(uint8x2_t x) { return vec2(x.value) / 255.0; }\nhighp uvec3 toRaw(uint8x3_t x) { return x.value; }\nvec3 toNormalized(uint8x3_t x) { return vec3(x.value) / 255.0; }\nhighp uvec4 toRaw(uint8x4_t x) { return x.value; }\nvec4 toNormalized(uint8x4_t x) { return vec4(x.value) / 255.0; }\nuint64_t toUint64(uint8_t x) {\n  uint64_t result;\n  result.value[0] = x.value;\n  result.value[1] = 0u;\n  return result;\n}\n'];
export var glsl_float = '\nfloat toRaw(float x) { return x; }\nfloat toNormalized(float x) { return x; }\nvec2 toRaw(vec2 x) { return x; }\nvec2 toNormalized(vec2 x) { return x; }\nvec3 toRaw(vec3 x) { return x; }\nvec3 toNormalized(vec3 x) { return x; }\nvec4 toRaw(vec4 x) { return x; }\nvec4 toNormalized(vec4 x) { return x; }\n';
export var glsl_uint16 = [glsl_uint64, '\nstruct uint16_t {\n  highp uint value;\n};\nstruct uint16x2_t {\n  highp uvec2 value;\n};\nhighp uint toRaw(uint16_t x) { return x.value; }\nhighp float toNormalized(uint16_t x) { return float(toRaw(x)) / 65535.0; }\nhighp uvec2 toRaw(uint16x2_t x) { return x.value; }\nhighp vec2 toNormalized(uint16x2_t x) { return vec2(toRaw(x)) / 65535.0; }\nuint64_t toUint64(uint16_t x) {\n  uint64_t result;\n  result.value[0] = x.value;\n  result.value[1] = 0u;\n  return result;\n}\n'];
export var glsl_uint32 = [glsl_uint64, '\nstruct uint32_t {\n  highp uint value;\n};\nhighp float toNormalized(uint32_t x) { return float(x.value) / 4294967295.0; }\nhighp uint toRaw(uint32_t x) { return x.value; }\nuint64_t toUint64(uint32_t x) {\n  uint64_t result;\n  result.value[0] = x.value;\n  result.value[1] = 0u;\n  return result;\n}\n'];
export var glsl_getFortranOrderIndex = '\nhighp int getFortranOrderIndex(ivec3 subscripts, ivec3 size) {\n  return subscripts.x + size.x * (subscripts.y + size.y * subscripts.z);\n}\n';
export function getShaderType(dataType) {
    var numComponents = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

    switch (dataType) {
        case DataType.FLOAT32:
            if (numComponents === 1) {
                return 'float';
            }
            if (numComponents > 1 && numComponents <= 4) {
                return 'vec' + numComponents;
            }
            break;
        case DataType.UINT8:
            if (numComponents === 1) {
                return 'uint8_t';
            }
            if (numComponents > 1 && numComponents <= 4) {
                return 'uint8x' + numComponents + '_t';
            }
            break;
        case DataType.UINT16:
            if (numComponents === 1) {
                return 'uint16_t';
            }
            if (numComponents === 2) {
                return 'uint16x2_t';
            }
            break;
        case DataType.UINT32:
            if (numComponents === 1) {
                return 'uint32_t';
            }
            break;
        case DataType.UINT64:
            if (numComponents === 1) {
                return 'uint64_t';
            }
            break;
    }
    throw new Error('No shader type for ' + DataType[dataType] + '[' + numComponents + '].');
}
//# sourceMappingURL=shader_lib.js.map