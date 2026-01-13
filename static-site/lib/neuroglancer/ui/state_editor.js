import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';

import 'codemirror/mode/javascript/javascript'; /**
                                                 * @license
                                                 * Copyright 2018 Google Inc.
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
/**
 * @file Support for editing Neuroglancer state as JSON directly within browser.
 */

import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';

import CodeMirror from 'codemirror';
import debounce from 'lodash/debounce';
import { Overlay } from '../overlay';
import { getCachedJson } from '../util/trackable';
var valueUpdateDelay = 100;
export var StateEditorDialog = function (_Overlay) {
    _inherits(StateEditorDialog, _Overlay);

    function StateEditorDialog(viewer) {
        _classCallCheck(this, StateEditorDialog);

        var _this = _possibleConstructorReturn(this, (StateEditorDialog.__proto__ || _Object$getPrototypeOf(StateEditorDialog)).call(this));

        _this.viewer = viewer;
        _this.parsedValue = null;
        _this.debouncedValueUpdater = debounce(function () {
            var value = _this.textEditor.getValue();
            try {
                var json = JSON.parse(value);
                _this.parsedValue = json;
                _this.applyButton.disabled = false;
                _this.textEditor.setOption('lint', undefined);
            } catch (parseError) {
                _this.parsedValue = null;
                _this.applyButton.disabled = true;
                var line = 0,
                    column = 0,
                    message = 'Unknown parse error';
                if (parseError instanceof Error) {
                    var m = parseError.message.match(/^((?:.|\n)*) in JSON at position ([0-9]+)$/);
                    if (m !== null) {
                        message = m[1];
                        var offset = parseInt(m[2], 10);
                        var prefix = value.substring(0, offset);
                        var lines = prefix.split('\n');
                        line = lines.length - 1;
                        column = lines[lines.length - 1].length;
                    } else {
                        message = parseError.message;
                    }
                }
                _this.textEditor.setOption('lint', {
                    getAnnotations: function getAnnotations() {
                        return [{
                            message: message,
                            severity: 'error',
                            from: CodeMirror.Pos(line, column)
                        }];
                    }
                });
            }
        }, valueUpdateDelay);
        _this.content.classList.add('neuroglancer-state-editor');
        var button = _this.applyButton = document.createElement('button');
        button.textContent = 'Apply changes';
        _this.content.appendChild(button);
        button.addEventListener('click', function () {
            return _this.applyChanges();
        });
        button.disabled = true;
        _this.textEditor = CodeMirror(function (_element) {}, {
            value: '',
            mode: { 'name': 'javascript', json: true },
            foldGutter: true,
            gutters: ['CodeMirror-lint-markers', 'CodeMirror-foldgutter']
        });
        _this.updateView();
        _this.textEditor.on('change', function () {
            _this.debouncedValueUpdater();
        });
        _this.content.appendChild(_this.textEditor.getWrapperElement());
        _this.textEditor.refresh();
        return _this;
    }

    _createClass(StateEditorDialog, [{
        key: 'applyChanges',
        value: function applyChanges() {
            if (this.parsedValue !== null) {
                this.viewer.state.reset();
                this.viewer.state.restoreState(this.parsedValue);
            }
            this.applyButton.disabled = true;
        }
    }, {
        key: 'updateView',
        value: function updateView() {
            this.textEditor.setValue(this.getJson());
            this.textEditor.execCommand('foldAll');
            this.textEditor.execCommand('unfold');
        }
    }, {
        key: 'getJson',
        value: function getJson() {
            return _JSON$stringify(getCachedJson(this.viewer.state).value, null, '  ');
        }
    }]);

    return StateEditorDialog;
}(Overlay);
//# sourceMappingURL=state_editor.js.map