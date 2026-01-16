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
import { getObjectId } from '../util/object_id';
import { ShaderBuilder } from './shader';
export function defineCopyFragmentShader(builder) {
    builder.addOutputBuffer('vec4', 'v4f_fragColor', null);
    builder.setFragmentMain('v4f_fragColor = getValue0();');
}
export function elementWiseTextureShader(gl) {
    var shaderModule = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defineCopyFragmentShader;
    var numTextures = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

    return gl.memoize.get('elementWiseTextureShader:' + numTextures + ':' + getObjectId(shaderModule), function () {
        var builder = new ShaderBuilder(gl);
        builder.addVarying('vec2', 'vTexCoord');
        builder.addUniform('sampler2D', 'uSampler', numTextures);
        builder.addInitializer(function (shader) {
            var textureIndices = [];
            for (var i = 0; i < numTextures; ++i) {
                textureIndices[i] = i;
            }
            gl.uniform1iv(shader.uniform('uSampler'), textureIndices);
        });
        for (var i = 0; i < numTextures; ++i) {
            builder.addFragmentCode('\nvec4 getValue' + i + '() {\n  return texture(uSampler[' + i + '], vTexCoord);\n}\n');
        }
        builder.addUniform('mat4', 'uProjectionMatrix');
        builder.require(shaderModule);
        builder.addAttribute('vec4', 'aVertexPosition');
        builder.addAttribute('vec2', 'aTexCoord');
        builder.setVertexMain('vTexCoord = aTexCoord; gl_Position = uProjectionMatrix * aVertexPosition;');
        return builder.build();
    });
}
export function trivialTextureShader(gl) {
    return elementWiseTextureShader(gl, defineCopyFragmentShader, 1);
}
export function trivialColorShader(gl) {
    return gl.memoize.get('trivialColorShader', function () {
        var builder = new ShaderBuilder(gl);
        builder.addVarying('vec4', 'vColor');
        builder.addOutputBuffer('vec4', 'v4f_fragColor', null);
        builder.setFragmentMain('v4f_fragColor = vColor;');
        builder.addAttribute('vec4', 'aVertexPosition');
        builder.addAttribute('vec4', 'aColor');
        builder.addUniform('mat4', 'uProjectionMatrix');
        builder.setVertexMain('vColor = aColor; gl_Position = uProjectionMatrix * aVertexPosition;');
        return builder.build();
    });
}
export function trivialUniformColorShader(gl) {
    return gl.memoize.get('trivialUniformColorShader', function () {
        var builder = new ShaderBuilder(gl);
        builder.addUniform('mat4', 'uProjectionMatrix');
        builder.addAttribute('vec4', 'aVertexPosition');
        builder.addUniform('vec4', 'uColor');
        builder.addOutputBuffer('vec4', 'v4f_fragColor', null);
        builder.setFragmentMain('v4f_fragColor = uColor;');
        builder.setVertexMain('gl_Position = uProjectionMatrix * aVertexPosition;');
        return builder.build();
    });
}
//# sourceMappingURL=trivial_shaders.js.map