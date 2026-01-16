import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
/**
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
import debounce from 'lodash/debounce';
import { RefCounted } from '../util/disposable';
import { removeChildren } from '../util/dom';
export var LayerReferenceWidget = function (_RefCounted) {
    _inherits(LayerReferenceWidget, _RefCounted);

    function LayerReferenceWidget(ref) {
        _classCallCheck(this, LayerReferenceWidget);

        var _this = _possibleConstructorReturn(this, (LayerReferenceWidget.__proto__ || _Object$getPrototypeOf(LayerReferenceWidget)).call(this));

        _this.ref = ref;
        _this.element = document.createElement('label');
        _this.selectElement = document.createElement('select');
        _this.registerDisposer(ref);
        var element = _this.element,
            selectElement = _this.selectElement;

        element.appendChild(selectElement);
        _this.updateView();
        _this.registerEventListener(selectElement, 'change', function () {
            return _this.updateModel();
        });
        _this.registerDisposer(_this.ref.changed.add(debounce(function () {
            return _this.updateView();
        }, 0)));
        return _this;
    }

    _createClass(LayerReferenceWidget, [{
        key: 'updateModel',
        value: function updateModel() {
            this.ref.layerName = this.selectElement.value || undefined;
        }
    }, {
        key: 'updateView',
        value: function updateView() {
            var selectElement = this.selectElement,
                ref = this.ref;
            var filter = ref.filter;

            removeChildren(selectElement);
            var emptyOption = document.createElement('option');
            selectElement.appendChild(emptyOption);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.ref.layerManager.managedLayers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var layer = _step.value;

                    if (filter(layer)) {
                        var option = document.createElement('option');
                        var name = layer.name;

                        option.textContent = name;
                        option.value = name;
                        selectElement.appendChild(option);
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

            selectElement.value = ref.layerName || '';
        }
    }]);

    return LayerReferenceWidget;
}(RefCounted);
//# sourceMappingURL=layer_reference.js.map