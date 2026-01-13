import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _Promise from 'babel-runtime/core-js/promise';
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
import { UserLayer } from './layer';
import { registerLayerType } from './layer_specification';
import { VectorGraphicsType } from './sliceview/vector_graphics/base';
import { VectorGraphicsLineRenderLayer } from './sliceview/vector_graphics/vector_graphics_line_renderlayer';
import { StatusMessage } from './status';
import { trackableAlphaValue } from './trackable_alpha';
import { trackableFiniteFloat } from './trackable_finite_float';
import { trackableVec3 } from './trackable_vec3';
import { vec3 } from './util/geom';
import { verifyEnumString, verifyFiniteFloat, verifyOptionalString } from './util/json';
import { RangeWidget } from './widget/range';
import { Tab } from './widget/tab_view';
import { Vec3Widget } from './widget/vec3_entry_widget';

function getVectorGraphicsWithStatusMessage(dataSourceProvider, chunkManager, x) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    return StatusMessage.forPromise(new _Promise(function (resolve) {
        resolve(dataSourceProvider.getVectorGraphicsSource(chunkManager, x, options));
    }), {
        initialMessage: 'Retrieving metadata for vector graphics source ' + x + '.',
        delay: true,
        errorPrefix: 'Error retrieving metadata for vector graphics source ' + x + ': '
    });
}
export var VectorGraphicsUserLayer = function (_UserLayer) {
    _inherits(VectorGraphicsUserLayer, _UserLayer);

    function VectorGraphicsUserLayer(manager, x) {
        _classCallCheck(this, VectorGraphicsUserLayer);

        var _this = _possibleConstructorReturn(this, (VectorGraphicsUserLayer.__proto__ || _Object$getPrototypeOf(VectorGraphicsUserLayer)).call(this, manager, x));

        _this.opacity = trackableAlphaValue(0.5);
        _this.lineWidth = trackableFiniteFloat(10.0);
        _this.color = trackableVec3(vec3.fromValues(1.0, 1.0, 1.0));
        _this.opacity.restoreState(x['opacity']);
        _this.lineWidth.restoreState(x['linewidth']);
        _this.color.restoreState(x['color']);
        _this.lineWidth.changed.add(function () {
            _this.specificationChanged.dispatch();
        });
        _this.color.changed.add(function () {
            _this.specificationChanged.dispatch();
        });
        _this.vectorGraphicsLayerType = verifyEnumString(x['type'], VectorGraphicsType);
        var vectorGraphicsPath = _this.vectorGraphicsPath = verifyOptionalString(x['source']);
        var remaining = 0;
        if (vectorGraphicsPath !== undefined) {
            ++remaining;
            if (_this.vectorGraphicsLayerType === VectorGraphicsType.LINE) {
                getVectorGraphicsWithStatusMessage(manager.dataSourceProvider, manager.chunkManager, vectorGraphicsPath).then(function (vectorGraphics) {
                    if (!_this.wasDisposed) {
                        var renderLayer = _this.renderLayer = new VectorGraphicsLineRenderLayer(vectorGraphics, {
                            opacity: _this.opacity,
                            lineWidth: _this.lineWidth,
                            color: _this.color,
                            sourceOptions: {}
                        });
                        _this.addRenderLayer(renderLayer);
                        if (--remaining === 0) {
                            _this.isReady = true;
                        }
                    }
                });
            }
        }
        _this.tabs.add('rendering', { label: 'Rendering', order: -100, getter: function getter() {
                return new DisplayOptionsTab(_this);
            } });
        _this.tabs.default = 'rendering';
        return _this;
    }

    _createClass(VectorGraphicsUserLayer, [{
        key: 'toJSON',
        value: function toJSON() {
            var x = _get(VectorGraphicsUserLayer.prototype.__proto__ || _Object$getPrototypeOf(VectorGraphicsUserLayer.prototype), 'toJSON', this).call(this);
            x['type'] = this.getLayerType();
            x['source'] = this.vectorGraphicsPath;
            x['opacity'] = this.opacity.toJSON();
            x['linewidth'] = this.lineWidth.toJSON();
            x['color'] = this.color.toJSON();
            return x;
        }
    }, {
        key: 'getLayerType',
        value: function getLayerType() {
            var typeStr = VectorGraphicsType[this.vectorGraphicsLayerType];
            return typeStr.toLowerCase();
        }
    }]);

    return VectorGraphicsUserLayer;
}(UserLayer);

