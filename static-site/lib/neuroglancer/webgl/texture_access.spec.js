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
import { DataType } from '../util/data_type';
import { fragmentShaderTest } from './shader_testing';
import { compute1dTextureLayout, computeTextureFormat, OneDimensionalTextureAccessHelper, OneDimensionalTextureLayout, setOneDimensionalTextureData, TextureFormat } from './texture_access';
function testTextureAccess(dataLength, setLayout) {
    fragmentShaderTest({ outputValue: 'uint' }, function (tester) {
        var gl = tester.gl,
            builder = tester.builder;

        var dataType = DataType.UINT32;
        var numComponents = 1;
        var format = new TextureFormat();
        var layout = new OneDimensionalTextureLayout();
        computeTextureFormat(format, dataType, numComponents);
        var data = new Uint32Array(dataLength);
        for (var i = 0; i < data.length; ++i) {
            data[i] = i;
        }
        setLayout(layout, gl, format.texelsPerElement);
        var accessHelper = new OneDimensionalTextureAccessHelper('textureAccess');
        var textureUnitSymbol = _Symbol('textureUnit');
        accessHelper.defineShader(builder);
        builder.addUniform('highp uint', 'uOffset');
        builder.addTextureSampler('usampler2D', 'uSampler', textureUnitSymbol);
        builder.addFragmentCode(accessHelper.getAccessor('readValue', 'uSampler', dataType, numComponents));
        builder.setFragmentMain('\noutputValue = readValue(uOffset).value;\n');
        tester.build();
        var shader = tester.shader;

        shader.bind();
        accessHelper.setupTextureLayout(gl, shader, layout);
        var textureUnit = shader.textureUnit(textureUnitSymbol);
        var texture = gl.createTexture();
        tester.registerDisposer(function () {
            gl.deleteTexture(texture);
        });
        gl.bindTexture(gl.TEXTURE_2D, texture);
        setOneDimensionalTextureData(gl, layout, format, data);
        gl.bindTexture(gl.TEXTURE_2D, null);
        function testOffset(x) {
            var value = data[x];
            gl.uniform1ui(shader.uniform('uOffset'), x);
            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            tester.execute();
            gl.bindTexture(gl.TEXTURE_2D, null);
            expect(tester.values.outputValue).toBe(value, 'offset = ' + x + ', value = ' + value);
        }
        testOffset(255 /*+ 256 * 256 * 9*/);
        for (var _i = 0; _i < 100; ++_i) {
            testOffset(_i);
        }
        var COUNT = 100;
        for (var _i2 = 0; _i2 < COUNT; ++_i2) {
            var offset = Math.floor(Math.random() * data.length);
            testOffset(offset);
        }
    });
}
function test1dTextureAccess(dataLength) {
    testTextureAccess(dataLength, function (layout, gl, texelsPerElement) {
        compute1dTextureLayout(layout, gl, texelsPerElement, dataLength);
    });
}
describe('one_dimensional_texture_access', function () {
    it('uint32 access works correctly for 1-D 128*128*128', function () {
        test1dTextureAccess(128 * 128 * 128);
    });
});
//# sourceMappingURL=texture_access.spec.js.map