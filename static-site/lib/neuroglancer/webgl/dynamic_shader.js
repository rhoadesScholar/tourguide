import _getIterator from 'babel-runtime/core-js/get-iterator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Map from 'babel-runtime/core-js/map';
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
import { WatchableValue } from '../trackable_value';
import { TrackableValue } from '../trackable_value';
import { RefCounted } from '../util/disposable';
import { stableStringify, verifyString } from '../util/json';
import { getObjectId } from '../util/object_id';
import { ShaderBuilder } from './shader';
export function makeWatchableShaderError() {
    return new WatchableValue(undefined);
}
export function makeTrackableFragmentMain(value) {
    return new TrackableValue(value, verifyString);
}
export var ShaderGetter = function (_RefCounted) {
    _inherits(ShaderGetter, _RefCounted);

    function ShaderGetter(gl, defineShader, getShaderKey) {
        var shaderError = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : makeWatchableShaderError();

        _classCallCheck(this, ShaderGetter);

        var _this = _possibleConstructorReturn(this, (ShaderGetter.__proto__ || _Object$getPrototypeOf(ShaderGetter)).call(this));

        _this.gl = gl;
        _this.defineShader = defineShader;
        _this.getShaderKey = getShaderKey;
        _this.shaderError = shaderError;
        _this.shaderUpdated = true;
        _this.shader = undefined;
        shaderError.value = undefined;
        return _this;
    }

    _createClass(ShaderGetter, [{
        key: 'invalidateShader',
        value: function invalidateShader() {
            this.shaderUpdated = true;
        }
    }, {
        key: 'get',
        value: function get() {
            if (!this.shaderUpdated) {
                return this.shader;
            }
            this.shaderUpdated = false;
            try {
                var newShader = this.getShader();
                this.disposeShader();
                this.shader = newShader;
                this.shaderError.value = null;
            } catch (shaderError) {
                this.shaderError.value = shaderError;
            }
            return this.shader;
        }
    }, {
        key: 'getShader',
        value: function getShader() {
            var _this2 = this;

            var key = this.getShaderKey();
            return this.gl.memoize.get(key, function () {
                return _this2.buildShader();
            });
        }
    }, {
        key: 'buildShader',
        value: function buildShader() {
            var builder = new ShaderBuilder(this.gl);
            this.defineShader(builder);
            return builder.build();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            _get(ShaderGetter.prototype.__proto__ || _Object$getPrototypeOf(ShaderGetter.prototype), 'disposed', this).call(this);
            this.disposeShader();
        }
    }, {
        key: 'disposeShader',
        value: function disposeShader() {
            if (this.shader) {
                this.shader.dispose();
                this.shader = undefined;
            }
        }
    }]);

    return ShaderGetter;
}(RefCounted);
export function parameterizedEmitterDependentShaderGetter(refCounted, gl, memoizeKey, fallbackParameters, parameters, shaderError, defineShader) {
    var shaders = new _Map();
    var stringMemoizeKey = stableStringify(memoizeKey);
    function getNewShader(p, emitter) {
        var key = stringMemoizeKey + '\0' + getObjectId(emitter) + '\0' + _JSON$stringify(parameters);
        return gl.memoize.get(key, function () {
            var builder = new ShaderBuilder(gl);
            builder.require(emitter);
            defineShader(builder, p);
            return builder.build();
        });
    }
    function getter(emitter) {
        var entry = shaders.get(emitter);
        if (entry === undefined) {
            entry = { generation: -1, shader: null };
            shaders.set(emitter, entry);
        }
        var generation = parameters.changed.count;
        if (generation === entry.generation) {
            return entry.shader;
        }
        var oldShader = entry.shader;
        entry.generation = generation;
        var newShader = null;
        try {
            newShader = getNewShader(parameters.value, emitter);
            fallbackParameters.value = parameters.value;
            shaderError.value = null;
        } catch (e) {
            shaderError.value = e;
            try {
                newShader = getNewShader(fallbackParameters.value, emitter);
            } catch (_a) {}
        }
        if (oldShader !== null) {
            oldShader.dispose();
        }
        entry.shader = newShader;
        return newShader;
    }
    refCounted.registerDisposer(function () {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(shaders.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var entry = _step.value;
                var shader = entry.shader;

                if (shader !== null) {
                    shader.dispose();
                }
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
    return getter;
}
//# sourceMappingURL=dynamic_shader.js.map