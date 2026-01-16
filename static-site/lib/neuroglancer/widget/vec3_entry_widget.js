import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2017 Google Inc.
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
import { RefCounted } from '../util/disposable';
import { vec3 } from '../util/geom';
import { verifyFiniteFloat } from '../util/json';
import { Signal } from '../util/signal';

export var Vec3Widget = function (_RefCounted) {
    _inherits(Vec3Widget, _RefCounted);

    function Vec3Widget(model) {
        _classCallCheck(this, Vec3Widget);

        var _this = _possibleConstructorReturn(this, (Vec3Widget.__proto__ || _Object$getPrototypeOf(Vec3Widget)).call(this));

        _this.model = model;
        _this.promptElement = document.createElement('span');
        _this.element = document.createElement('label');
        _this.inputx = document.createElement('input');
        _this.inputy = document.createElement('input');
        _this.inputz = document.createElement('input');
        _this.valueEntered = new Signal();
        var inputx = _this.inputx,
            inputy = _this.inputy,
            inputz = _this.inputz,
            element = _this.element,
            promptElement = _this.promptElement;

        element.className = 'vec3-input-row';
        promptElement.className = 'vec3-input-label';
        element.appendChild(promptElement);
        element.appendChild(inputx);
        element.appendChild(inputy);
        element.appendChild(inputz);
        inputx.type = inputy.type = inputz.type = 'number';
        _this.updateInput();
        var inputValueChanged = function inputValueChanged() {
            _this.model.value = _this.getVec3Values();
        };
        _this.registerEventListener(inputx, 'change', inputValueChanged);
        _this.registerEventListener(inputy, 'change', inputValueChanged);
        _this.registerEventListener(inputz, 'change', inputValueChanged);
        _this.model.changed.add(function () {
            _this.updateInput();
        });
        return _this;
    }

    _createClass(Vec3Widget, [{
        key: 'getVec3Values',
        value: function getVec3Values() {
            var ret = vec3.create();
            ret[0] = this.verifyValue(this.inputx.valueAsNumber);
            ret[1] = this.verifyValue(this.inputy.valueAsNumber);
            ret[2] = this.verifyValue(this.inputz.valueAsNumber);
            return ret;
        }
    }, {
        key: 'verifyValue',
        value: function verifyValue(value) {
            return verifyFiniteFloat(value);
        }
    }, {
        key: 'updateInput',
        value: function updateInput() {
            this.inputx.valueAsNumber = this.model.value[0];
            this.inputy.valueAsNumber = this.model.value[1];
            this.inputz.valueAsNumber = this.model.value[2];
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var inputx = this.inputx,
                inputy = this.inputy,
                inputz = this.inputz,
                element = this.element;

            if (inputx.parentElement) {
                inputx.parentElement.removeChild(inputx);
            }
            if (inputy.parentElement) {
                inputy.parentElement.removeChild(inputy);
            }
            if (inputz.parentElement) {
                inputz.parentElement.removeChild(inputz);
            }
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }
            _get(Vec3Widget.prototype.__proto__ || _Object$getPrototypeOf(Vec3Widget.prototype), 'disposed', this).call(this);
        }
    }]);

    return Vec3Widget;
}(RefCounted);
//# sourceMappingURL=vec3_entry_widget.js.map