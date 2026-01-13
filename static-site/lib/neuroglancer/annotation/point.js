import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
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
/**
 * @file Support for rendering point annotations.
 */
import { AnnotationType } from './index';
import { AnnotationRenderHelper, registerAnnotationTypeRenderHandler } from './type_handler';
import { vec3 } from '../util/geom';
import { CircleShader } from '../webgl/circles';
import { emitterDependentShaderGetter } from '../webgl/shader';
import { numPointAnnotationElements, PointAnnotationSerilizer } from '../_zhaot/utils';
import { setDisplayCode } from '../_zhaot/utils';

var RenderHelper = function (_AnnotationRenderHelp) {
    _inherits(RenderHelper, _AnnotationRenderHelp);

    function RenderHelper() {
        _classCallCheck(this, RenderHelper);

        var _this = _possibleConstructorReturn(this, (RenderHelper.__proto__ || _Object$getPrototypeOf(RenderHelper)).apply(this, arguments));

        _this.circleShader = _this.registerDisposer(new CircleShader(_this.gl));
        _this.shaderGetter = emitterDependentShaderGetter(_this, _this.gl, function (builder) {
            return _this.defineShader(builder);
        });
        return _this;
    }

    _createClass(RenderHelper, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(RenderHelper.prototype.__proto__ || _Object$getPrototypeOf(RenderHelper.prototype), 'defineShader', this).call(this, builder);
            this.circleShader.defineShader(builder, /*crossSectionFade=*/this.targetIsSliceView);
            // Position of point in camera coordinates.
            builder.addAttribute('highp vec4', 'aVertexPosition');
            builder.setVertexMain('\nemitCircle(uProjection * vec4(aVertexPosition.xyz, 1.0));\n' + this.setPartIndex(builder) + ';\n' + setDisplayCode(builder, 'int(round(aVertexPosition.w))') + ';\n');
            builder.setFragmentMain('\nvec4 borderColor = vec4(0.0, 0.0, 0.0, 1.0);\nemitAnnotation(getCircleColor(vColor, borderColor));\n');
        }
    }, {
        key: 'draw',
        value: function draw(context) {
            var _this2 = this;

            var shader = this.shaderGetter(context.renderContext.emitter);
            this.enable(shader, context, function () {
                var gl = _this2.gl;

                var aVertexPosition = shader.attribute('aVertexPosition');
                context.buffer.bindToVertexAttrib(aVertexPosition, /*components=*/numPointAnnotationElements, /*attributeType=*/WebGL2RenderingContext.FLOAT,
                /*normalized=*/false,
                /*stride=*/0, /*offset=*/context.bufferOffset);
                gl.vertexAttribDivisor(aVertexPosition, 1);
                _this2.circleShader.draw(shader, context.renderContext, { interiorRadiusInPixels: 6, borderWidthInPixels: 2, featherWidthInPixels: 1 }, context.count);
                gl.vertexAttribDivisor(aVertexPosition, 0);
                gl.disableVertexAttribArray(aVertexPosition);
            });
        }
    }]);

    return RenderHelper;
}(AnnotationRenderHelper);

registerAnnotationTypeRenderHandler(AnnotationType.POINT, {
    bytes: numPointAnnotationElements * 4,
    serializer: PointAnnotationSerilizer,
    sliceViewRenderHelper: RenderHelper,
    perspectiveViewRenderHelper: RenderHelper,
    pickIdsPerInstance: 1,
    snapPosition: function snapPosition(position, objectToData, data, offset) {
        vec3.transformMat4(position, new Float32Array(data, offset, 3), objectToData);
    },
    getRepresentativePoint: function getRepresentativePoint(objectToData, ann) {
        var repPoint = vec3.create();
        vec3.transformMat4(repPoint, ann.point, objectToData);
        return repPoint;
    },
    updateViaRepresentativePoint: function updateViaRepresentativePoint(oldAnnotation, position, dataToObject) {
        var annotation = _Object$assign({}, oldAnnotation);
        annotation.point = vec3.transformMat4(vec3.create(), position, dataToObject);
        // annotation.id = '';
        return annotation;
    }
});
//# sourceMappingURL=point.js.map