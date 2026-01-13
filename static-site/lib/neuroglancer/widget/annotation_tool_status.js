import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';

import { RefCounted } from '../util/disposable'; /**
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

export var AnnotationToolStatusWidget = function (_RefCounted) {
    _inherits(AnnotationToolStatusWidget, _RefCounted);

    function AnnotationToolStatusWidget(selectedLayer) {
        _classCallCheck(this, AnnotationToolStatusWidget);

        var _this = _possibleConstructorReturn(this, (AnnotationToolStatusWidget.__proto__ || _Object$getPrototypeOf(AnnotationToolStatusWidget)).call(this));

        _this.selectedLayer = selectedLayer;
        _this.element = document.createElement('div');
        var element = _this.element;

        element.className = 'neuroglancer-annotation-tool-status-widget';
        _this.registerDisposer(selectedLayer.changed.add(function () {
            return _this.selectedLayerChanged();
        }));
        _this.selectedLayerChanged();
        return _this;
    }

    _createClass(AnnotationToolStatusWidget, [{
        key: 'selectedLayerChanged',
        value: function selectedLayerChanged() {
            var _this2 = this;

            var unbindPreviousLayer = this.unbindPreviousLayer;

            if (unbindPreviousLayer !== undefined) {
                unbindPreviousLayer();
            }
            var layer = this.selectedLayer.layer;
            if (layer !== undefined) {
                this.unbindPreviousLayer = layer.specificationChanged.add(function () {
                    _this2.updateView();
                });
            }
            this.updateView();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var unbindPreviousLayer = this.unbindPreviousLayer;

            if (unbindPreviousLayer !== undefined) {
                unbindPreviousLayer();
            }
            this.unbindPreviousLayer = undefined;
        }
    }, {
        key: 'getDescriptionText',
        value: function getDescriptionText() {
            var layer = this.selectedLayer.layer;
            if (layer === undefined) {
                return undefined;
            }
            var userLayer = layer.layer;
            if (userLayer === null) {
                return undefined;
            }
            var tool = userLayer.tool.value;
            if (tool === undefined) {
                return undefined;
            }
            return tool.description;
        }
    }, {
        key: 'updateView',
        value: function updateView() {
            this.element.textContent = this.getDescriptionText() || '';
        }
    }]);

    return AnnotationToolStatusWidget;
}(RefCounted);
//# sourceMappingURL=annotation_tool_status.js.map