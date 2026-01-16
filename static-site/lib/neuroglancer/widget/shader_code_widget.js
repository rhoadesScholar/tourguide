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
import 'codemirror/addon/lint/lint.js';

import CodeMirror from 'codemirror';
import debounce from 'lodash/debounce';
import { RefCounted } from '../util/disposable';
import { removeFromParent } from '../util/dom';
require('glsl-editor/glsl')(CodeMirror);
/**
 * Time in milliseconds during which the input field must not be modified before the shader is
 * recompiled.
 */
var SHADER_UPDATE_DELAY = 500;
export var ShaderCodeWidget = function (_RefCounted) {
    _inherits(ShaderCodeWidget, _RefCounted);

    function ShaderCodeWidget(state) {
        _classCallCheck(this, ShaderCodeWidget);

        var _this = _possibleConstructorReturn(this, (ShaderCodeWidget.__proto__ || _Object$getPrototypeOf(ShaderCodeWidget)).call(this));

        _this.state = state;
        _this.changingValue = false;
        _this.debouncedValueUpdater = debounce(function () {
            _this.changingValue = true;
            try {
                _this.state.fragmentMain.value = _this.textEditor.getValue();
            } finally {
                _this.changingValue = false;
            }
        }, SHADER_UPDATE_DELAY);
        _this.textEditor = CodeMirror(function (_element) {}, {
            value: _this.state.fragmentMain.value,
            mode: 'glsl',
            gutters: ['CodeMirror-lint-markers']
        });
        _this.textEditor.on('change', function () {
            _this.setValidState(undefined);
            _this.debouncedValueUpdater();
        });
        _this.registerDisposer(_this.state.fragmentMain.changed.add(function () {
            if (!_this.changingValue) {
                _this.textEditor.setValue(_this.state.fragmentMain.value);
            }
        }));
        _this.element.classList.add('neuroglancer-shader-code-widget');
        _this.registerDisposer(_this.state.shaderError.changed.add(function () {
            _this.updateErrorState();
        }));
        _this.updateErrorState();
        return _this;
    }

    _createClass(ShaderCodeWidget, [{
        key: 'updateErrorState',
        value: function updateErrorState() {
            var _this2 = this;

            var error = this.state.shaderError.value;
            if (error === undefined) {
                this.setValidState(undefined);
            } else if (error !== null) {
                this.textEditor.setOption('lint', {
                    getAnnotations: function getAnnotations() {
                        if (error.name === 'ShaderCompilationError') {
                            var fragmentMainStartLineNumber = error.source.split('\n').indexOf(_this2.state.fragmentMainStartLine) + 2;
                            return error.errorMessages.map(function (e) {
                                return {
                                    message: e.message,
                                    severity: 'error',
                                    from: CodeMirror.Pos(e.line === undefined ? 0 : e.line - fragmentMainStartLineNumber)
                                };
                            });
                        } else if (error.name === 'ShaderLinkError') {
                            return [{
                                message: error.log,
                                severity: 'error',
                                from: CodeMirror.Pos(0)
                            }];
                        } else {
                            return [{
                                message: error.message,
                                severity: 'error',
                                from: CodeMirror.Pos(0)
                            }];
                        }
                    }
                });
                this.setValidState(false);
            } else {
                this.textEditor.setOption('lint', undefined);
                this.setValidState(true);
            }
        }
    }, {
        key: 'setValidState',
        value: function setValidState(valid) {
            var element = this.element;

            element.classList.remove('invalid-input');
            element.classList.remove('valid-input');
            if (valid === true) {
                element.classList.add('valid-input');
            } else if (valid === false) {
                element.classList.add('invalid-input');
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.debouncedValueUpdater.flush();
            this.debouncedValueUpdater = undefined;
            removeFromParent(this.element);
            this.textEditor = undefined;
            _get(ShaderCodeWidget.prototype.__proto__ || _Object$getPrototypeOf(ShaderCodeWidget.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'element',
        get: function get() {
            return this.textEditor.getWrapperElement();
        }
    }]);

    return ShaderCodeWidget;
}(RefCounted);
//# sourceMappingURL=shader_code_widget.js.map