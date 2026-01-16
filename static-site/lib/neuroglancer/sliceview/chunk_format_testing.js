import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
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
import { glsl_getPositionWithinChunk } from './volume/renderlayer';
import { getFortranOrderStrides } from '../util/array';
import { DataType } from '../util/data_type';
import { vec3, vec3Key } from '../util/geom';
import { textureTargetForSamplerType } from '../webgl/shader';
import { fragmentShaderTest } from '../webgl/shader_testing';
export function chunkFormatTest(dataType, volumeSize, getChunkFormatAndTextureLayout, rawData, encodedData) {
    var numChannels = volumeSize[3];
    var strides = getFortranOrderStrides(volumeSize);
    var outputType = dataType === DataType.FLOAT32 ? 'float' : 'uint';
    var outputs = {};
    for (var channelIndex = 0; channelIndex < numChannels; ++channelIndex) {
        if (dataType === DataType.UINT64) {
            outputs['output' + channelIndex + 'Low'] = outputType;
            outputs['output' + channelIndex + 'High'] = outputType;
        } else {
            outputs['output' + channelIndex] = outputType;
        }
    }
    it('volumeSize = ' + vec3Key(volumeSize) + ', numChannels = ' + volumeSize[3] + ', ' + ('dataType = ' + DataType[dataType]), function () {
        fragmentShaderTest(outputs, function (tester) {
            var gl = tester.gl,
                builder = tester.builder;

            var _getChunkFormatAndTex = getChunkFormatAndTextureLayout(gl),
                _getChunkFormatAndTex2 = _slicedToArray(_getChunkFormatAndTex, 2),
                chunkFormat = _getChunkFormatAndTex2[0],
                textureLayout = _getChunkFormatAndTex2[1];

            builder.addUniform('highp vec3', 'vChunkPosition');
            builder.addUniform('vec3', 'uChunkDataSize');
            builder.addFragmentCode(glsl_getPositionWithinChunk);
            chunkFormat.defineShader(builder);
            {
                var fragmentMain = '';
                for (var channel = 0; channel < numChannels; ++channel) {
                    switch (dataType) {
                        case DataType.UINT64:
                            fragmentMain += '\n{\n  uint64_t value = getDataValue(' + channel + ');\n  output' + channel + 'Low = value.value[0];\n  output' + channel + 'High = value.value[1];\n}\n';
                            break;
                        case DataType.FLOAT32:
                            fragmentMain += '\noutput' + channel + ' = getDataValue(' + channel + ');\n';
                            break;
                        default:
                            fragmentMain += '\noutput' + channel + ' = getDataValue(' + channel + ').value;\n';
                            break;
                    }
                }
                builder.setFragmentMain(fragmentMain);
            }
            tester.build();
            var shader = tester.shader;

            shader.bind();
            gl.uniform3fv(shader.uniform('uChunkDataSize'), volumeSize.subarray(0, 3));
            var texture = gl.createTexture();
            tester.registerDisposer(function () {
                gl.deleteTexture(texture);
            });
            var textureTarget = textureTargetForSamplerType[chunkFormat.shaderSamplerType];
            chunkFormat.beginDrawing(gl, shader);
            gl.bindTexture(textureTarget, texture);
            chunkFormat.setTextureData(gl, textureLayout, encodedData);
            chunkFormat.setupTextureLayout(gl, shader, textureLayout);
            // Position within chunk in floating point range [0, chunkDataSize].
            function checkPosition(positionInChunk) {
                gl.uniform3fv(shader.uniform('vChunkPosition'), positionInChunk);
                chunkFormat.beginDrawing(gl, shader);
                chunkFormat.beginSource(gl, shader);
                chunkFormat.setupTextureLayout(gl, shader, textureLayout);
                gl.bindTexture(textureTarget, texture);
                tester.execute();
                chunkFormat.endDrawing(gl, shader);
                var offset = 0;
                for (var i = 0; i < 3; ++i) {
                    offset += Math.floor(Math.max(0, Math.min(positionInChunk[i], volumeSize[i] - 1))) * strides[i];
                }
                var values = tester.values;
                for (var _channel = 0; _channel < numChannels; ++_channel) {
                    var curOffset = offset + _channel * strides[3];
                    var msg = 'volumeSize = ' + vec3Key(volumeSize) + ', ' + ('positionInChunk = ' + vec3Key(positionInChunk) + ', ') + ('channel = ' + _channel + ', offset = ' + curOffset);
                    switch (dataType) {
                        case DataType.UINT64:
                            {
                                var low = values['output' + _channel + 'Low'];
                                var high = values['output' + _channel + 'High'];
                                expect(low).toBe(rawData[curOffset * 2], msg + ' (low)');
                                expect(high).toEqual(rawData[curOffset * 2 + 1], msg + ' (high)');
                                break;
                            }
                        default:
                            {
                                var result = values['output' + _channel];
                                expect(result).toBe(rawData[curOffset], msg);
                                break;
                            }
                    }
                }
            }
            checkPosition(vec3.fromValues(0, 0, 0));
            checkPosition(vec3.fromValues(0, 0, 1));
            checkPosition(vec3.fromValues(0, 1, 0));
            checkPosition(vec3.fromValues(0, volumeSize[1], 0));
            checkPosition(vec3.fromValues(0, volumeSize[1], volumeSize[2]));
            checkPosition(vec3.fromValues(volumeSize[0], volumeSize[1], volumeSize[2]));
            checkPosition(vec3.fromValues(volumeSize[0] - 1, 1, 1));
            var COUNT = 100;
            for (var iter = 0; iter < COUNT; ++iter) {
                var vChunkPosition = vec3.create();
                for (var i = 0; i < 3; ++i) {
                    vChunkPosition[i] = Math.random() * volumeSize[i];
                }
                checkPosition(vChunkPosition);
            }
        });
    });
}
//# sourceMappingURL=chunk_format_testing.js.map