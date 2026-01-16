import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
import { CoordinateTransform } from '../coordinate_transform';
import { RenderLayer as GenericRenderLayer } from '../layer';
import { trackableRenderScaleTarget } from '../render_scale_statistics';
import { SharedWatchableValue } from '../shared_watchable_value';
import { getTransformedSources, SLICEVIEW_RENDERLAYER_RPC_ID, SLICEVIEW_RENDERLAYER_UPDATE_TRANSFORM_RPC_ID } from './base';
import { vec3 } from '../util/geom';
import { SharedObject } from '../worker_rpc';
export var RenderLayer = function (_GenericRenderLayer) {
    _inherits(RenderLayer, _GenericRenderLayer);

    function RenderLayer(chunkManager, sources, options) {
        _classCallCheck(this, RenderLayer);

        var _this = _possibleConstructorReturn(this, (RenderLayer.__proto__ || _Object$getPrototypeOf(RenderLayer)).call(this));

        _this.chunkManager = chunkManager;
        _this.sources = sources;
        _this.rpcId = null;
        _this.transformedSourcesGeneration = -1;
        var _options$transform = options.transform,
            transform = _options$transform === undefined ? new CoordinateTransform() : _options$transform,
            _options$renderScaleT = options.renderScaleTarget,
            renderScaleTarget = _options$renderScaleT === undefined ? trackableRenderScaleTarget(1) : _options$renderScaleT;

        _this.renderScaleTarget = renderScaleTarget;
        _this.renderScaleHistogram = options.renderScaleHistogram;
        _this.transform = transform;
        var transformedSources = getTransformedSources(_this);
        {
            var _transformedSources$ = transformedSources[0][0],
                source = _transformedSources$.source,
                chunkLayout = _transformedSources$.chunkLayout;
            var spec = source.spec;

            var voxelSize = _this.voxelSize = chunkLayout.localSpatialVectorToGlobal(vec3.create(), spec.voxelSize);
            for (var i = 0; i < 3; ++i) {
                voxelSize[i] = Math.abs(voxelSize[i]);
            }
        }
        var sharedObject = _this.registerDisposer(new SharedObject());
        var rpc = _this.chunkManager.rpc;
        sharedObject.RPC_TYPE_ID = SLICEVIEW_RENDERLAYER_RPC_ID;
        var sourceIds = sources.map(function (alternatives) {
            return alternatives.map(function (source) {
                return source.rpcId;
            });
        });
        sharedObject.initializeCounterpart(rpc, {
            sources: sourceIds,
            transform: transform.transform,
            renderScaleTarget: _this.registerDisposer(SharedWatchableValue.makeFromExisting(rpc, _this.renderScaleTarget)).rpcId
        });
        _this.rpcId = sharedObject.rpcId;
        _this.registerDisposer(transform.changed.add(function () {
            rpc.invoke(SLICEVIEW_RENDERLAYER_UPDATE_TRANSFORM_RPC_ID, { id: _this.rpcId, value: transform.transform });
        }));
        _this.setReady(true);
        return _this;
    }

    _createClass(RenderLayer, [{
        key: 'setGLBlendMode',
        value: function setGLBlendMode(gl, renderLayerNum) {
            // Default blend mode for non-blend-mode-aware layers
            if (renderLayerNum > 0) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            }
        }
    }, {
        key: 'gl',
        get: function get() {
            return this.chunkManager.chunkQueueManager.gl;
        }
    }]);

    return RenderLayer;
}(GenericRenderLayer);
//# sourceMappingURL=renderlayer.js.map