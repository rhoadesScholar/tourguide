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
import { UserLayer } from './layer';
import { registerLayerType, registerVolumeLayerType } from './layer_specification';
import { Overlay } from './overlay';
import { VolumeType } from './sliceview/volume/base';
import { FRAGMENT_MAIN_START, getTrackableFragmentMain, ImageRenderLayer } from './sliceview/volume/image_renderlayer';
import { trackableAlphaValue } from './trackable_alpha';
import { trackableBlendModeValue } from './trackable_blend';
import { UserLayerWithVolumeSourceMixin } from './user_layer_with_volume_source';
import { makeWatchableShaderError } from './webgl/dynamic_shader';
import { RangeWidget } from './widget/range';
import { RenderScaleWidget } from './widget/render_scale_widget';
import { ShaderCodeWidget } from './widget/shader_code_widget';
import { Tab } from './widget/tab_view';

var OPACITY_JSON_KEY = 'opacity';
var BLEND_JSON_KEY = 'blend';
var SHADER_JSON_KEY = 'shader';
var Base = UserLayerWithVolumeSourceMixin(UserLayer);
export var ImageUserLayer = function (_Base) {
    _inherits(ImageUserLayer, _Base);

    function ImageUserLayer(manager, x) {
        _classCallCheck(this, ImageUserLayer);

        var _this = _possibleConstructorReturn(this, (ImageUserLayer.__proto__ || _Object$getPrototypeOf(ImageUserLayer)).call(this, manager, x));

        _this.opacity = trackableAlphaValue(0.5);
        _this.blendMode = trackableBlendModeValue();
        _this.fragmentMain = getTrackableFragmentMain();
        _this.shaderError = makeWatchableShaderError();
        _this.registerDisposer(_this.fragmentMain.changed.add(_this.specificationChanged.dispatch));
        _this.tabs.add('rendering', { label: 'Rendering', order: -100, getter: function getter() {
                return new RenderingOptionsTab(_this);
            } });
        _this.tabs.default = 'rendering';
        return _this;
    }

    _createClass(ImageUserLayer, [{
        key: 'restoreState',
        value: function restoreState(specification) {
            var _this2 = this;

            _get(ImageUserLayer.prototype.__proto__ || _Object$getPrototypeOf(ImageUserLayer.prototype), 'restoreState', this).call(this, specification);
            console.log('restore image user layer');
            this.opacity.restoreState(specification[OPACITY_JSON_KEY]);
            this.blendMode.restoreState(specification[BLEND_JSON_KEY]);
            this.fragmentMain.restoreState(specification[SHADER_JSON_KEY]);
            var multiscaleSource = this.multiscaleSource;

            if (multiscaleSource === undefined) {
                throw new Error('source property must be specified');
            }
            multiscaleSource.then(function (volume) {
                if (!_this2.wasDisposed) {
                    var renderLayer = _this2.renderLayer = new ImageRenderLayer(volume, {
                        opacity: _this2.opacity,
                        blendMode: _this2.blendMode,
                        fragmentMain: _this2.fragmentMain,
                        shaderError: _this2.shaderError,
                        transform: _this2.transform,
                        renderScaleTarget: _this2.sliceViewRenderScaleTarget,
                        renderScaleHistogram: _this2.sliceViewRenderScaleHistogram
                    });
                    _this2.addRenderLayer(renderLayer);
                    _this2.shaderError.changed.dispatch();
                    _this2.isReady = true;
                }
            });
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var x = _get(ImageUserLayer.prototype.__proto__ || _Object$getPrototypeOf(ImageUserLayer.prototype), 'toJSON', this).call(this);
            x['type'] = 'image';
            x[OPACITY_JSON_KEY] = this.opacity.toJSON();
            x[BLEND_JSON_KEY] = this.blendMode.toJSON();
            x[SHADER_JSON_KEY] = this.fragmentMain.toJSON();
            return x;
        }
    }]);

    return ImageUserLayer;
}(Base);
function makeShaderCodeWidget(layer) {
    return new ShaderCodeWidget({
        shaderError: layer.shaderError,
        fragmentMain: layer.fragmentMain,
        fragmentMainStartLine: FRAGMENT_MAIN_START
    });
}

