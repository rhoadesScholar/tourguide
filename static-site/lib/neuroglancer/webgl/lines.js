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
 * @file Facilities for drawing anti-aliased lines in WebGL as quads.
 */
import { RefCounted } from '../util/disposable';
import { QuadRenderHelper, VERTICES_PER_QUAD } from './quad';
import { getSquareCornersBuffer } from './square_corners_buffer';
export var VERTICES_PER_LINE = VERTICES_PER_QUAD;
export var LineShader = function (_RefCounted) {
    _inherits(LineShader, _RefCounted);

    function LineShader(gl) {
        var linesPerInstance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        _classCallCheck(this, LineShader);

        var _this = _possibleConstructorReturn(this, (LineShader.__proto__ || _Object$getPrototypeOf(LineShader)).call(this));

        _this.linesPerInstance = linesPerInstance;
        _this.lineOffsetsBuffer = getSquareCornersBuffer(gl, 0, -1, 1, 1, /*minorTiles=*/linesPerInstance, /*majorTiles=*/1);
        _this.quadHelper = _this.registerDisposer(new QuadRenderHelper(gl, linesPerInstance));
        return _this;
    }

    _createClass(LineShader, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            builder.addAttribute('highp vec2', 'aLineOffset');
            // x: line width in normalized device x coordinates
            // y: line height in normalized device y coordinates
            // z: Fraction of line width that is feathered
            builder.addUniform('highp vec3', 'uLineParams');
            builder.addVarying('highp float', 'vLineCoord');
            builder.addVertexCode('\nuint getLineEndpointIndex() { return uint(aLineOffset.x); }\n');
            builder.addVertexCode('\nvoid emitLine(mat4 projection, vec3 vertexA, vec3 vertexB) {\n  vec3 vertexPosition = mix(vertexA, vertexB, aLineOffset.x);\n  vec3 otherVertexPosition = mix(vertexB, vertexA, aLineOffset.x);\n\n  vec4 vertexPositionClip = projection * vec4(vertexPosition, 1.0);\n  vec4 otherVertexPositionClip = projection * vec4(otherVertexPosition, 1.0);\n\n  vec3 vertexPositionDevice = vertexPositionClip.xyz / vertexPositionClip.w;\n  vec3 otherVertexPositionDevice = otherVertexPositionClip.xyz / otherVertexPositionClip.w;\n\n  vec2 lineDirection = normalize(otherVertexPositionDevice.xy - vertexPositionDevice.xy);\n  vec2 lineNormal = vec2(lineDirection.y, -lineDirection.x);\n\n  gl_Position = vertexPositionClip;\n  gl_Position.xy += aLineOffset.y * (2.0 * aLineOffset.x - 1.0) * lineNormal * uLineParams.xy * 0.5 * gl_Position.w;\n  vLineCoord = aLineOffset.y;\n}\n');
            builder.addFragmentCode('\nfloat getLineAlpha() {\n  return clamp((1.0 - abs(vLineCoord)) / uLineParams.z, 0.0, 1.0);\n}\n');
        }
    }, {
        key: 'draw',
        value: function draw(shader, renderContext, lineWidthInPixels, featherWidthInPixels, numInstances) {
            var aLineOffset = shader.attribute('aLineOffset');
            this.lineOffsetsBuffer.bindToVertexAttrib(aLineOffset, /*components=*/2);
            var lineWidthIncludingFeather = lineWidthInPixels + featherWidthInPixels;
            var gl = shader.gl;

            gl.uniform3f(shader.uniform('uLineParams'), lineWidthIncludingFeather / renderContext.viewportWidth, lineWidthIncludingFeather / renderContext.viewportHeight, featherWidthInPixels === 0 ? 1e-6 : featherWidthInPixels / lineWidthIncludingFeather);
            this.quadHelper.draw(gl, numInstances);
            gl.disableVertexAttribArray(aLineOffset);
        }
    }]);

    return LineShader;
}(RefCounted);
//# sourceMappingURL=lines.js.map