import _Math$log from 'babel-runtime/core-js/math/log2';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _getIterator from 'babel-runtime/core-js/get-iterator';
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
import { ChunkLayout } from './chunk_layout';
import { partitionArray } from '../util/array';
import { approxEqual } from '../util/compare';
import { DATA_TYPE_BYTES, DataType } from '../util/data_type';
import { effectiveScalingFactorFromMat4, identityMat4, kAxes, kInfinityVec, kZeroVec, mat4, rectifyTransformMatrixIfAxisAligned, transformVectorByMat4, vec3 } from '../util/geom';
import { SharedObject } from '../worker_rpc';
export { DATA_TYPE_BYTES, DataType };
var DEBUG_CHUNK_INTERSECTIONS = false;
var DEBUG_VISIBLE_SOURCES = false;
var tempVec3 = vec3.create();
/**
 * Average cross-sectional area contained within a chunk of the specified size and rotation.
 *
 * This is estimated by taking the total volume of the chunk and dividing it by the total length of
 * the chunk along the z axis.
 */
function estimateSliceAreaPerChunk(zAxis, chunkLayout) {
    var chunkSize = chunkLayout.size;
    var zAxisRotated = chunkLayout.globalToLocalSpatialVector(tempVec3, zAxis);
    // Minimum and maximum dot product of zAxisRotated with each of the corners of the chunk.  Both
    // are initialized to 0 because the origin of the chunk has a projection of 0.
    var minProjection = 0,
        maxProjection = 0;
    var chunkVolume = 1;
    for (var i = 0; i < 3; ++i) {
        var chunkSizeValue = chunkSize[i];
        chunkVolume *= chunkSizeValue;
        var projection = chunkSizeValue * zAxisRotated[i];
        minProjection = Math.min(minProjection, projection);
        maxProjection = Math.max(maxProjection, projection);
    }
    var projectionLength = maxProjection - minProjection;
    return chunkVolume / projectionLength;
}
/**
 * All valid chunks are in the range [lowerBound, upperBound).
 *
 * @param lowerBound Output parameter for lowerBound.
 * @param upperBound Output parameter for upperBound.
 * @param sources Sources for which to compute the chunk bounds.
 */
