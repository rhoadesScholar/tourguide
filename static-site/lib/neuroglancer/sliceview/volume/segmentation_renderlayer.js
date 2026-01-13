import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
import { HashMapUint64 } from '../../gpu_hash/hash_table';
import { GPUHashTable, HashMapShaderManager, HashSetShaderManager } from '../../gpu_hash/shader';
import { SegmentColorShaderManager, SegmentStatedColorShaderManager } from '../../segment_color';
import { registerRedrawWhenSegmentationDisplayStateChanged } from '../../segmentation_display_state/frontend';
import { RenderLayer } from './renderlayer';
export var EquivalencesHashMap = function () {
    function EquivalencesHashMap(disjointSets) {
        _classCallCheck(this, EquivalencesHashMap);

        this.disjointSets = disjointSets;
        this.generation = Number.NaN;
        this.hashMap = new HashMapUint64();
    }

    _createClass(EquivalencesHashMap, [{
        key: 'update',
        value: function update() {
            var disjointSets = this.disjointSets;
            var generation = disjointSets.generation;

            if (this.generation !== generation) {
                this.generation = generation;
                var hashMap = this.hashMap;

                hashMap.clear();
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(disjointSets.mappings()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _ref = _step.value;

                        var _ref2 = _slicedToArray(_ref, 2);

                        var objectId = _ref2[0];
                        var minObjectId = _ref2[1];

                        hashMap.set(objectId, minObjectId);
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
            }
        }
    }]);

    return EquivalencesHashMap;
}();
export var SegmentationRenderLayer = function (_RenderLayer) {
    _inherits(SegmentationRenderLayer, _RenderLayer);

    function SegmentationRenderLayer(multiscaleSource, displayState) {
        _classCallCheck(this, SegmentationRenderLayer);

        var _this = _possibleConstructorReturn(this, (SegmentationRenderLayer.__proto__ || _Object$getPrototypeOf(SegmentationRenderLayer)).call(this, multiscaleSource, {
            sourceOptions: displayState.volumeSourceOptions,
            transform: displayState.transform,
            renderScaleHistogram: displayState.renderScaleHistogram,
            renderScaleTarget: displayState.renderScaleTarget
        }));

        _this.displayState = displayState;
        _this.segmentColorShaderManager = new SegmentColorShaderManager('segmentColorHash');
        _this.segmentStatedColorShaderManager = new SegmentStatedColorShaderManager('segmentStatedColor');
        _this.gpuSegmentStatedColorHashTable = GPUHashTable.get(_this.gl, _this.displayState.segmentStatedColors.hashTable);
        _this.hashTableManager = new HashSetShaderManager('visibleSegments');
        _this.gpuHashTable = GPUHashTable.get(_this.gl, _this.displayState.visibleSegments.hashTable);
        _this.hashTableManagerHighlighted = new HashSetShaderManager('highlightedSegments');
        _this.gpuHashTableHighlighted = GPUHashTable.get(_this.gl, _this.displayState.highlightedSegments.hashTable);
        _this.equivalencesShaderManager = new HashMapShaderManager('equivalences');
        _this.equivalencesHashMap = new EquivalencesHashMap(_this.displayState.segmentEquivalences.disjointSets);
        _this.gpuEquivalencesHashTable = GPUHashTable.get(_this.gl, _this.equivalencesHashMap.hashMap);
        registerRedrawWhenSegmentationDisplayStateChanged(displayState, _this);
        _this.registerDisposer(displayState.selectedAlpha.changed.add(function () {
            _this.redrawNeeded.dispatch();
        }));
        _this.registerDisposer(displayState.hideSegmentZero.changed.add(function () {
            _this.redrawNeeded.dispatch();
            _this.shaderGetter.invalidateShader();
        }));
        _this.hasEquivalences = _this.displayState.segmentEquivalences.size !== 0;
        displayState.segmentEquivalences.changed.add(function () {
            var segmentEquivalences = _this.displayState.segmentEquivalences;

            var hasEquivalences = segmentEquivalences.size !== 0;
            if (hasEquivalences !== _this.hasEquivalences) {
                _this.hasEquivalences = hasEquivalences;
                _this.shaderGetter.invalidateShader();
                // No need to trigger redraw, since that will happen anyway.
            }
        });
        _this.registerDisposer(displayState.notSelectedAlpha.changed.add(function () {
            _this.redrawNeeded.dispatch();
        }));
        _this.hasSegmentStatedColors = _this.displayState.segmentStatedColors.size !== 0;
        displayState.segmentStatedColors.changed.add(function () {
            var segmentStatedColors = _this.displayState.segmentStatedColors;

            var hasSegmentStatedColors = segmentStatedColors.size !== 0;
            if (hasSegmentStatedColors !== _this.hasSegmentStatedColors) {
                _this.hasSegmentStatedColors = hasSegmentStatedColors;
                _this.shaderGetter.invalidateShader();
                // No need to trigger redraw, since that will happen anyway.
            }
        });
        return _this;
    }

    _createClass(SegmentationRenderLayer, [{
        key: 'getShaderKey',
        value: function getShaderKey() {
            // The shader to use depends on whether there are any equivalences, and any color mappings,
            // and on whether we are hiding segment ID 0.
            return 'sliceview.SegmentationRenderLayer/' + this.hasEquivalences + '/' + (this.hasSegmentStatedColors + '/') + this.displayState.hideSegmentZero.value;
        }
    }, {
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(SegmentationRenderLayer.prototype.__proto__ || _Object$getPrototypeOf(SegmentationRenderLayer.prototype), 'defineShader', this).call(this, builder);
            this.hashTableManager.defineShader(builder);
            this.hashTableManagerHighlighted.defineShader(builder);
            builder.addFragmentCode('\nuint64_t getUint64DataValue() {\n  return toUint64(getDataValue());\n}\n');
            if (this.hasEquivalences) {
                this.equivalencesShaderManager.defineShader(builder);
                builder.addFragmentCode('\nuint64_t getMappedObjectId() {\n  uint64_t value = getUint64DataValue();\n  uint64_t mappedValue;\n  if (' + this.equivalencesShaderManager.getFunctionName + '(value, mappedValue)) {\n    return mappedValue;\n  }\n  return value;\n}\n');
            } else {
                builder.addFragmentCode('\nuint64_t getMappedObjectId() {\n  return getUint64DataValue();\n}\n');
            }
            this.segmentColorShaderManager.defineShader(builder);
            if (this.hasSegmentStatedColors) {
                this.segmentStatedColorShaderManager.defineShader(builder);
            }
            builder.addUniform('highp uvec2', 'uSelectedSegment');
            builder.addUniform('highp uint', 'uShowAllSegments');
            builder.addUniform('highp float', 'uSelectedAlpha');
            builder.addUniform('highp float', 'uNotSelectedAlpha');
            builder.addUniform('highp float', 'uSaturation');
            var fragmentMain = '\n  uint64_t value = getMappedObjectId();\n\n  float alpha = uSelectedAlpha;\n  float saturation = uSaturation;\n';
            if (this.displayState.hideSegmentZero.value) {
                fragmentMain += '\n  if (value.value[0] == 0u && value.value[1] == 0u) {\n    emit(vec4(vec4(0, 0, 0, 0)));\n    return;\n  }\n';
            }
            fragmentMain += '\n  bool has = uShowAllSegments != 0u ? true : ' + this.hashTableManager.hasFunctionName + '(value);\n  if (uSelectedSegment == value.value) {\n    saturation = has ? 0.5 : 0.75;\n  } else if (!has) {\n    alpha = uNotSelectedAlpha;\n  }\n';
            // If the value has a mapped color, use it; otherwise, compute the color.
            if (this.hasSegmentStatedColors) {
                fragmentMain += '\n  vec3 rgb;\n  if (!' + this.segmentStatedColorShaderManager.getFunctionName + '(value, rgb)) {\n    rgb = segmentColorHash(value);\n  }\n';
            } else {
                fragmentMain += '\n  vec3 rgb = segmentColorHash(value);\n';
            }
            // Override color for all highlighted segments.
            fragmentMain += '\n  if (' + this.hashTableManagerHighlighted.hasFunctionName + '(value)) {\n    rgb = vec3(0.2,0.2,2.0);\n    saturation = 1.0;\n  };\n';
            fragmentMain += '\n  emit(vec4(mix(vec3(1.0,1.0,1.0), rgb, saturation), alpha));\n';
            builder.setFragmentMain(fragmentMain);
        }
    }, {
        key: 'beginSlice',
        value: function beginSlice(sliceView) {
            var shader = _get(SegmentationRenderLayer.prototype.__proto__ || _Object$getPrototypeOf(SegmentationRenderLayer.prototype), 'beginSlice', this).call(this, sliceView);
            if (shader === undefined) {
                return undefined;
            }
            var gl = this.gl;
            var displayState = this.displayState;
            var _displayState = this.displayState,
                segmentSelectionState = _displayState.segmentSelectionState,
                visibleSegments = _displayState.visibleSegments;

            var selectedSegmentLow = 0,
                selectedSegmentHigh = 0;
            if (segmentSelectionState.hasSelectedSegment) {
                var seg = segmentSelectionState.selectedSegment;
                selectedSegmentLow = seg.low;
                selectedSegmentHigh = seg.high;
            }
            gl.uniform1f(shader.uniform('uSelectedAlpha'), this.displayState.selectedAlpha.value);
            gl.uniform1f(shader.uniform('uSaturation'), this.displayState.saturation.value);
            gl.uniform1f(shader.uniform('uNotSelectedAlpha'), this.displayState.notSelectedAlpha.value);
            gl.uniform2ui(shader.uniform('uSelectedSegment'), selectedSegmentLow, selectedSegmentHigh);
            gl.uniform1ui(shader.uniform('uShowAllSegments'), visibleSegments.hashTable.size ? 0 : 1);
            this.hashTableManager.enable(gl, shader, this.gpuHashTable);
            this.hashTableManagerHighlighted.enable(gl, shader, this.gpuHashTableHighlighted);
            if (this.hasEquivalences) {
                this.equivalencesHashMap.update();
                this.equivalencesShaderManager.enable(gl, shader, this.gpuEquivalencesHashTable);
            }
            this.segmentColorShaderManager.enable(gl, shader, displayState.segmentColorHash);
            if (this.hasSegmentStatedColors) {
                this.segmentStatedColorShaderManager.enable(gl, shader, this.gpuSegmentStatedColorHashTable);
            }
            return shader;
        }
    }, {
        key: 'endSlice',
        value: function endSlice(shader) {
            var gl = this.gl;

            this.hashTableManager.disable(gl, shader);
            this.hashTableManagerHighlighted.disable(gl, shader);
            _get(SegmentationRenderLayer.prototype.__proto__ || _Object$getPrototypeOf(SegmentationRenderLayer.prototype), 'endSlice', this).call(this, shader);
        }
    }]);

    return SegmentationRenderLayer;
}(RenderLayer);
//# sourceMappingURL=segmentation_renderlayer.js.map