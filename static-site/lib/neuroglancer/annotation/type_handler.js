import _Map from 'babel-runtime/core-js/map';
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
import { RefCounted } from '../util/disposable';
var tempPickID = new Float32Array(4);
export var AnnotationRenderHelper = function (_RefCounted) {
    _inherits(AnnotationRenderHelper, _RefCounted);

    function AnnotationRenderHelper(gl) {
        _classCallCheck(this, AnnotationRenderHelper);

        var _this = _possibleConstructorReturn(this, (AnnotationRenderHelper.__proto__ || _Object$getPrototypeOf(AnnotationRenderHelper)).call(this));

        _this.gl = gl;
        return _this;
    }

    _createClass(AnnotationRenderHelper, [{
        key: 'setPartIndex',
        value: function setPartIndex(builder) {
            for (var _len = arguments.length, partIndexExpressions = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                partIndexExpressions[_key - 1] = arguments[_key];
            }

            var s = '\nvoid setPartIndex(' + partIndexExpressions.map(function (_, i) {
                return 'highp uint partIndex' + i;
            }).join() + ') {\n  highp uint pickID = uPickID;\n  highp uint pickBaseOffset = getPickBaseOffset();\n' + partIndexExpressions.map(function (_, i) {
                return 'highp uint pickOffset' + i + ' = pickBaseOffset + partIndex' + i + ';';
            }).join('\n') + '\n';
            if (partIndexExpressions.length === 0) {
                s += '\n  highp uint pickOffset0 = pickBaseOffset;\n';
            }
            s += '\n  vPickID = pickID + pickOffset0;\n  highp uint selectedIndex = uSelectedIndex;\nif (selectedIndex == pickBaseOffset' + partIndexExpressions.map(function (_, i) {
                return ' || selectedIndex == pickOffset' + i;
            }).join('') + ') {\n    vColor = uColorSelected;\n  } else {\n    vColor = uColor;\n  }\n}\n';
            // console.log(s);
            builder.addVertexCode(s);
            return 'setPartIndex(' + partIndexExpressions.join() + ')';
        }
    }, {
        key: 'getCrossSectionFadeFactor',
        value: function getCrossSectionFadeFactor() {
            if (this.targetIsSliceView) {
                return '(clamp(1.0 - 2.0 * abs(0.5 - gl_FragCoord.z), 0.0, 1.0))';
            } else {
                return '(1.0)';
            }
        }
    }, {
        key: 'defineShader',
        value: function defineShader(builder) {
            builder.addUniform('highp vec4', 'uColor');
            builder.addUniform('highp vec4', 'uColorSelected');
            builder.addUniform('highp uint', 'uSelectedIndex');
            builder.addVarying('highp vec4', 'vColor');
            // Transform from camera to clip coordinates.
            builder.addUniform('highp mat4', 'uProjection');
            builder.addUniform('highp uint', 'uPickID');
            builder.addVarying('highp uint', 'vPickID', 'flat');
            builder.addVertexCode('\nhighp uint getPickBaseOffset() { return uint(gl_InstanceID) * ' + this.pickIdsPerInstance + 'u; }\n');
            builder.addFragmentCode('\nvoid emitAnnotation(vec4 color) {\n  emit(color, vPickID);\n}\n');
        }
    }, {
        key: 'enable',
        value: function enable(shader, context, callback) {
            shader.bind();
            var gl = this.gl;
            var renderContext = context.renderContext;
            var annotationLayer = context.annotationLayer;

            gl.uniformMatrix4fv(shader.uniform('uProjection'), false, context.projectionMatrix);
            if (renderContext.emitPickID) {
                gl.uniform1ui(shader.uniform('uPickID'), context.basePickId);
            }
            if (renderContext.emitColor) {
                var colorVec4 = tempPickID;
                var color = annotationLayer.state.color.value;
                colorVec4[0] = color[0];
                colorVec4[1] = color[1];
                colorVec4[2] = color[2];
                colorVec4[3] = 1;
                gl.uniform4fv(shader.uniform('uColor'), colorVec4);
                var saturationAmount = 0.75;
                for (var i = 0; i < 3; ++i) {
                    colorVec4[i] = saturationAmount + (1 - saturationAmount) * colorVec4[i];
                }
                gl.uniform4fv(shader.uniform('uColorSelected'), colorVec4);
                gl.uniform1ui(shader.uniform('uSelectedIndex'), context.selectedIndex);
            }
            callback();
        }
    }]);

    return AnnotationRenderHelper;
}(RefCounted);
var annotationTypeRenderHandlers = new _Map();
export function registerAnnotationTypeRenderHandler(type, handler) {
    annotationTypeRenderHandlers.set(type, handler);
}
export function getAnnotationTypeRenderHandler(type) {
    return annotationTypeRenderHandlers.get(type);
}
//# sourceMappingURL=type_handler.js.map