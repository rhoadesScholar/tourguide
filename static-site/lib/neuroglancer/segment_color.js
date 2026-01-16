import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
import { hashCombine } from './gpu_hash/hash_function';
import { glsl_hashCombine, HashMapShaderManager } from './gpu_hash/shader';
import { hsvToRgb } from './util/colorspace';
import { NullarySignal } from './util/signal';
import { glsl_hsvToRgb, glsl_uint64 } from './webgl/shader_lib';
import { getRandomUint32 } from './util/random';
var NUM_COMPONENTS = 2;
export var SegmentColorShaderManager = function () {
    function SegmentColorShaderManager(prefix) {
        _classCallCheck(this, SegmentColorShaderManager);

        this.prefix = prefix;
        this.seedName = this.prefix + '_seed';
    }

    _createClass(SegmentColorShaderManager, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            var seedName = this.seedName;

            builder.addUniform('highp uint', seedName);
            builder.addFragmentCode(glsl_uint64);
            builder.addFragmentCode(glsl_hashCombine);
            builder.addFragmentCode(glsl_hsvToRgb);
            var s = '\nvec3 ' + this.prefix + '(uint64_t x) {\n  uint h = hashCombine(' + seedName + ', x);\n  vec' + NUM_COMPONENTS + ' v;\n';
            for (var i = 0; i < NUM_COMPONENTS; ++i) {
                s += '\n  v[' + i + '] = float(h & 0xFFu) / 255.0;\n  h >>= 8u;\n';
            }
            s += '\n  vec3 hsv = vec3(v.x, 0.5 + v.y * 0.5, 1.0);\n  return hsvToRgb(hsv);\n}\n';
            builder.addFragmentCode(s);
        }
    }, {
        key: 'enable',
        value: function enable(gl, shader, segmentColorHash) {
            gl.uniform1ui(shader.uniform(this.seedName), segmentColorHash.hashSeed);
        }
    }]);

    return SegmentColorShaderManager;
}();
var tempColor = new Float32Array(3);
export var SegmentColorHash = function () {
    function SegmentColorHash() {
        var hashSeed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getRandomUint32();

        _classCallCheck(this, SegmentColorHash);

        this.hashSeed = hashSeed;
        this.changed = new NullarySignal();
    }

    _createClass(SegmentColorHash, [{
        key: 'compute',
        value: function compute(out, x) {
            var h = hashCombine(this.hashSeed, x.low);
            h = hashCombine(h, x.high);
            var c0 = (h & 0xFF) / 255;
            var c1 = (h >> 8 & 0xFF) / 255;
            hsvToRgb(out, c0, 0.5 + 0.5 * c1, 1.0);
            return out;
        }
    }, {
        key: 'computeCssColor',
        value: function computeCssColor(x) {
            this.compute(tempColor, x);
            return 'rgb(' + tempColor[0] * 100 + '%,' + tempColor[1] * 100 + '%,' + tempColor[2] * 100 + '%)';
        }
    }, {
        key: 'randomize',
        value: function randomize() {
            this.hashSeed = getRandomUint32();
            this.changed.dispatch();
        }
    }, {
        key: 'toString',
        value: function toString() {
            return 'new SegmentColorHash(' + this.hashSeed + ')';
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return this.hashSeed === 0 ? undefined : this.hashSeed;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.restoreState(0);
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            var newSeed = x >>> 0;
            if (newSeed !== this.hashSeed) {
                this.hashSeed = newSeed;
                this.changed.dispatch();
            }
        }
    }], [{
        key: 'getDefault',
        value: function getDefault() {
            return new SegmentColorHash(0);
        }
    }]);

    return SegmentColorHash;
}();
/**
 * Adds the shader code to get a segment's color if it is present in the map.
 */
export var SegmentStatedColorShaderManager = function () {
    function SegmentStatedColorShaderManager(prefix) {
        _classCallCheck(this, SegmentStatedColorShaderManager);

        this.prefix = prefix;
        this.hashMapShaderManager = new HashMapShaderManager('segmentStatedColorHash');
    }

    _createClass(SegmentStatedColorShaderManager, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            this.hashMapShaderManager.defineShader(builder);
            var s = '\nbool ' + this.getFunctionName + '(uint64_t x, out vec3 value) {\n  uint64_t uint64Value;\n  if (' + this.hashMapShaderManager.getFunctionName + '(x, uint64Value)) {\n    uint uintValue = uint64Value.value[0];\n    value.x = float((uintValue & 0xff0000u) >> 16) / 255.0;\n    value.y = float((uintValue & 0x00ff00u) >>  8) / 255.0;\n    value.z = float((uintValue & 0x0000ffu))       / 255.0;\n    return true;\n  }\n  return false;\n}\n';
            builder.addFragmentCode(s);
        }
    }, {
        key: 'enable',
        value: function enable(gl, shader, hashTable) {
            this.hashMapShaderManager.enable(gl, shader, hashTable);
        }
    }, {
        key: 'getFunctionName',
        get: function get() {
            return this.prefix + '_get';
        }
    }]);

    return SegmentStatedColorShaderManager;
}();
//# sourceMappingURL=segment_color.js.map