function computeSourcesChunkBounds(sourcesLowerBound, sourcesUpperBound, sources) {
    for (var i = 0; i < 3; ++i) {
        sourcesLowerBound[i] = Number.POSITIVE_INFINITY;
        sourcesUpperBound[i] = Number.NEGATIVE_INFINITY;
    }
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(sources), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var source = _step.value;
            var spec = source.spec;
            var lowerChunkBound = spec.lowerChunkBound,
                upperChunkBound = spec.upperChunkBound;

            for (var _i = 0; _i < 3; ++_i) {
                sourcesLowerBound[_i] = Math.min(sourcesLowerBound[_i], lowerChunkBound[_i]);
                sourcesUpperBound[_i] = Math.max(sourcesUpperBound[_i], upperChunkBound[_i]);
            }
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
var BoundsComparisonResult;
(function (BoundsComparisonResult) {
    // Needle is fully outside haystack.
    BoundsComparisonResult[BoundsComparisonResult["FULLY_OUTSIDE"] = 0] = "FULLY_OUTSIDE";
    // Needle is fully inside haystack.
    BoundsComparisonResult[BoundsComparisonResult["FULLY_INSIDE"] = 1] = "FULLY_INSIDE";
    // Needle is partially inside haystack.
    BoundsComparisonResult[BoundsComparisonResult["PARTIALLY_INSIDE"] = 2] = "PARTIALLY_INSIDE";
})(BoundsComparisonResult || (BoundsComparisonResult = {}));
function compareBoundsSingleDimension(needleLower, needleUpper, haystackLower, haystackUpper) {
    if (needleLower >= haystackUpper || needleUpper <= haystackLower) {
        return BoundsComparisonResult.FULLY_OUTSIDE;
    }
    if (needleLower >= haystackLower && needleUpper <= haystackUpper) {
        return BoundsComparisonResult.FULLY_INSIDE;
    }
    return BoundsComparisonResult.PARTIALLY_INSIDE;
}
function compareBounds(needleLowerBound, needleUpperBound, haystackLowerBound, haystackUpperBound) {
    var curResult = BoundsComparisonResult.FULLY_INSIDE;
    for (var i = 0; i < 3; ++i) {
        var newResult = compareBoundsSingleDimension(needleLowerBound[i], needleUpperBound[i], haystackLowerBound[i], haystackUpperBound[i]);
        switch (newResult) {
            case BoundsComparisonResult.FULLY_OUTSIDE:
                return newResult;
            case BoundsComparisonResult.PARTIALLY_INSIDE:
                curResult = newResult;
                break;
        }
    }
    return curResult;
}
export function getTransformedSources(renderLayer) {
    var transform = renderLayer.transform;
    var transformedSources = renderLayer.transformedSources;

    var generation = transform.changed.count;
    if (generation !== renderLayer.transformedSourcesGeneration) {
        renderLayer.transformedSourcesGeneration = generation;
        if (mat4.equals(transform.transform, identityMat4)) {
            transformedSources = renderLayer.sources.map(function (alternatives) {
                return alternatives.map(function (source) {
                    return {
                        source: source,
                        chunkLayout: source.spec.chunkLayout,
                        voxelSize: source.spec.voxelSize
                    };
                });
            });
        } else {
            transformedSources = renderLayer.sources.map(function (alternatives) {
                return alternatives.map(function (source) {
                    var chunkLayout = source.spec.chunkLayout;
                    var transformedChunkLayout = ChunkLayout.get(chunkLayout.size, getCombinedTransform(chunkLayout.transform, transform));
                    return {
                        chunkLayout: transformedChunkLayout,
                        source: source,
                        voxelSize: transformedChunkLayout.localSpatialVectorToGlobal(vec3.create(), source.spec.voxelSize)
                    };
                });
            });
        }
        renderLayer.transformedSources = transformedSources;
    }
    return transformedSources;
}
function pickBestAlternativeSource(zAxis, alternatives) {
    var numAlternatives = alternatives.length;
    var bestAlternativeIndex = 0;
    if (DEBUG_VISIBLE_SOURCES) {
        console.log(alternatives);
    }
    if (numAlternatives > 1) {
        var bestSliceArea = 0;
        for (var alternativeIndex = 0; alternativeIndex < numAlternatives; ++alternativeIndex) {
            var alternative = alternatives[alternativeIndex];
            var chunkLayout = alternative.chunkLayout;

            var sliceArea = estimateSliceAreaPerChunk(zAxis, chunkLayout);
            if (DEBUG_VISIBLE_SOURCES) {
                console.log('zAxis = ' + zAxis + ', chunksize = ' + chunkLayout.size + ', sliceArea = ' + sliceArea);
            }
            if (sliceArea > bestSliceArea) {
                bestSliceArea = sliceArea;
                bestAlternativeIndex = alternativeIndex;
            }
        }
    }
    return alternatives[bestAlternativeIndex];
}
var tempCorners = [vec3.create(), vec3.create(), vec3.create(), vec3.create()];
export var SliceViewBase = function (_SharedObject) {
    _inherits(SliceViewBase, _SharedObject);

    function SliceViewBase() {
        _classCallCheck(this, SliceViewBase);

        var _this = _possibleConstructorReturn(this, (SliceViewBase.__proto__ || _Object$getPrototypeOf(SliceViewBase)).call(this));

        _this.width = -1;
        _this.height = -1;
        _this.hasViewportToData = false;
        /**
         * Specifies whether width, height, and viewportToData are valid.
         */
        _this.hasValidViewport = false;
        // Transforms (x,y) viewport coordinates in the range:
        //
        // x=[left: -width/2, right: width/2] and
        //
        // y=[top: -height/2, bottom: height/2],
        //
        // to data coordinates.
        _this.viewportToData = mat4.create();
        // Normalized x, y, and z viewport axes in data coordinate space.
        _this.viewportAxes = [vec3.create(), vec3.create(), vec3.create()];
        // Viewport axes used for selecting visible sources.
        _this.previousViewportAxes = [vec3.create(), vec3.create()];
        _this.centerDataPosition = vec3.create();
        _this.viewportPlaneDistanceToOrigin = 0;
        /**
         * For each visible ChunkLayout, maps each visible GenericVolumeChunkSource to its priority index.
         * Overall chunk priority ordering is based on a lexicographical ordering of (priorityIndex,
         * -distanceToCenter).
         */
        _this.visibleChunkLayouts = new _Map();
        _this.visibleLayers = new _Map();
        _this.visibleSourcesStale = true;
        /**
         * Size in spatial units (nm) of a single pixel.
         */
        _this.pixelSize = 0;
        mat4.identity(_this.viewportToData);
        return _this;
    }
    /**
     * Called when hasValidViewport == true and the viewport width/height or data transform matrix
     * changes.
     */


    _createClass(SliceViewBase, [{
        key: 'onViewportChanged',
        value: function onViewportChanged() {}
    }, {
        key: 'maybeSetHasValidViewport',
        value: function maybeSetHasValidViewport() {
            if (!this.hasValidViewport && this.width !== -1 && this.height !== -1 && this.hasViewportToData) {
                this.hasValidViewport = true;
                this.onHasValidViewport();
            }
            if (this.hasValidViewport) {
                this.onViewportChanged();
            }
        }
    }, {
        key: 'onHasValidViewport',
        value: function onHasValidViewport() {}
    }, {
        key: 'setViewportSize',
        value: function setViewportSize(width, height) {
            if (width !== this.width || height !== this.height) {
                this.width = width;
                this.height = height;
                this.maybeSetHasValidViewport();
                return true;
            }
            return false;
        }
    }, {
        key: 'setViewportToDataMatrix',
        value: function setViewportToDataMatrix(mat) {
            if (this.hasViewportToData && mat4.equals(this.viewportToData, mat)) {
                return false;
            }
            this.hasViewportToData = true;
            var viewportToData = this.viewportToData;

            mat4.copy(viewportToData, mat);
            rectifyTransformMatrixIfAxisAligned(viewportToData);
            vec3.transformMat4(this.centerDataPosition, kZeroVec, mat);
            // Initialize to zero to avoid confusing TypeScript compiler.
            var newPixelSize = 0;
            // Swap previousViewportAxes with viewportAxes.
            var viewportAxes = this.viewportAxes;
            var previousViewportAxes = this.previousViewportAxes;
            // Compute axes.
            for (var i = 0; i < 3; ++i) {
                var a = viewportAxes[i];
                transformVectorByMat4(a, kAxes[i], viewportToData);
                // a[3] is guaranteed to be 0.
                if (i === 0) {
                    newPixelSize = vec3.length(a);
                }
                vec3.normalize(a, a);
            }
            this.viewportAxes = viewportAxes;
            this.previousViewportAxes = previousViewportAxes;
            if (!approxEqual(newPixelSize, this.pixelSize) || vec3.dot(viewportAxes[0], previousViewportAxes[0]) < 0.95 || vec3.dot(viewportAxes[1], previousViewportAxes[1]) < 0.95) {
                vec3.copy(previousViewportAxes[0], viewportAxes[0]);
                vec3.copy(previousViewportAxes[1], viewportAxes[1]);
                this.visibleSourcesStale = true;
                this.pixelSize = newPixelSize;
            }
            // Compute viewport plane distance to origin.
            this.viewportPlaneDistanceToOrigin = vec3.dot(this.centerDataPosition, this.viewportAxes[2]);
            this.onViewportToDataMatrixChanged();
            this.maybeSetHasValidViewport();
            return true;
        }
    }, {
        key: 'onViewportToDataMatrixChanged',
        value: function onViewportToDataMatrixChanged() {}
        /**
         * Computes the list of sources to use for each visible layer, based on the
         * current pixelSize.
         */

    }, {
        key: 'updateVisibleSources',
        value: function updateVisibleSources() {
            if (!this.visibleSourcesStale) {
                return;
            }
            this.visibleSourcesStale = false;
            // Increase pixel size by a small margin.
            var pixelSize = this.pixelSize * 1.1;
            // console.log("pixelSize", pixelSize);
            var visibleChunkLayouts = this.visibleChunkLayouts;
            var zAxis = this.viewportAxes[2];
            var visibleLayers = this.visibleLayers;
            visibleChunkLayouts.clear();

            var _loop = function _loop(renderLayer, visibleSources) {
                visibleSources.length = 0;
                var transformedSources = getTransformedSources(renderLayer);
                var numSources = transformedSources.length;
                var scaleIndex = void 0;
                // At the smallest scale, all alternative sources must have the same voxel size, which is
                // considered to be the base voxel size.
                var smallestVoxelSize = transformedSources[0][0].voxelSize;
                var renderScaleTarget = renderLayer.renderScaleTarget.value;
                /**
                 * Determines whether we should continue to look for a finer-resolution source *after* one
                 * with the specified voxelSize.
                 */
                var canImproveOnVoxelSize = function canImproveOnVoxelSize(voxelSize) {
                    var targetSize = pixelSize * renderScaleTarget;
                    for (var i = 0; i < 3; ++i) {
                        var size = voxelSize[i];
                        // If size <= pixelSize, no need for improvement.
                        // If size === smallestVoxelSize, also no need for improvement.
                        if (size > targetSize && size > 1.01 * smallestVoxelSize[i]) {
                            return true;
                        }
                    }
                    return false;
                };
                var improvesOnPrevVoxelSize = function improvesOnPrevVoxelSize(voxelSize, prevVoxelSize) {
                    var targetSize = pixelSize * renderScaleTarget;
                    for (var i = 0; i < 3; ++i) {
                        var size = voxelSize[i];
                        var prevSize = prevVoxelSize[i];
                        if (Math.abs(targetSize - size) < Math.abs(targetSize - prevSize) && size < 1.01 * prevSize) {
                            return true;
                        }
                    }
                    return false;
                };
                /**
                 * Registers a source as being visible.  This should be called with consecutively decreasing
                 * values of scaleIndex.
                 */
                var addVisibleSource = function addVisibleSource(transformedSource, sourceScaleIndex) {
                    // Add to end of visibleSources list.  We will reverse the list after all sources are
                    // added.
                    var source = transformedSource.source,
                        chunkLayout = transformedSource.chunkLayout;

                    visibleSources[visibleSources.length++] = transformedSource;
                    var existingSources = visibleChunkLayouts.get(chunkLayout);
                    if (existingSources === undefined) {
                        existingSources = new _Map();
                        visibleChunkLayouts.set(chunkLayout, existingSources);
                    }
                    existingSources.set(source, sourceScaleIndex);
                };
                scaleIndex = numSources - 1;
                var prevVoxelSize = void 0;
                while (true) {
                    var transformedSource = pickBestAlternativeSource(zAxis, transformedSources[scaleIndex]);
                    if (prevVoxelSize !== undefined && !improvesOnPrevVoxelSize(transformedSource.voxelSize, prevVoxelSize)) {
                        break;
                    }
                    addVisibleSource(transformedSource, scaleIndex);
                    if (scaleIndex === 0 || !canImproveOnVoxelSize(transformedSource.voxelSize)) {
                        break;
                    }
                    prevVoxelSize = transformedSource.voxelSize;
                    --scaleIndex;
                }
                // Reverse visibleSources list since we added sources from coarsest to finest resolution, but
                // we want them ordered from finest to coarsest.
                visibleSources.reverse();
            };

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(visibleLayers), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _ref = _step2.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var renderLayer = _ref2[0];
                    var visibleSources = _ref2[1];

                    _loop(renderLayer, visibleSources);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    }, {
        key: 'computeVisibleChunks',
        value: function computeVisibleChunks(getLayoutObject, addChunk) {
            var _this2 = this;

            this.updateVisibleSources();
            // Lower and upper bound in global data coordinates.
            var globalCorners = tempCorners;
            var width = this.width,
                height = this.height,
                viewportToData = this.viewportToData;

            for (var i = 0; i < 3; ++i) {
                globalCorners[0][i] = -kAxes[0][i] * width / 2 - kAxes[1][i] * height / 2;
                globalCorners[1][i] = -kAxes[0][i] * width / 2 + kAxes[1][i] * height / 2;
                globalCorners[2][i] = kAxes[0][i] * width / 2 - kAxes[1][i] * height / 2;
                globalCorners[3][i] = kAxes[0][i] * width / 2 + kAxes[1][i] * height / 2;
            }
            for (var _i2 = 0; _i2 < 4; ++_i2) {
                vec3.transformMat4(globalCorners[_i2], globalCorners[_i2], viewportToData);
            }
            // console.log("data bounds", dataLowerBound, dataUpperBound);
            // These variables hold the lower and upper bounds on chunk grid positions that intersect the
            // viewing plane.
            var lowerChunkBound = vec3.create();
            var upperChunkBound = vec3.create();
            var sourcesLowerChunkBound = vec3.create();
            var sourcesUpperChunkBound = vec3.create();
            // Vertex with maximal dot product with the positive viewport plane normal.
            // Implicitly, negativeVertex = 1 - positiveVertex.
            var positiveVertex = vec3.create();
            var planeNormal = vec3.create();
            // Sources whose bounds partially contain the current bounding box.
            var partiallyVisibleSources = new Array();
            // Sources whose bounds fully contain the current bounding box.
            var fullyVisibleSources = new Array();
            this.visibleChunkLayouts.forEach(function (visibleSources, chunkLayout) {
                var layoutObject = getLayoutObject(chunkLayout);
                computeSourcesChunkBounds(sourcesLowerChunkBound, sourcesUpperChunkBound, visibleSources.keys());
                if (DEBUG_CHUNK_INTERSECTIONS) {
                    console.log('Initial sources chunk bounds: ' + (vec3.str(sourcesLowerChunkBound) + ', ' + vec3.str(sourcesUpperChunkBound)));
                }
                vec3.set(lowerChunkBound, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
                vec3.set(upperChunkBound, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
                chunkLayout.globalToLocalSpatialVector(planeNormal, _this2.viewportAxes[2]);
                for (var _i3 = 0; _i3 < 3; ++_i3) {
                    positiveVertex[_i3] = planeNormal[_i3] > 0 ? 1 : 0;
                }
                // Center position in chunk grid coordinates.
                var planeDistanceToOrigin = vec3.dot(chunkLayout.globalToLocalGrid(tempVec3, _this2.centerDataPosition), planeNormal);
                for (var _i4 = 0; _i4 < 4; ++_i4) {
                    var localCorner = chunkLayout.globalToLocalGrid(tempVec3, globalCorners[_i4]);
                    for (var j = 0; j < 3; ++j) {
                        lowerChunkBound[j] = Math.min(lowerChunkBound[j], Math.floor(localCorner[j]));
                        upperChunkBound[j] = Math.max(upperChunkBound[j], Math.floor(localCorner[j]) + 1);
                    }
                }
                vec3.max(lowerChunkBound, lowerChunkBound, sourcesLowerChunkBound);
                vec3.min(upperChunkBound, upperChunkBound, sourcesUpperChunkBound);
                // console.log('chunkBounds', lowerBound, upperBound);
                // Checks whether [lowerBound, upperBound) intersects the viewport plane.
                //
                // positiveVertexDistanceToOrigin = dot(planeNormal, lowerBound +
                // positiveVertex * (upperBound - lowerBound)) - planeDistanceToOrigin;
                // negativeVertexDistanceToOrigin = dot(planeNormal, lowerBound +
                // negativeVertex * (upperBound - lowerBound)) - planeDistanceToOrigin;
                //
                // positive vertex must have positive distance, and negative vertex must
                // have negative distance.
                function intersectsPlane() {
                    var positiveVertexDistanceToOrigin = 0;
                    var negativeVertexDistanceToOrigin = 0;
                    // Check positive vertex.
                    for (var _i5 = 0; _i5 < 3; ++_i5) {
                        var normalValue = planeNormal[_i5];
                        var lowerValue = lowerChunkBound[_i5];
                        var upperValue = upperChunkBound[_i5];
                        var diff = upperValue - lowerValue;
                        var positiveOffset = positiveVertex[_i5] * diff;
                        // console.log(
                        //     normalValue, lowerValue, upperValue, diff, positiveOffset,
                        //     positiveVertexDistanceToOrigin, negativeVertexDistanceToOrigin);
                        positiveVertexDistanceToOrigin += normalValue * (lowerValue + positiveOffset);
                        negativeVertexDistanceToOrigin += normalValue * (lowerValue + diff - positiveOffset);
                    }
                    if (DEBUG_CHUNK_INTERSECTIONS) {
                        console.log('    planeNormal = ' + planeNormal);
                        console.log('    {positive,negative}VertexDistanceToOrigin: ', positiveVertexDistanceToOrigin, negativeVertexDistanceToOrigin, planeDistanceToOrigin);
                        console.log('    intersectsPlane:', negativeVertexDistanceToOrigin, planeDistanceToOrigin, positiveVertexDistanceToOrigin);
                    }
                    if (positiveVertexDistanceToOrigin < planeDistanceToOrigin) {
                        return false;
                    }
                    return negativeVertexDistanceToOrigin <= planeDistanceToOrigin;
                }
                fullyVisibleSources.length = 0;
                partiallyVisibleSources.length = 0;
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = _getIterator(visibleSources.keys()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var source = _step3.value;

                        var spec = source.spec;
                        var result = compareBounds(lowerChunkBound, upperChunkBound, spec.lowerChunkBound, spec.upperChunkBound);
                        if (DEBUG_CHUNK_INTERSECTIONS) {
                            console.log('Comparing source bounds lowerBound=' + vec3.str(lowerChunkBound) + ', ' + ('upperBound=' + vec3.str(upperChunkBound) + ', ') + ('lowerChunkBound=' + vec3.str(spec.lowerChunkBound) + ', ') + ('upperChunkBound=' + vec3.str(spec.upperChunkBound) + ', ') + ('got ' + BoundsComparisonResult[result]), spec, source);
                        }
                        switch (result) {
                            case BoundsComparisonResult.FULLY_INSIDE:
                                fullyVisibleSources.push(source);
                                break;
                            case BoundsComparisonResult.PARTIALLY_INSIDE:
                                partiallyVisibleSources.push(source);
                                break;
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                var partiallyVisibleSourcesLength = partiallyVisibleSources.length;
                // Mutates lowerBound and upperBound while running, but leaves them the
                // same once finished.
                function checkBounds(nextSplitDim) {
                    if (DEBUG_CHUNK_INTERSECTIONS) {
                        console.log('chunk bounds: ' + lowerChunkBound + ' ' + upperChunkBound + ' ' + ('fullyVisible: ' + fullyVisibleSources + ' partiallyVisible: ') + ('' + partiallyVisibleSources.slice(0, partiallyVisibleSourcesLength)));
                    }
                    if (fullyVisibleSources.length === 0 && partiallyVisibleSourcesLength === 0) {
                        if (DEBUG_CHUNK_INTERSECTIONS) {
                            console.log('  no visible sources');
                        }
                        return;
                    }
                    if (DEBUG_CHUNK_INTERSECTIONS) {
                        console.log('Check bounds: [ ' + vec3.str(lowerChunkBound) + ', ' + vec3.str(upperChunkBound) + ' ]');
                    }
                    var volume = 1;
                    for (var _i6 = 0; _i6 < 3; ++_i6) {
                        volume *= Math.max(0, upperChunkBound[_i6] - lowerChunkBound[_i6]);
                    }
                    if (volume === 0) {
                        if (DEBUG_CHUNK_INTERSECTIONS) {
                            console.log('  volume == 0');
                        }
                        return;
                    }
                    if (!intersectsPlane()) {
                        if (DEBUG_CHUNK_INTERSECTIONS) {
                            console.log('  doesn\'t intersect plane');
                        }
                        return;
                    }
                    if (DEBUG_CHUNK_INTERSECTIONS) {
                        console.log('Within bounds: [' + vec3.str(lowerChunkBound) + ', ' + vec3.str(upperChunkBound) + ']');
                    }
                    if (volume === 1) {
                        addChunk(chunkLayout, layoutObject, lowerChunkBound, fullyVisibleSources);
                        return;
                    }
                    var dimLower, dimUpper, diff;
                    while (true) {
                        dimLower = lowerChunkBound[nextSplitDim];
                        dimUpper = upperChunkBound[nextSplitDim];
                        diff = dimUpper - dimLower;
                        if (diff === 1) {
                            nextSplitDim = (nextSplitDim + 1) % 3;
                        } else {
                            break;
                        }
                    }
                    var splitPoint = dimLower + Math.floor(0.5 * diff);
                    var newNextSplitDim = (nextSplitDim + 1) % 3;
                    var fullyVisibleSourcesLength = fullyVisibleSources.length;
                    upperChunkBound[nextSplitDim] = splitPoint;
                    var oldPartiallyVisibleSourcesLength = partiallyVisibleSourcesLength;
                    function adjustSources() {
                        partiallyVisibleSourcesLength = partitionArray(partiallyVisibleSources, 0, oldPartiallyVisibleSourcesLength, function (source) {
                            var spec = source.spec;
                            var result = compareBounds(lowerChunkBound, upperChunkBound, spec.lowerChunkBound, spec.upperChunkBound);
                            switch (result) {
                                case BoundsComparisonResult.PARTIALLY_INSIDE:
                                    return true;
                                case BoundsComparisonResult.FULLY_INSIDE:
                                    fullyVisibleSources.push(source);
                                default:
                                    return false;
                            }
                        });
                    }
                    adjustSources();
                    checkBounds(newNextSplitDim);
                    // Truncate list of fully visible sources.
                    fullyVisibleSources.length = fullyVisibleSourcesLength;
                    // Restore partiallyVisibleSources.
                    partiallyVisibleSourcesLength = oldPartiallyVisibleSourcesLength;
                    upperChunkBound[nextSplitDim] = dimUpper;
                    lowerChunkBound[nextSplitDim] = splitPoint;
                    adjustSources();
                    checkBounds(newNextSplitDim);
                    lowerChunkBound[nextSplitDim] = dimLower;
                    // Truncate list of fully visible sources.
                    fullyVisibleSources.length = fullyVisibleSourcesLength;
                    // Restore partiallyVisibleSources.
                    partiallyVisibleSourcesLength = oldPartiallyVisibleSourcesLength;
                }
                checkBounds(0);
            });
        }
    }]);

    return SliceViewBase;
}(SharedObject);
/**
 * By default, choose a chunk size with at most 2^18 = 262144 voxels.
 */
export var DEFAULT_MAX_VOXELS_PER_CHUNK_LOG2 = 18;
/**
 * Determines a near-isotropic (in global spatial coordinates) block size.  All dimensions will be
 * powers of 2, and will not exceed upperVoxelBound - lowerVoxelBound.  The total number of voxels
 * will not exceed maxVoxelsPerChunkLog2.
 */
export function getNearIsotropicBlockSize(options) {
    var voxelSize = options.voxelSize,
        _options$lowerVoxelBo = options.lowerVoxelBound,
        lowerVoxelBound = _options$lowerVoxelBo === undefined ? kZeroVec : _options$lowerVoxelBo,
        upperVoxelBound = options.upperVoxelBound,
        _options$maxVoxelsPer = options.maxVoxelsPerChunkLog2,
        maxVoxelsPerChunkLog2 = _options$maxVoxelsPer === undefined ? DEFAULT_MAX_VOXELS_PER_CHUNK_LOG2 : _options$maxVoxelsPer,
        _options$transform = options.transform,
        transform = _options$transform === undefined ? identityMat4 : _options$transform,
        _options$maxBlockSize = options.maxBlockSize,
        maxBlockSize = _options$maxBlockSize === undefined ? kInfinityVec : _options$maxBlockSize;
    // Adjust voxelSize by effective scaling factor.

    var temp = effectiveScalingFactorFromMat4(vec3.create(), transform);
    voxelSize = vec3.multiply(temp, temp, voxelSize);
    var chunkDataSize = vec3.fromValues(1, 1, 1);
    var maxChunkDataSize = void 0;
    if (upperVoxelBound === undefined) {
        maxChunkDataSize = maxBlockSize;
    } else {
        maxChunkDataSize = vec3.create();
        for (var i = 0; i < 3; ++i) {
            maxChunkDataSize[i] = Math.pow(2, Math.floor(_Math$log(upperVoxelBound[i] - lowerVoxelBound[i])));
        }
        vec3.min(maxChunkDataSize, maxChunkDataSize, maxBlockSize);
    }
    // Determine the dimension in which chunkDataSize should be increased.  This is the smallest
    // dimension (in nanometers) that is < maxChunkDataSize (in voxels).
    //
    // Returns -1 if there is no such dimension.
    function findNextDimension() {
        var minSize = Infinity;
        var minDimension = -1;
        for (var _i7 = 0; _i7 < 3; ++_i7) {
            if (chunkDataSize[_i7] >= maxChunkDataSize[_i7]) {
                continue;
            }
            var size = chunkDataSize[_i7] * voxelSize[_i7];
            if (size < minSize) {
                minSize = size;
                minDimension = _i7;
            }
        }
        return minDimension;
    }
    for (var _i8 = 0; _i8 < maxVoxelsPerChunkLog2; ++_i8) {
        var nextDim = findNextDimension();
        if (nextDim === -1) {
            break;
        }
        chunkDataSize[nextDim] *= 2;
    }
    return chunkDataSize;
}
/**
 * Computes a 3-d block size that has depth 1 in flatDimension and is near-isotropic (in nanometers)
 * in the other two dimensions.  The remaining options are the same as for
 * getNearIsotropicBlockSize.
 */
export function getTwoDimensionalBlockSize(options) {
    var _options$lowerVoxelBo2 = options.lowerVoxelBound,
        lowerVoxelBound = _options$lowerVoxelBo2 === undefined ? kZeroVec : _options$lowerVoxelBo2,
        _options$upperVoxelBo = options.upperVoxelBound,
        upperVoxelBound = _options$upperVoxelBo === undefined ? kInfinityVec : _options$upperVoxelBo,
        flatDimension = options.flatDimension,
        voxelSize = options.voxelSize,
        maxVoxelsPerChunkLog2 = options.maxVoxelsPerChunkLog2,
        transform = options.transform;

    vec3.subtract(tempVec3, upperVoxelBound, lowerVoxelBound);
    tempVec3[flatDimension] = 1;
    return getNearIsotropicBlockSize({ voxelSize: voxelSize, upperVoxelBound: tempVec3, maxVoxelsPerChunkLog2: maxVoxelsPerChunkLog2, transform: transform });
}
/**
 * Returns an array of [xy, xz, yz] 2-dimensional block sizes.
 */
export function getTwoDimensionalBlockSizes(options) {
    var chunkDataSizes = new Array();
    for (var i = 0; i < 3; ++i) {
        chunkDataSizes[i] = getTwoDimensionalBlockSize({
            flatDimension: i,
            voxelSize: options.voxelSize,
            lowerVoxelBound: options.lowerVoxelBound,
            upperVoxelBound: options.upperVoxelBound,
            maxVoxelsPerChunkLog2: options.maxVoxelsPerChunkLog2,
            transform: options.transform
        });
    }
    return chunkDataSizes;
}
export var ChunkLayoutPreference;
(function (ChunkLayoutPreference) {
    /**
     * Indicates that isotropic chunks are desired.
     */
    ChunkLayoutPreference[ChunkLayoutPreference["ISOTROPIC"] = 0] = "ISOTROPIC";
    /**
     * Indicates that 2-D chunks are desired.
     */
    ChunkLayoutPreference[ChunkLayoutPreference["FLAT"] = 1] = "FLAT";
})(ChunkLayoutPreference || (ChunkLayoutPreference = {}));
export function getCombinedTransform(transform, options) {
    var additionalTransform = options.transform;
    if (additionalTransform === undefined) {
        if (transform === undefined) {
            return identityMat4;
        }
        return transform;
    }
    if (transform === undefined) {
        return additionalTransform;
    }
    return mat4.multiply(mat4.create(), additionalTransform, transform);
}
export function getChunkDataSizes(options) {
    if (options.chunkDataSizes !== undefined) {
        return options.chunkDataSizes;
    }
    var _options$chunkLayoutP = options.chunkLayoutPreference,
        chunkLayoutPreference = _options$chunkLayoutP === undefined ? ChunkLayoutPreference.ISOTROPIC : _options$chunkLayoutP;

    switch (chunkLayoutPreference) {
        case ChunkLayoutPreference.ISOTROPIC:
            return [getNearIsotropicBlockSize(options)];
        case ChunkLayoutPreference.FLAT:
            var chunkDataSizes = getTwoDimensionalBlockSizes(options);
            chunkDataSizes.push(getNearIsotropicBlockSize(options));
            return chunkDataSizes;
    }
    throw new Error('Invalid chunk layout preference: ' + chunkLayoutPreference + '.');
}
/**
 * Generic specification for SliceView chunks specifying a layout and voxel size.
 */
export var SliceViewChunkSpecification = function () {
    function SliceViewChunkSpecification(options) {
        _classCallCheck(this, SliceViewChunkSpecification);

        var chunkSize = options.chunkSize,
            voxelSize = options.voxelSize,
            transform = options.transform,
            _options$lowerChunkBo = options.lowerChunkBound,
            lowerChunkBound = _options$lowerChunkBo === undefined ? kZeroVec : _options$lowerChunkBo,
            upperChunkBound = options.upperChunkBound;

        this.voxelSize = voxelSize;
        this.chunkLayout = ChunkLayout.get(chunkSize, transform);
        this.lowerChunkBound = lowerChunkBound;
        this.upperChunkBound = upperChunkBound;
    }

    _createClass(SliceViewChunkSpecification, [{
        key: 'toObject',
        value: function toObject() {
            return {
                transform: this.chunkLayout.transform,
                chunkSize: this.chunkLayout.size,
                voxelSize: this.voxelSize,
                lowerChunkBound: this.lowerChunkBound,
                upperChunkBound: this.upperChunkBound
            };
        }
    }]);

    return SliceViewChunkSpecification;
}();
export var SLICEVIEW_RPC_ID = 'SliceView';
export var SLICEVIEW_RENDERLAYER_RPC_ID = 'sliceview/RenderLayer';
export var SLICEVIEW_ADD_VISIBLE_LAYER_RPC_ID = 'SliceView.addVisibleLayer';
export var SLICEVIEW_REMOVE_VISIBLE_LAYER_RPC_ID = 'SliceView.removeVisibleLayer';
export var SLICEVIEW_UPDATE_VIEW_RPC_ID = 'SliceView.updateView';
export var SLICEVIEW_RENDERLAYER_UPDATE_TRANSFORM_RPC_ID = 'SliceView.updateTransform';
//# sourceMappingURL=base.js.map