var RenderingOptionsTab = function (_Tab) {
    _inherits(RenderingOptionsTab, _Tab);

    function RenderingOptionsTab(layer) {
        _classCallCheck(this, RenderingOptionsTab);

        var _this3 = _possibleConstructorReturn(this, (RenderingOptionsTab.__proto__ || _Object$getPrototypeOf(RenderingOptionsTab)).call(this));

        _this3.layer = layer;
        _this3.opacityWidget = _this3.registerDisposer(new RangeWidget(_this3.layer.opacity));
        _this3.codeWidget = _this3.registerDisposer(makeShaderCodeWidget(_this3.layer));
        var element = _this3.element;

        element.classList.add('image-dropdown');
        var opacityWidget = _this3.opacityWidget;

        var topRow = document.createElement('div');
        topRow.className = 'image-dropdown-top-row';
        opacityWidget.promptElement.textContent = 'Opacity';
        {
            var renderScaleWidget = _this3.registerDisposer(new RenderScaleWidget(_this3.layer.sliceViewRenderScaleHistogram, _this3.layer.sliceViewRenderScaleTarget));
            renderScaleWidget.label.textContent = 'Resolution (slice)';
            element.appendChild(renderScaleWidget.element);
        }
        var spacer = document.createElement('div');
        spacer.style.flex = '1';
        var helpLink = document.createElement('a');
        var helpButton = document.createElement('button');
        helpButton.type = 'button';
        helpButton.textContent = '?';
        helpButton.className = 'help-link';
        helpLink.appendChild(helpButton);
        helpLink.title = 'Documentation on image layer rendering';
        helpLink.target = '_blank';
        helpLink.href = 'https://github.com/google/neuroglancer/blob/master/src/neuroglancer/sliceview/image_layer_rendering.md';
        var maximizeButton = document.createElement('button');
        maximizeButton.innerHTML = '&square;';
        maximizeButton.className = 'maximize-button';
        maximizeButton.title = 'Show larger editor view';
        _this3.registerEventListener(maximizeButton, 'click', function () {
            new ShaderCodeOverlay(_this3.layer);
        });
        topRow.appendChild(_this3.opacityWidget.element);
        topRow.appendChild(spacer);
        topRow.appendChild(maximizeButton);
        topRow.appendChild(helpLink);
        element.appendChild(topRow);
        element.appendChild(_this3.codeWidget.element);
        _this3.codeWidget.textEditor.refresh();
        _this3.visibility.changed.add(function () {
            if (_this3.visible) {
                _this3.codeWidget.textEditor.refresh();
            }
        });
        return _this3;
    }

    return RenderingOptionsTab;
}(Tab);

var ShaderCodeOverlay = function (_Overlay) {
    _inherits(ShaderCodeOverlay, _Overlay);

    function ShaderCodeOverlay(layer) {
        _classCallCheck(this, ShaderCodeOverlay);

        var _this4 = _possibleConstructorReturn(this, (ShaderCodeOverlay.__proto__ || _Object$getPrototypeOf(ShaderCodeOverlay)).call(this));

        _this4.layer = layer;
        _this4.codeWidget = _this4.registerDisposer(makeShaderCodeWidget(_this4.layer));
        _this4.content.classList.add('image-layer-shader-overlay');
        _this4.content.appendChild(_this4.codeWidget.element);
        _this4.codeWidget.textEditor.refresh();
        return _this4;
    }

    return ShaderCodeOverlay;
}(Overlay);

registerLayerType('image', ImageUserLayer);
registerVolumeLayerType(VolumeType.IMAGE, ImageUserLayer);
//# sourceMappingURL=image_user_layer.js.map