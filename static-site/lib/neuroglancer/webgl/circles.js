import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
/**
 * @file Facilities for drawing circles in WebGL as quads (triangle fan).
 */
import { RefCounted } from '../util/disposable';
import { QuadRenderHelper } from './quad';
import { getSquareCornersBuffer } from './square_corners_buffer';
export var VERTICES_PER_CIRCLE = 4;
export var CircleShader = function (_RefCounted) {
    _inherits(CircleShader, _RefCounted);

    function CircleShader(gl) {
        var circlesPerInstance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        _classCallCheck(this, CircleShader);

        var _this = _possibleConstructorReturn(this, (CircleShader.__proto__ || _Object$getPrototypeOf(CircleShader)).call(this));

        _this.circlesPerInstance = circlesPerInstance;
        _this.squareCornersBuffer = getSquareCornersBuffer(gl, -1, -1, 1, 1, /*minorTiles=*/circlesPerInstance, /*majorTiles=*/1);
        _this.quadHelper = _this.registerDisposer(new QuadRenderHelper(gl, circlesPerInstance));
        return _this;
    }

    _createClass(CircleShader, [{
        key: 'defineShader',
        value: function defineShader(builder, crossSectionFade) {
            // XY corners of square ranging from [-1, -1] to [1, 1].
            builder.addAttribute('highp vec2', 'aCircleCornerOffset');
            // x and y components: The x and y radii of the point in normalized device coordinates.
            // z component: Starting point of border from [0, 1]..
            // w component: Fraction of total radius that is feathered.
            builder.addUniform('highp vec4', 'uCircleParams');
            // 2-D position within circle quad, ranging from [-1, -1] to [1, 1].
            builder.addVarying('highp vec2', 'vCircleCoord');
            builder.addVertexCode('\nvoid emitCircle(vec4 position) {\n  gl_Position = position;\n  gl_Position.xy += aCircleCornerOffset * uCircleParams.xy * gl_Position.w;\n  vCircleCoord = aCircleCornerOffset;\n}\n');
            if (crossSectionFade) {
                builder.addFragmentCode('\nfloat getCircleAlphaMultiplier() {\n  return 1.0 - 2.0 * abs(0.5 - gl_FragCoord.z);\n}\n');
            } else {
                builder.addFragmentCode('\nfloat getCircleAlphaMultiplier() {\n  return 1.0;\n}\n');
            }
            builder.addFragmentCode('\nvec4 getCircleColor(vec4 interiorColor, vec4 borderColor) {\n  float radius = length(vCircleCoord);\n  if (radius > 1.0) {\n    discard;\n  }\n\n  float borderColorFraction = clamp((radius - uCircleParams.z) / uCircleParams.w, 0.0, 1.0);\n  float feather = clamp((1.0 - radius) / uCircleParams.w, 0.0, 1.0);\n  vec4 color = mix(interiorColor, borderColor, borderColorFraction);\n\n  return vec4(color.rgb, color.a * feather * getCircleAlphaMultiplier());\n}\n');
        }
    }, {
        key: 'draw',
        value: function draw(shader, renderContext, options, count) {
            var gl = shader.gl;

            var aCircleCornerOffset = shader.attribute('aCircleCornerOffset');
            this.squareCornersBuffer.bindToVertexAttrib(aCircleCornerOffset, /*components=*/2);
            var totalRadius = options.interiorRadiusInPixels + options.borderWidthInPixels + options.featherWidthInPixels;
            gl.uniform4f(shader.uniform('uCircleParams'), totalRadius / renderContext.viewportWidth, totalRadius / renderContext.viewportHeight, options.interiorRadiusInPixels / totalRadius, options.featherWidthInPixels === 0 ? 1e-6 : options.featherWidthInPixels / totalRadius);
            this.quadHelper.draw(gl, count);
            shader.gl.disableVertexAttribArray(aCircleCornerOffset);
        }
    }]);

    return CircleShader;
}(RefCounted);
//# sourceMappingURL=circles.js.map