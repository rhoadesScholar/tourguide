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
import { IndexBufferAttributeHelper, makeIndexBuffer } from './index_emulation';
import { fragmentShaderTest } from './shader_testing';
describe('webgl/index_emulation', function () {
    it('indexBuffer', function () {
        fragmentShaderTest({ outputValue: 'uint' }, function (tester) {
            var gl = tester.gl,
                builder = tester.builder;

            var helper = new IndexBufferAttributeHelper('aVertexIndex');
            helper.defineShader(builder);
            builder.addVarying('highp uint', 'vVertexIndex', 'flat');
            builder.addVertexMain('vVertexIndex = aVertexIndex;');
            builder.setFragmentMain('outputValue = vVertexIndex;');
            tester.build();
            var shader = tester.shader;

            shader.bind();
            var _arr = [5, 1, 143210];
            for (var _i = 0; _i < _arr.length; _i++) {
                var indexValue = _arr[_i];
                var indices = Uint32Array.of(indexValue, indexValue, indexValue, indexValue);
                var indexBuffer = makeIndexBuffer(gl, indices);
                try {
                    helper.bind(indexBuffer, shader);
                    tester.execute();
                    helper.disable(shader);
                    expect(tester.values.outputValue).toEqual(indexValue);
                } finally {
                    indexBuffer.dispose();
                }
            }
        });
    });
});
//# sourceMappingURL=index_emulation.spec.js.map