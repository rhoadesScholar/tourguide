import _Number$isNaN from 'babel-runtime/core-js/number/is-nan';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';

import { float32ToString } from '../util/float32_to_string'; /**
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
 * @file Tab for updating a coordinate transform.
 */

import { Tab } from './tab_view';
export var CoordinateTransformTab = function (_Tab) {
    _inherits(CoordinateTransformTab, _Tab);

    function CoordinateTransformTab(transform) {
        _classCallCheck(this, CoordinateTransformTab);

        var _this = _possibleConstructorReturn(this, (CoordinateTransformTab.__proto__ || _Object$getPrototypeOf(CoordinateTransformTab)).call(this));

        _this.transform = transform;
        _this.textArea = document.createElement('textarea');
        _this.modelGeneration = -1;
        var element = _this.element;

        element.classList.add('neuroglancer-coordinate-transform-widget');
        var textArea = _this.textArea;

        var textAreaLabel = document.createElement('label');
        textAreaLabel.className = 'neuroglancer-coordinate-transform-widget-homogeneous';
        textAreaLabel.textContent = '3×4 Homogeneous transformation matrix';
        textAreaLabel.appendChild(textArea);
        element.appendChild(textAreaLabel);
        _this.registerDisposer(transform.changed.add(function () {
            return _this.updateView();
        }));
        _this.registerDisposer(_this.visibility.changed.add(function () {
            return _this.updateView();
        }));
        textArea.addEventListener('change', function () {
            return _this.updateModel();
        });
        textArea.addEventListener('blur', function () {
            return _this.updateModel();
        });
        textArea.title = 'Homogeneous transformation matrix';
        textArea.rows = 3;
        var resetButton = document.createElement('button');
        resetButton.textContent = 'Reset to identity';
        resetButton.addEventListener('click', function () {
            return _this.transform.reset();
        });
        element.appendChild(resetButton);
        _this.updateView();
        return _this;
    }

    _createClass(CoordinateTransformTab, [{
        key: 'updateView',
        value: function updateView() {
            if (!this.visible) {
                return;
            }
            var generation = this.transform.changed.count;
            if (this.modelGeneration !== generation) {
                var value = '';
                var transform = this.transform.transform;

                for (var i = 0; i < 3; ++i) {
                    if (i !== 0) {
                        value += '\n';
                    }
                    for (var j = 0; j < 4; ++j) {
                        var x = transform[j * 4 + i];
                        if (j !== 0) {
                            value += ' ';
                        }
                        value += float32ToString(x);
                    }
                }
                this.textArea.value = value;
                this.modelGeneration = generation;
            }
        }
    }, {
        key: 'updateModel',
        value: function updateModel() {
            var parts = this.textArea.value.split(/[\s,\[\]\(\)\{\}]/).filter(function (x) {
                return x.length > 0;
            });
            if (parts.length === 12) {
                var numbers = [];
                for (var i = 0; i < 12; ++i) {
                    var n = parseFloat(parts[i]);
                    if (_Number$isNaN(n)) {
                        return false;
                    }
                    numbers[i] = n;
                }
                var transform = this.transform.transform;

                transform[3] = transform[7] = transform[10] = 0;
                transform[15] = 1;
                for (var _i = 0; _i < 4; ++_i) {
                    for (var j = 0; j < 3; ++j) {
                        transform[_i * 4 + j] = numbers[_i + j * 4];
                    }
                }
                this.transform.changed.dispatch();
                return true;
            }
            return false;
        }
    }]);

    return CoordinateTransformTab;
}(Tab);
//# sourceMappingURL=coordinate_transform.js.map