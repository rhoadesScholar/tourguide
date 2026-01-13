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
import { getAttributeTextureFormats, SingleMeshShaderManager, VertexChunkData } from './frontend';
import { fragmentShaderTest } from '../webgl/shader_testing';
describe('single_mesh/frontend', function () {
    it('attributes', function () {
        var attributeNames = ['attrA', 'attrB', 'attrC'];
        var attributeInfo = [];
        var numVertices = 146423;
        var vertexData = new VertexChunkData();
        vertexData.vertexPositions = new Float32Array(numVertices * 3);
        vertexData.vertexNormals = new Float32Array(numVertices * 3);
        for (var i = 0; i < numVertices * 3; ++i) {
            vertexData.vertexPositions[i] = i;
            vertexData.vertexNormals[i] = i + 0.5;
        }
        vertexData.vertexAttributes = [];
        fragmentShaderTest({
            posX: 'float',
            posY: 'float',
            posZ: 'float',
            normX: 'float',
            normY: 'float',
            normZ: 'float'
        }, function (tester) {
            var shaderManager = new SingleMeshShaderManager(attributeNames, attributeInfo, /*fragmentMain=*/'');
            var attributeFormats = getAttributeTextureFormats(attributeInfo);
            var gl = tester.gl,
                builder = tester.builder;

            builder.addUniform('highp uint', 'vertexIndex');
            builder.addVarying('highp vec3', 'vVertexPosition');
            builder.addVarying('highp vec3', 'vVertexNormal');
            shaderManager.defineAttributeAccess(builder, 'vertexIndex');
            builder.addVertexMain('\n  vVertexPosition = vertexPosition;\n  vVertexNormal = vertexNormal;\n');
            builder.setFragmentMain('\n  posX = vVertexPosition.x;\n  posY = vVertexPosition.y;\n  posZ = vVertexPosition.z;\n  normX = vVertexNormal.x;\n  normY = vVertexNormal.y;\n  normZ = vVertexNormal.z;\n');
            vertexData.copyToGPU(gl, attributeFormats);
            tester.build();
            var shader = tester.shader;

            shader.bind();
            var _arr = [0, 1, 2, 32104, 100201, 143212];
            for (var _i = 0; _i < _arr.length; _i++) {
                var index = _arr[_i];
                shaderManager.bindVertexData(gl, shader, vertexData);
                gl.uniform1ui(shader.uniform('vertexIndex'), index);
                tester.execute();
                var values = tester.values;

                var pos = [values.posX, values.posY, values.posZ];
                var norm = [values.normX, values.normY, values.normZ];
                for (var _i2 = 0; _i2 < 3; ++_i2) {
                    expect(pos[_i2]).toEqual(vertexData.vertexPositions[index * 3 + _i2], 'vertexPositions: index=' + index + ', i=' + _i2);
                    expect(norm[_i2]).toEqual(vertexData.vertexNormals[index * 3 + _i2], 'vertexNormals: index=' + index + ', i=' + _i2);
                }
            }
        });
    });
});
//# sourceMappingURL=frontend.spec.js.map