var DisplayOptionsTab = function (_Tab) {
    _inherits(DisplayOptionsTab, _Tab);

    function DisplayOptionsTab(layer) {
        _classCallCheck(this, DisplayOptionsTab);

        var _this2 = _possibleConstructorReturn(this, (DisplayOptionsTab.__proto__ || _Object$getPrototypeOf(DisplayOptionsTab)).call(this));

        _this2.layer = layer;
        _this2.opacityWidget = _this2.registerDisposer(new RangeWidget(_this2.layer.opacity));
        _this2.lineWidthWidget = _this2.registerDisposer(new RangeWidget(_this2.layer.lineWidth, { min: 0, max: 50, step: 1 }));
        _this2.colorWidget = _this2.registerDisposer(new VectorGraphicsColorWidget(_this2.layer.color));
        var element = _this2.element;

        element.classList.add('image-dropdown');
        var opacityWidget = _this2.opacityWidget,
            lineWidthWidget = _this2.lineWidthWidget,
            colorWidget = _this2.colorWidget;

        var topRow = document.createElement('div');
        topRow.className = 'image-dropdown-top-row';
        opacityWidget.promptElement.textContent = 'Opacity';
        lineWidthWidget.promptElement.textContent = 'Line Width';
        colorWidget.promptElement.textContent = 'Color';
        var spacer = document.createElement('div');
        spacer.style.flex = '1';
        var helpLink = document.createElement('a');
        var helpButton = document.createElement('button');
        helpButton.type = 'button';
        helpButton.textContent = '?';
        helpButton.className = 'help-link';
        helpLink.appendChild(helpButton);
        helpLink.title = 'Documentation on vector graphics layer rendering';
        helpLink.target = '_blank';
        helpLink.href = 'https://github.com/google/neuroglancer/blob/master/src/neuroglancer/sliceview/vectorgraphics_layer_rendering.md';
        topRow.appendChild(spacer);
        topRow.appendChild(helpLink);
        element.appendChild(topRow);
        element.appendChild(_this2.opacityWidget.element);
        element.appendChild(_this2.lineWidthWidget.element);
        element.appendChild(_this2.colorWidget.element);
        return _this2;
    }

    return DisplayOptionsTab;
}(Tab);

var VectorGraphicsColorWidget = function (_Vec3Widget) {
    _inherits(VectorGraphicsColorWidget, _Vec3Widget);

    function VectorGraphicsColorWidget(model) {
        _classCallCheck(this, VectorGraphicsColorWidget);

        return _possibleConstructorReturn(this, (VectorGraphicsColorWidget.__proto__ || _Object$getPrototypeOf(VectorGraphicsColorWidget)).call(this, model));
    }

    _createClass(VectorGraphicsColorWidget, [{
        key: 'verifyValue',
        value: function verifyValue(value) {
            var num = verifyFiniteFloat(value);
            // Scale from [0,255] to [0,1]
            num = num / 255.0;
            if (num < 0.) {
                return 0.;
            }
            if (num > 1.) {
                return 1.;
            }
            return num;
        }
    }, {
        key: 'updateInput',
        value: function updateInput() {
            this.inputx.valueAsNumber = Math.round(this.model.value[0] * 255.);
            this.inputy.valueAsNumber = Math.round(this.model.value[1] * 255.);
            this.inputz.valueAsNumber = Math.round(this.model.value[2] * 255.);
        }
    }]);

    return VectorGraphicsColorWidget;
}(Vec3Widget);

registerLayerType('line', VectorGraphicsUserLayer);
// registerLayerType('point', VectorGraphicsUserLayer);
//# sourceMappingURL=vector_graphics_user_layer.js.map