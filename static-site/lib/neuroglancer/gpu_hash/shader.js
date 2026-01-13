import _Symbol$for from 'babel-runtime/core-js/symbol/for';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { NUM_ALTERNATIVES } from './hash_table';
import { RefCounted } from '../util/disposable';
import { glsl_equalUint64, glsl_uint64 } from '../webgl/shader_lib';
import { compute1dTextureLayout, computeTextureFormat, OneDimensionalTextureAccessHelper, setOneDimensionalTextureData, TextureFormat } from '../webgl/texture_access';
import { DataType } from '../util/data_type';
// MumurHash, excluding the final mixing steps.
export var glsl_hashCombine = [glsl_uint64, '\nhighp uint hashCombine(highp uint state, highp uint value) {\n  value *= 0xcc9e2d51u;\n  value = (value << 15u) | (value >> 17u);\n  value *= 0x1b873593u;\n  state ^= value;\n  state = (state << 13u) | (state >> 19u);\n  state = (state * 5u) + 0xe6546b64u;\n  return state;\n}\nhighp uint hashCombine(highp uint state, uint64_t x) {\n  state = hashCombine(state, x.value[0]);\n  return hashCombine(state, x.value[1]);\n}\n'];
var textureFormat = computeTextureFormat(new TextureFormat(), DataType.UINT64, 1);
export var GPUHashTable = function (_RefCounted) {
    _inherits(GPUHashTable, _RefCounted);

    function GPUHashTable(gl, hashTable) {
        _classCallCheck(this, GPUHashTable);

        var _this = _possibleConstructorReturn(this, (GPUHashTable.__proto__ || _Object$getPrototypeOf(GPUHashTable)).call(this));

        _this.gl = gl;
        _this.hashTable = hashTable;
        _this.generation = -1;
        _this.texture = null;
        // createTexture should never actually return null.
        _this.texture = gl.createTexture();
        return _this;
    }

    _createClass(GPUHashTable, [{
        key: 'copyToGPU',
        value: function copyToGPU() {
            var _this2 = this;

            var hashTable = this.hashTable;
            var generation = hashTable.generation;

            if (this.generation === generation) {
                return;
            }
            var gl = this.gl,
                texture = this.texture;

            compute1dTextureLayout(this, gl, textureFormat.texelsPerElement, hashTable.tableSize * hashTable.entryStride / 2);
            this.generation = generation;
            gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + gl.tempTextureUnit);
            gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, texture);
            hashTable.tableWithMungedEmptyKey(function (table) {
                setOneDimensionalTextureData(_this2.gl, _this2, textureFormat, table);
            });
            gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, null);
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var gl = this.gl;

            gl.deleteTexture(this.texture);
            this.texture = null;
            this.gl = undefined;
            this.hashTable = undefined;
            _get(GPUHashTable.prototype.__proto__ || _Object$getPrototypeOf(GPUHashTable.prototype), 'disposed', this).call(this);
        }
    }], [{
        key: 'get',
        value: function get(gl, hashTable) {
            var _this3 = this;

            return gl.memoize.get(hashTable, function () {
                return new _this3(gl, hashTable);
            });
        }
    }]);

    return GPUHashTable;
}(RefCounted);
export var HashSetShaderManager = function () {
    function HashSetShaderManager(prefix) {
        var numAlternatives = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : NUM_ALTERNATIVES;

        _classCallCheck(this, HashSetShaderManager);

        this.prefix = prefix;
        this.numAlternatives = numAlternatives;
        this.textureUnitSymbol = _Symbol$for('gpuhashtable:' + this.prefix);
        this.accessHelper = new OneDimensionalTextureAccessHelper('gpuhashtable_' + this.prefix);
        this.samplerName = this.prefix + '_sampler';
        this.hashSeedsName = this.prefix + '_seeds';
        this.hashKeyMask = this.prefix + '_keyMask';
        this.readTable = this.prefix + '_readTable';
    }

    _createClass(HashSetShaderManager, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            var hashSeedsName = this.hashSeedsName,
                samplerName = this.samplerName,
                numAlternatives = this.numAlternatives,
                hashKeyMask = this.hashKeyMask;

            builder.addUniform('highp uint', hashSeedsName, numAlternatives);
            builder.addUniform('highp uint', hashKeyMask);
            builder.addTextureSampler('usampler2D', samplerName, this.textureUnitSymbol);
            builder.addFragmentCode(glsl_hashCombine);
            builder.addFragmentCode(glsl_uint64);
            builder.addFragmentCode(glsl_equalUint64);
            this.accessHelper.defineShader(builder);
            builder.addFragmentCode(this.accessHelper.getAccessor(this.readTable, this.samplerName, DataType.UINT64, 1));
            var s = '';
            s += '\nbool ' + this.hasFunctionName + '(uint64_t x) {\n';
            for (var alt = 0; alt < numAlternatives; ++alt) {
                s += '\n  {\n    uint h = hashCombine(' + hashSeedsName + '[' + alt + '], x) & ' + hashKeyMask + ';\n    uint64_t key = ' + this.readTable + '(h);\n    if (equals(key, x)) {\n      return true;\n    }\n  }\n';
            }
            s += '\n  return false;\n}\n';
            builder.addFragmentCode(s);
        }
    }, {
        key: 'enable',
        value: function enable(gl, shader, hashTable) {
            hashTable.copyToGPU();
            var textureUnit = shader.textureUnit(this.textureUnitSymbol);
            gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + textureUnit);
            gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, hashTable.texture);
            this.accessHelper.setupTextureLayout(gl, shader, hashTable);
            gl.uniform1ui(shader.uniform(this.hashKeyMask), hashTable.hashTable.tableSize - 1);
            gl.uniform1uiv(shader.uniform(this.hashSeedsName), hashTable.hashTable.hashSeeds);
        }
    }, {
        key: 'disable',
        value: function disable(gl, shader) {
            var textureUnit = shader.textureUnit(this.textureUnitSymbol);
            gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + textureUnit);
            gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, null);
        }
    }, {
        key: 'hasFunctionName',
        get: function get() {
            return this.prefix + '_has';
        }
    }]);

    return HashSetShaderManager;
}();
export var HashMapShaderManager = function (_HashSetShaderManager) {
    _inherits(HashMapShaderManager, _HashSetShaderManager);

    function HashMapShaderManager() {
        _classCallCheck(this, HashMapShaderManager);

        return _possibleConstructorReturn(this, (HashMapShaderManager.__proto__ || _Object$getPrototypeOf(HashMapShaderManager)).apply(this, arguments));
    }

    _createClass(HashMapShaderManager, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(HashMapShaderManager.prototype.__proto__ || _Object$getPrototypeOf(HashMapShaderManager.prototype), 'defineShader', this).call(this, builder);
            var numAlternatives = this.numAlternatives,
                hashSeedsName = this.hashSeedsName,
                hashKeyMask = this.hashKeyMask;

            var s = '\nbool ' + this.getFunctionName + '(uint64_t x, out uint64_t value) {\n';
            for (var alt = 0; alt < numAlternatives; ++alt) {
                s += '\n  {\n    uint h = hashCombine(' + hashSeedsName + '[' + alt + '], x) & ' + hashKeyMask + ';\n    uint64_t key = ' + this.readTable + '(h * 2u);\n    if (equals(key, x)) {\n      value = ' + this.readTable + '(h * 2u + 1u);\n      return true;\n    }\n  }\n';
            }
            s += '\n  return false;\n}\n';
            builder.addFragmentCode(s);
        }
    }, {
        key: 'getFunctionName',
        get: function get() {
            return this.prefix + '_get';
        }
    }]);

    return HashMapShaderManager;
}(HashSetShaderManager);
//# sourceMappingURL=shader.js.map