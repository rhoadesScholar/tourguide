import _typeof from "babel-runtime/helpers/typeof";
import _Set from "babel-runtime/core-js/set";
import _Map from "babel-runtime/core-js/map";
import _createClass from "babel-runtime/helpers/createClass";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _getIterator from "babel-runtime/core-js/get-iterator";
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
import { RefCounted } from "../util/disposable";
var DEBUG_SHADER = false;
export var ShaderType;
(function (ShaderType) {
    ShaderType[ShaderType["VERTEX"] = WebGL2RenderingContext.VERTEX_SHADER] = "VERTEX";
    ShaderType[ShaderType["FRAGMENT"] = WebGL2RenderingContext.FRAGMENT_SHADER] = "FRAGMENT";
})(ShaderType || (ShaderType = {}));
/**
 * Parses the output of getShaderInfoLog into a list of messages.
 */
export function parseShaderErrors(log) {
    log = log.replace('\0', '');
    var result = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(log.split('\n')), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var line = _step.value;

            var m = line.match(/^ERROR:\s*(\d+):(\d+)\s*(.+)$/);
            if (m !== null) {
                result.push({ message: m[3].trim(), file: parseInt(m[1], 10), line: parseInt(m[2], 10) });
            } else {
                m = line.match(/^ERROR:\s*(.+)$/);
                if (m !== null) {
                    result.push({ message: m[1] });
                } else {
                    line = line.trim();
                    if (line) {
                        result.push({ message: line });
                    }
                }
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

    return result;
}
export var ShaderCompilationError = function (_Error) {
    _inherits(ShaderCompilationError, _Error);

    function ShaderCompilationError(shaderType, source, log, errorMessages) {
        _classCallCheck(this, ShaderCompilationError);

        var message = "Error compiling " + ShaderType[shaderType].toLowerCase() + " shader: " + log;

        var _this = _possibleConstructorReturn(this, (ShaderCompilationError.__proto__ || _Object$getPrototypeOf(ShaderCompilationError)).call(this, message));

        _this.name = 'ShaderCompilationError';
        _this.log = log;
        _this.message = message;
        _this.shaderType = shaderType;
        _this.source = source;
        _this.errorMessages = errorMessages;
        return _this;
    }

    return ShaderCompilationError;
}(Error);
export var ShaderLinkError = function (_Error2) {
    _inherits(ShaderLinkError, _Error2);

    function ShaderLinkError(vertexSource, fragmentSource, log) {
        _classCallCheck(this, ShaderLinkError);

        var message = "Error linking shader: " + log;

        var _this2 = _possibleConstructorReturn(this, (ShaderLinkError.__proto__ || _Object$getPrototypeOf(ShaderLinkError)).call(this, message));

        _this2.name = 'ShaderLinkError';
        _this2.log = log;
        _this2.message = message;
        _this2.vertexSource = vertexSource;
        _this2.fragmentSource = fragmentSource;
        return _this2;
    }

    return ShaderLinkError;
}(Error);
export function getShader(gl, source, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var log = gl.getShaderInfoLog(shader) || '';
        if (DEBUG_SHADER) {
            var lines = source.replace('<', '&lt;').replace('>', '&gt;').split('\n');
            var s = '<pre>';
            s += log.replace('<', '&lt;').replace('>', '&gt;') + '\n';
            lines.forEach(function (line, i) {
                s += i + 1 + ": " + line + "\n";
            });
            s += "\n</pre>";
            var w = window.open('about:blank', '_blank');
            if (w !== null) {
                try {
                    w.document.write(s);
                } catch (writeError) {}
            }
        }
        throw new ShaderCompilationError(shaderType, source, log, parseShaderErrors(log));
    }
    return shader;
}
export var ShaderProgram = function (_RefCounted) {
    _inherits(ShaderProgram, _RefCounted);

    function ShaderProgram(gl, vertexSource, fragmentSource, uniformNames, attributeNames) {
        _classCallCheck(this, ShaderProgram);

        var _this3 = _possibleConstructorReturn(this, (ShaderProgram.__proto__ || _Object$getPrototypeOf(ShaderProgram)).call(this));

        _this3.gl = gl;
        _this3.vertexSource = vertexSource;
        _this3.fragmentSource = fragmentSource;
        _this3.attributes = new _Map();
        _this3.uniforms = new _Map();
        var vertexShader = _this3.vertexShader = getShader(gl, vertexSource, gl.VERTEX_SHADER);
        var fragmentShader = _this3.fragmentShader = getShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            var log = gl.getProgramInfoLog(shaderProgram) || '';
            // DEBUG
            // {
            //   let combinedSource = 'VERTEX SHADER\n\n' + vertexSource + '\n\n\nFRAGMENT SHADER\n\n' +
            //   fragmentSource + '\n';
            //   let w = window.open("about:blank", "_blank");
            //   w.document.write('<pre>' + combinedSource.replace('<', '&lt;').replace('>', '&gt;') +
            //   '</pre>');
            // }
            throw new ShaderLinkError(vertexSource, fragmentSource, log);
        }
        _this3.program = shaderProgram;
        var uniforms = _this3.uniforms,
            attributes = _this3.attributes;

        if (uniformNames) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(uniformNames), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var name = _step2.value;

                    uniforms.set(name, gl.getUniformLocation(shaderProgram, name));
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
        if (attributeNames) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(attributeNames), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _name = _step3.value;

                    attributes.set(_name, gl.getAttribLocation(shaderProgram, _name));
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
        return _this3;
    }

    _createClass(ShaderProgram, [{
        key: "uniform",
        value: function uniform(name) {
            return this.uniforms.get(name);
        }
    }, {
        key: "attribute",
        value: function attribute(name) {
            return this.attributes.get(name);
        }
    }, {
        key: "textureUnit",
        value: function textureUnit(symbol) {
            return this.textureUnits.get(symbol);
        }
    }, {
        key: "bind",
        value: function bind() {
            this.gl.useProgram(this.program);
        }
    }, {
        key: "disposed",
        value: function disposed() {
            var gl = this.gl;

            gl.deleteShader(this.vertexShader);
            this.vertexShader = undefined;
            gl.deleteShader(this.fragmentShader);
            this.fragmentShader = undefined;
            gl.deleteProgram(this.program);
            this.program = undefined;
            this.gl = undefined;
            this.attributes = undefined;
            this.uniforms = undefined;
        }
    }]);

    return ShaderProgram;
}(RefCounted);
export var ShaderCode = function () {
    function ShaderCode() {
        _classCallCheck(this, ShaderCode);

        this.code = '';
        this.parts = new _Set();
    }

    _createClass(ShaderCode, [{
        key: "add",
        value: function add(x) {
            if (this.parts.has(x)) {
                return;
            }
            this.parts.add(x);
            switch (typeof x === "undefined" ? "undefined" : _typeof(x)) {
                case 'string':
                    this.code += x;
                    break;
                case 'function':
                    this.add(x());
                    break;
                default:
                    if (Array.isArray(x)) {
                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = _getIterator(x), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var y = _step4.value;

                                this.add(y);
                            }
                        } catch (err) {
                            _didIteratorError4 = true;
                            _iteratorError4 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                    _iterator4.return();
                                }
                            } finally {
                                if (_didIteratorError4) {
                                    throw _iteratorError4;
                                }
                            }
                        }
                    } else {
                        console.log('Invalid code type', x);
                        throw new Error('Invalid code type');
                    }
            }
        }
    }, {
        key: "toString",
        value: function toString() {
            return this.code;
        }
    }]);

    return ShaderCode;
}();
export var textureTargetForSamplerType = {
    'sampler2D': WebGL2RenderingContext.TEXTURE_2D,
    'isampler2D': WebGL2RenderingContext.TEXTURE_2D,
    'usampler2D': WebGL2RenderingContext.TEXTURE_2D,
    'sampler3D': WebGL2RenderingContext.TEXTURE_3D,
    'isampler3D': WebGL2RenderingContext.TEXTURE_3D,
    'usampler3D': WebGL2RenderingContext.TEXTURE_3D
};
export var ShaderBuilder = function () {
    function ShaderBuilder(gl) {
        _classCallCheck(this, ShaderBuilder);

        this.gl = gl;
        this.nextSymbolID = 0;
        this.nextTextureUnit = 0;
        this.uniformsCode = '';
        this.attributesCode = '';
        this.varyingsCodeVS = '';
        this.varyingsCodeFS = '';
        this.fragmentExtensionsSet = new _Set();
        this.fragmentExtensions = '';
        this.vertexCode = new ShaderCode();
        this.vertexMain = '';
        this.fragmentCode = new ShaderCode();
        this.outputBufferCode = '';
        this.fragmentMain = '';
        this.required = new _Set();
        this.uniforms = new Array();
        this.attributes = new Array();
        this.initializers = [];
        this.textureUnits = new _Map();
    }

    _createClass(ShaderBuilder, [{
        key: "allocateTextureUnit",
        value: function allocateTextureUnit(symbol) {
            var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

            if (this.textureUnits.has(symbol)) {
                throw new Error('Duplicate texture unit symbol: ' + symbol);
            }
            var old = this.nextTextureUnit;
            this.nextTextureUnit += count;
            this.textureUnits.set(symbol, old);
            return old;
        }
    }, {
        key: "addTextureSampler",
        value: function addTextureSampler(samplerType, name, symbol, extent) {
            var textureUnit = this.allocateTextureUnit(symbol, extent);
            this.addUniform("highp " + samplerType, name, extent);
            this.addInitializer(function (shader) {
                if (extent) {
                    var textureUnits = new Int32Array(extent);
                    for (var i = 0; i < extent; ++i) {
                        textureUnits[i] = i + textureUnit;
                    }
                    shader.gl.uniform1iv(shader.uniform(name), textureUnits);
                } else {
                    shader.gl.uniform1i(shader.uniform(name), textureUnit);
                }
            });
            return textureUnit;
        }
    }, {
        key: "symbol",
        value: function symbol(name) {
            return name + this.nextSymbolID++;
        }
    }, {
        key: "addAttribute",
        value: function addAttribute(typeName, name) {
            this.attributes.push(name);
            this.attributesCode += "in " + typeName + " " + name + ";\n";
            return name;
        }
    }, {
        key: "addVarying",
        value: function addVarying(typeName, name) {
            var interpolationMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

            this.varyingsCodeVS += interpolationMode + " out " + typeName + " " + name + ";\n";
            this.varyingsCodeFS += interpolationMode + " in " + typeName + " " + name + ";\n";
        }
    }, {
        key: "addOutputBuffer",
        value: function addOutputBuffer(typeName, name, location) {
            if (location !== null) {
                this.outputBufferCode += "layout(location = " + location + ") ";
            }
            this.outputBufferCode += "out " + typeName + " " + name + ";\n";
        }
    }, {
        key: "addUniform",
        value: function addUniform(typeName, name, extent) {
            this.uniforms.push(name);
            if (extent != null) {
                this.uniformsCode += "uniform " + typeName + " " + name + "[" + extent + "];\n";
            } else {
                this.uniformsCode += "uniform " + typeName + " " + name + ";\n";
            }
            return name;
        }
    }, {
        key: "addFragmentExtension",
        value: function addFragmentExtension(name) {
            if (this.fragmentExtensionsSet.has(name)) {
                return;
            }
            this.fragmentExtensionsSet.add(name);
            this.fragmentExtensions += "#extension " + name + " : require\n";
        }
    }, {
        key: "addVertexCode",
        value: function addVertexCode(code) {
            this.vertexCode.add(code);
        }
    }, {
        key: "addFragmentCode",
        value: function addFragmentCode(code) {
            this.fragmentCode.add(code);
        }
    }, {
        key: "setVertexMain",
        value: function setVertexMain(code) {
            this.vertexMain = code;
        }
    }, {
        key: "addVertexMain",
        value: function addVertexMain(code) {
            this.vertexMain = (this.vertexMain || '') + code;
        }
    }, {
        key: "setFragmentMain",
        value: function setFragmentMain(code) {
            this.fragmentMain = "void main() {\n" + code + "\n}\n";
        }
    }, {
        key: "setFragmentMainFunction",
        value: function setFragmentMainFunction(code) {
            this.fragmentMain = code;
        }
    }, {
        key: "addInitializer",
        value: function addInitializer(f) {
            this.initializers.push(f);
        }
    }, {
        key: "require",
        value: function require(f) {
            if (this.required.has(f)) {
                return;
            }
            this.required.add(f);
            f(this);
        }
    }, {
        key: "build",
        value: function build() {
            var vertexSource = "#version 300 es\nprecision highp float;\nprecision highp int;\n" + this.uniformsCode + "\n" + this.attributesCode + "\n" + this.varyingsCodeVS + "\n" + this.vertexCode + "\nvoid main() {\n" + this.vertexMain + "\n}\n";
            var fragmentSource = "#version 300 es\n" + this.fragmentExtensions + "\nprecision highp float;\nprecision highp int;\n" + this.uniformsCode + "\n" + this.varyingsCodeFS + "\n" + this.outputBufferCode + "\n" + this.fragmentCode + "\n" + this.fragmentMain + "\n";
            // console.log('vertex shader');
            // console.log(vertexSource);
            // console.log('fragment shader');
            // console.log(fragmentSource);
            var shader = new ShaderProgram(this.gl, vertexSource, fragmentSource, this.uniforms, this.attributes);
            shader.textureUnits = this.textureUnits;
            var initializers = this.initializers;

            if (initializers.length > 0) {
                shader.bind();
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = _getIterator(initializers), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var initializer = _step5.value;

                        initializer(shader);
                    }
                } catch (err) {
                    _didIteratorError5 = true;
                    _iteratorError5 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion5 && _iterator5.return) {
                            _iterator5.return();
                        }
                    } finally {
                        if (_didIteratorError5) {
                            throw _iteratorError5;
                        }
                    }
                }
            }
            return shader;
        }
    }]);

    return ShaderBuilder;
}();
export function shaderContainsIdentifiers(code, identifiers) {
    var found = new _Set();
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = _getIterator(identifiers), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var identifier = _step6.value;

            var pattern = new RegExp("(?:^|[^a-zA-Z0-9_])" + identifier + "[^a-zA-Z0-9_])");
            if (code.match(pattern) !== null) {
                found.add(identifier);
            }
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    return found;
}
export function emitterDependentShaderGetter(refCounted, gl, defineShader) {
    var shaders = new _Map();
    function getter(emitter) {
        var shader = shaders.get(emitter);
        if (shader === undefined) {
            var builder = new ShaderBuilder(gl);
            builder.require(emitter);
            defineShader(builder);
            shader = refCounted.registerDisposer(builder.build());
            shaders.set(emitter, shader);
        }
        return shader;
    }
    return getter;
}
//# sourceMappingURL=shader.js.map