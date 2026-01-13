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
import { HashMapUint64, HashSetUint64 } from './hash_table';
import { GPUHashTable, HashMapShaderManager, HashSetShaderManager } from './shader';
import { Uint64 } from '../util/uint64';
import { glsl_unpackUint64leFromUint32 } from '../webgl/shader_lib';
import { fragmentShaderTest } from '../webgl/shader_testing';
import { getRandomUint32 } from '../util/random';
import { hashCombine } from './hash_function';
var COUNT = 100;
describe('gpu_hash.shader', function () {
    it('hashCombineUint32', function () {
        fragmentShaderTest({ outputValue: 'uint' }, function (tester) {
            var gl = tester.gl,
                builder = tester.builder;

            var hashTableShaderManager = new HashSetShaderManager('h');
            hashTableShaderManager.defineShader(builder);
            builder.addUniform('highp uint', 'inputValue');
            builder.addUniform('highp uint', 'hashSeed');
            {
                var s = '\noutputValue = hashCombine(hashSeed, inputValue);\n';
                builder.setFragmentMain(s);
            }
            tester.build();
            var shader = tester.shader;

            shader.bind();
            var testHash = function testHash(hashSeed, inputValue) {
                gl.uniform1ui(shader.uniform('hashSeed'), hashSeed);
                gl.uniform1ui(shader.uniform('inputValue'), inputValue);
                tester.execute();
                var expected = hashCombine(hashSeed, inputValue);
                expect(tester.values.outputValue).toEqual(expected);
            };
            for (var k = 0; k < 50; ++k) {
                testHash(getRandomUint32(), getRandomUint32());
            }
        });
    });
    it('hashCombine', function () {
        fragmentShaderTest({ outputValue: 'uint' }, function (tester) {
            var gl = tester.gl,
                builder = tester.builder;

            var hashTableShaderManager = new HashSetShaderManager('h');
            hashTableShaderManager.defineShader(builder);
            builder.addUniform('highp uvec2', 'inputValue');
            builder.addUniform('highp uint', 'hashSeed');
            {
                var s = '\nuint64_t x;\nx.value = inputValue;\noutputValue = hashCombine(hashSeed, x);\n';
                builder.setFragmentMain(s);
            }
            tester.build();
            var shader = tester.shader;

            shader.bind();
            for (var k = 0; k < 20; ++k) {
                var inputValue = Uint64.random();
                var hashSeed = getRandomUint32();
                gl.uniform1ui(shader.uniform('hashSeed'), hashSeed);
                gl.uniform2ui(shader.uniform('inputValue'), inputValue.low, inputValue.high);
                tester.execute();
                var expected = hashCombine(hashSeed, inputValue.low);
                expected = hashCombine(expected, inputValue.high);
                expect(tester.values.outputValue).toEqual(expected);
            }
        });
    });
    it('GPUHashTable:HashSetUint64', function () {
        fragmentShaderTest({ outputValue: 'uint' }, function (tester) {
            var gl = tester.gl,
                builder = tester.builder;

            var hashTableShaderManager = new HashSetShaderManager('h');
            hashTableShaderManager.defineShader(builder);
            builder.addFragmentCode(glsl_unpackUint64leFromUint32);
            builder.addUniform('highp uvec2', 'inputValue');
            var s = '\noutputValue = uint(h_has(unpackUint64leFromUint32(inputValue)));\n';
            builder.setFragmentMain(s);
            tester.build();
            var shader = tester.shader;

            shader.bind();
            var hashTable = new HashSetUint64();
            var gpuHashTable = tester.registerDisposer(GPUHashTable.get(gl, hashTable));
            var testValues = new Array();
            while (testValues.length < COUNT) {
                var x = Uint64.random();
                if (hashTable.has(x)) {
                    continue;
                }
                testValues.push(x);
                hashTable.add(x);
            }
            var notPresentValues = new Array();
            notPresentValues.push(new Uint64(hashTable.emptyLow, hashTable.emptyHigh));
            while (notPresentValues.length < COUNT) {
                var _x = Uint64.random();
                if (hashTable.has(_x)) {
                    continue;
                }
                notPresentValues.push(_x);
            }
            function checkPresent(x) {
                gl.uniform2ui(shader.uniform('inputValue'), x.low, x.high);
                hashTableShaderManager.enable(gl, shader, gpuHashTable);
                tester.execute();
                return tester.values.outputValue === 1;
            }
            testValues.forEach(function (x, i) {
                expect(hashTable.has(x)).toBe(true, 'cpu: i = ' + i + ', x = ' + x);
                expect(checkPresent(x)).toBe(true, 'gpu: i = ' + i + ', x = ' + x + ', index = ' + hashTable.indexOf(x));
            });
            notPresentValues.forEach(function (x, i) {
                expect(hashTable.has(x)).toBe(false, 'cpu: i = ' + i + ', x = ' + x);
                expect(checkPresent(x)).toBe(false, 'gpu: i = ' + i + ', x = ' + x);
            });
        });
    });
    it('GPUHashTable:HashMapUint64', function () {
        fragmentShaderTest({ isPresent: 'uint', outLow: 'uint', outHigh: 'uint' }, function (tester) {
            var gl = tester.gl,
                builder = tester.builder;

            var shaderManager = new HashMapShaderManager('h');
            shaderManager.defineShader(builder);
            builder.addUniform('highp uvec2', 'inputValue');
            builder.setFragmentMain('\nuint64_t key = unpackUint64leFromUint32(inputValue);\nuint64_t value;\nisPresent = uint(h_get(key, value));\noutLow = value.value[0];\noutHigh = value.value[1];\n');
            tester.build();
            var shader = tester.shader;

            shader.bind();
            var hashTable = new HashMapUint64();
            var gpuHashTable = tester.registerDisposer(GPUHashTable.get(gl, hashTable));
            var testValues = new Array();
            while (testValues.length < COUNT) {
                var x = Uint64.random();
                if (hashTable.has(x)) {
                    continue;
                }
                testValues.push(x);
                hashTable.set(x, Uint64.random());
            }
            var notPresentValues = new Array();
            notPresentValues.push(new Uint64(hashTable.emptyLow, hashTable.emptyHigh));
            while (notPresentValues.length < COUNT) {
                var _x2 = Uint64.random();
                if (hashTable.has(_x2)) {
                    continue;
                }
                notPresentValues.push(_x2);
            }
            function checkPresent(x) {
                gl.uniform2ui(shader.uniform('inputValue'), x.low, x.high);
                shaderManager.enable(gl, shader, gpuHashTable);
                tester.execute();
                var values = tester.values;

                var expectedValue = new Uint64();
                var expectedHas = hashTable.get(x, expectedValue);
                var has = values.isPresent === 1;
                expect(has).toBe(expectedHas, 'x=' + x);
                if (has) {
                    expect(values.outLow).toBe(expectedValue.low, 'x=' + x + ', low');
                    expect(values.outHigh).toBe(expectedValue.high, 'x=' + x + ', high');
                }
            }
            testValues.forEach(function (x, i) {
                expect(hashTable.has(x)).toBe(true, 'cpu: i = ' + i + ', x = ' + x);
                checkPresent(x);
            });
            notPresentValues.forEach(function (x) {
                checkPresent(x);
            });
        });
    });
});
//# sourceMappingURL=shader.spec.js.map