import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
// Import to register the shared object types.
import '../shared_disjoint_sets';
import '../uint64_set';
import '../uint64_map';
import { withChunkManager } from '../chunk_manager/backend';
import { withSharedVisibility } from '../visibility_priority/backend';
import { SharedObjectCounterpart } from '../worker_rpc';
var Base = withSharedVisibility(withChunkManager(SharedObjectCounterpart));
export var SegmentationLayerSharedObjectCounterpart = function (_Base) {
    _inherits(SegmentationLayerSharedObjectCounterpart, _Base);

    function SegmentationLayerSharedObjectCounterpart(rpc, options) {
        _classCallCheck(this, SegmentationLayerSharedObjectCounterpart);

        // No need to increase the reference count of visibleSegments or
        // segmentEquivalences since our owner will hold a reference to their owners.
        var _this = _possibleConstructorReturn(this, (SegmentationLayerSharedObjectCounterpart.__proto__ || _Object$getPrototypeOf(SegmentationLayerSharedObjectCounterpart)).call(this, rpc, options));

        _this.visibleSegments = rpc.get(options['visibleSegments']);
        _this.segmentEquivalences = rpc.get(options['segmentEquivalences']);
        _this.objectToDataTransform = rpc.get(options['objectToDataTransform']);
        _this.renderScaleTarget = rpc.get(options['renderScaleTarget']);
        var scheduleUpdateChunkPriorities = function scheduleUpdateChunkPriorities() {
            _this.chunkManager.scheduleUpdateChunkPriorities();
        };
        _this.registerDisposer(_this.visibleSegments.changed.add(scheduleUpdateChunkPriorities));
        _this.registerDisposer(_this.segmentEquivalences.changed.add(scheduleUpdateChunkPriorities));
        _this.registerDisposer(_this.objectToDataTransform.changed.add(scheduleUpdateChunkPriorities));
        _this.registerDisposer(_this.renderScaleTarget.changed.add(scheduleUpdateChunkPriorities));
        return _this;
    }

    return SegmentationLayerSharedObjectCounterpart;
}(Base);
//# sourceMappingURL=backend.js.map