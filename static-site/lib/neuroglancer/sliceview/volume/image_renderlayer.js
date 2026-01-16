import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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
import { RenderLayer } from './renderlayer';
import { trackableAlphaValue } from '../../trackable_alpha';
import { BLEND_FUNCTIONS, BLEND_MODES, trackableBlendModeValue } from '../../trackable_blend';
import { verifyEnumString } from '../../util/json';
import { makeTrackableFragmentMain } from '../../webgl/dynamic_shader';
import { colormaps } from '../../webgl/colormaps';
export var FRAGMENT_MAIN_START = '//NEUROGLANCER_IMAGE_RENDERLAYER_FRAGMENT_MAIN_START';
var DEFAULT_FRAGMENT_MAIN = 'void main() {\n  emitGrayscale(toNormalized(getDataValue()));\n}\n';
var glsl_COLORMAPS = colormaps();
export function getTrackableFragmentMain() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_FRAGMENT_MAIN;

    return makeTrackableFragmentMain(value);
}
export var ImageRenderLayer = function (_RenderLayer) {
    _inherits(ImageRenderLayer, _RenderLayer);

    function ImageRenderLayer(multiscaleSource, options) {
        _classCallCheck(this, ImageRenderLayer);

        var _this = _possibleConstructorReturn(this, (ImageRenderLayer.__proto__ || _Object$getPrototypeOf(ImageRenderLayer)).call(this, multiscaleSource, options));

        var _options$opacity = options.opacity,
            opacity = _options$opacity === undefined ? trackableAlphaValue(0.5) : _options$opacity,
            _options$blendMode = options.blendMode,
            blendMode = _options$blendMode === undefined ? trackableBlendModeValue() : _options$blendMode,
            _options$fragmentMain = options.fragmentMain,
            fragmentMain = _options$fragmentMain === undefined ? getTrackableFragmentMain() : _options$fragmentMain;

        _this.fragmentMain = fragmentMain;
        _this.opacity = opacity;
        _this.blendMode = blendMode;
        _this.registerDisposer(opacity.changed.add(function () {
            _this.redrawNeeded.dispatch();
        }));
        _this.registerDisposer(fragmentMain.changed.add(function () {
            _this.shaderGetter.invalidateShader();
            _this.redrawNeeded.dispatch();
        }));
        return _this;
    }

    _createClass(ImageRenderLayer, [{
        key: 'getShaderKey',
        value: function getShaderKey() {
            return 'volume.ImageRenderLayer:' + _JSON$stringify(this.fragmentMain.value);
        }
    }, {
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(ImageRenderLayer.prototype.__proto__ || _Object$getPrototypeOf(ImageRenderLayer.prototype), 'defineShader', this).call(this, builder);
            builder.addUniform('highp float', 'uOpacity');
            builder.addFragmentCode('\nvoid emitRGBA(vec4 rgba) {\n  emit(vec4(rgba.rgb, rgba.a * uOpacity));\n}\nvoid emitRGB(vec3 rgb) {\n  emit(vec4(rgb, uOpacity));\n}\nvoid emitGrayscale(float value) {\n  emit(vec4(value, value, value, uOpacity));\n}\nvoid emitTransparent() {\n  emit(vec4(0.0, 0.0, 0.0, 0.0));\n}\n');
            builder.addFragmentCode(glsl_COLORMAPS);
            builder.setFragmentMainFunction(FRAGMENT_MAIN_START + '\n' + this.fragmentMain.value);
        }
    }, {
        key: 'beginSlice',
        value: function beginSlice(sliceView) {
            var shader = _get(ImageRenderLayer.prototype.__proto__ || _Object$getPrototypeOf(ImageRenderLayer.prototype), 'beginSlice', this).call(this, sliceView);
            if (shader === undefined) {
                return undefined;
            }
            var gl = this.gl;

            gl.uniform1f(shader.uniform('uOpacity'), this.opacity.value);
            return shader;
        }
    }, {
        key: 'setGLBlendMode',
        value: function setGLBlendMode(gl, renderLayerNum) {
            var blendModeValue = verifyEnumString(this.blendMode.value, BLEND_MODES);
            if (blendModeValue === BLEND_MODES.ADDITIVE || renderLayerNum > 0) {
                gl.enable(gl.BLEND);
                BLEND_FUNCTIONS.get(blendModeValue)(gl);
            }
        }
    }]);

    return ImageRenderLayer;
}(RenderLayer);
//# sourceMappingURL=image_renderlayer.js.map