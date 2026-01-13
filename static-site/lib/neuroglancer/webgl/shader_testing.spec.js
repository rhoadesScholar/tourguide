import _Math$log from 'babel-runtime/core-js/math/log2';
import _Number$isFinite from 'babel-runtime/core-js/number/is-finite';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Number$isNaN from 'babel-runtime/core-js/number/is-nan';
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
import { fragmentShaderTest } from './shader_testing';
describe('FragmentShaderTester', function () {
    it('uint passthrough', function () {
        fragmentShaderTest({ outputValue: 'uint' }, function (tester) {
            var gl = tester.gl,
                builder = tester.builder;

            builder.addUniform('highp uint', 'inputValue');
            builder.setFragmentMain('outputValue = inputValue;');
            tester.build();
            var shader = tester.shader;

            shader.bind();
            var _arr = [0, 1, 42, 343432, 4294967295];
            for (var _i = 0; _i < _arr.length; _i++) {
                var inputValue = _arr[_i];
                gl.uniform1ui(shader.uniform('inputValue'), inputValue);
                tester.execute();
                var values = tester.values;
                expect(values.outputValue).toEqual(inputValue);
            }
        });
    });
    it('float passthrough', function () {
        fragmentShaderTest({ outputValue: 'float' }, function (tester) {
            var gl = tester.gl,
                builder = tester.builder;

            builder.addUniform('highp float', 'inputValue');
            builder.setFragmentMain('outputValue = inputValue;');
            tester.build();
            function generateRandomNumber() {
                var buf = new Uint32Array(1);
                var temp = new Float32Array(buf.buffer);
                do {
                    crypto.getRandomValues(buf);
                } while (!_Number$isNaN(temp[0]));
                return temp[0];
            }
            var shader = tester.shader;

            shader.bind();
            var testValues = [0, 1, -1, 2, -2, 3, -3, 5, -5, 1.5, -1.5];
            var count = 100;
            for (var i = 0; i < count; ++i) {
                testValues.push(generateRandomNumber());
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(testValues), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var inputValue = _step.value;

                    gl.uniform1f(shader.uniform('inputValue'), inputValue);
                    tester.execute();
                    var values = tester.values;
                    expect(values.outputValue).toEqual(inputValue);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        });
    });
    it('float uint passthrough', function () {
        fragmentShaderTest({ floatOutput: 'float', uintOutput: 'uint' }, function (tester) {
            var gl = tester.gl,
                builder = tester.builder;

            builder.addUniform('highp float', 'floatInput');
            builder.addUniform('highp uint', 'uintInput');
            builder.setFragmentMain('\n  floatOutput = floatInput;\n  uintOutput = uintInput;\n');
            tester.build();
            function generateRandomNumber() {
                var buf = new Uint32Array(1);
                var temp = new Float32Array(buf.buffer);
                do {
                    crypto.getRandomValues(buf);
                } while (!_Number$isFinite(temp[0]) || temp[0] !== 0 && Math.abs(_Math$log(Math.abs(temp[0]))) > 125);
                return temp[0];
            }
            var shader = tester.shader;

            shader.bind();
            var testFloatValues = [5, 0, 1, -1, 2, -2, 3, -3, 5, -5, 1.5, -1.5];
            var testUintValues = [7, 1, 5, 10, 33, 27, 55, 7, 5, 3, 343432, 4294967295];
            var count = 100;
            for (var i = 0; i < count; ++i) {
                testFloatValues.push(generateRandomNumber());
                testUintValues.push(i);
            }
            for (var _i2 = 0; _i2 < testUintValues.length; ++_i2) {
                var floatInput = testFloatValues[_i2];
                var uintInput = testUintValues[_i2];
                gl.uniform1f(shader.uniform('floatInput'), floatInput);
                gl.uniform1ui(shader.uniform('uintInput'), uintInput);
                tester.execute();
                var values = tester.values;
                expect(values.floatOutput).toEqual(floatInput);
                expect(values.uintOutput).toEqual(uintInput);
            }
        });
    });
});
//# sourceMappingURL=shader_testing.spec.js.map