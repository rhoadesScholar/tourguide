import _Set from 'babel-runtime/core-js/set';
/**
 * @license
 * Copyright 2019 Google Inc.
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
import { isAABBVisible } from '../util/geom';
import { getOctreeChildIndex } from '../util/zorder';
/**
 * @param detailCutoff Factor by which the spatial resolution of the mesh may be worse than the
 *     spatial resolution of a single viewport pixel.  For example, a value of 10 means that if a
 *     given portion of the object will be rendered such that a pixel corresponds to 50 nm, then a
 *     mesh level of detail down to 500 nm will be requested for that portion of the object.
 */
export function getDesiredMultiscaleMeshChunks(manifest, modelViewProjection, clippingPlanes, detailCutoff, viewportWidth, viewportHeight, callback) {
    var octree = manifest.octree,
        lodScales = manifest.lodScales,
        chunkGridSpatialOrigin = manifest.chunkGridSpatialOrigin,
        chunkShape = manifest.chunkShape;

    var maxLod = lodScales.length - 1;
    var m00 = modelViewProjection[0],
        m01 = modelViewProjection[4],
        m02 = modelViewProjection[8],
        m10 = modelViewProjection[1],
        m11 = modelViewProjection[5],
        m12 = modelViewProjection[9],
        m30 = modelViewProjection[3],
        m31 = modelViewProjection[7],
        m32 = modelViewProjection[11],
        m33 = modelViewProjection[15];
    var minWXcoeff = m30 > 0 ? 0 : 1;
    var minWYcoeff = m31 > 0 ? 0 : 1;
    var minWZcoeff = m32 > 0 ? 0 : 1;
    var nearA = clippingPlanes[4 * 4],
        nearB = clippingPlanes[4 * 4 + 1],
        nearC = clippingPlanes[4 * 4 + 2],
        nearD = clippingPlanes[4 * 4 + 3];
    function getPointW(x, y, z) {
        return m30 * x + m31 * y + m32 * z + m33;
    }
    function getBoxW(xLower, yLower, zLower, xUpper, yUpper, zUpper) {
        return getPointW(xLower + minWXcoeff * (xUpper - xLower), yLower + minWYcoeff * (yUpper - yLower), zLower + minWZcoeff * (zUpper - zLower));
    }
    /**
     * Minimum value of w within clipping frustrum (under the assumption that the minimum value is
     * occurs occurs on the near clipping plane).
     */
    var minWClip = getPointW(-nearD * nearA, -nearD * nearB, -nearD * nearC);
    var objectXLower = manifest.clipLowerBound[0],
        objectYLower = manifest.clipLowerBound[1],
        objectZLower = manifest.clipLowerBound[2];
    var objectXUpper = manifest.clipUpperBound[0],
        objectYUpper = manifest.clipUpperBound[1],
        objectZUpper = manifest.clipUpperBound[2];
    var xScale = Math.sqrt(Math.pow(m00 * viewportWidth, 2) + Math.pow(m10 * viewportHeight, 2));
    var yScale = Math.sqrt(Math.pow(m01 * viewportWidth, 2) + Math.pow(m11 * viewportHeight, 2));
    var zScale = Math.sqrt(Math.pow(m02 * viewportWidth, 2) + Math.pow(m12 * viewportHeight, 2));
    var scaleFactor = Math.max(xScale, yScale, zScale);
    function handleChunk(lod, row, priorLodScale) {
        var size = 1 << lod;
        var rowOffset = row * 5;
        var gridX = octree[rowOffset],
            gridY = octree[rowOffset + 1],
            gridZ = octree[rowOffset + 2],
            childBegin = octree[rowOffset + 3],
            childEndAndEmpty = octree[rowOffset + 4];
        var xLower = gridX * size * chunkShape[0] + chunkGridSpatialOrigin[0],
            yLower = gridY * size * chunkShape[1] + chunkGridSpatialOrigin[1],
            zLower = gridZ * size * chunkShape[2] + chunkGridSpatialOrigin[2];
        var xUpper = xLower + size * chunkShape[0],
            yUpper = yLower + size * chunkShape[1],
            zUpper = zLower + size * chunkShape[2];
        xLower = Math.max(xLower, objectXLower);
        yLower = Math.max(yLower, objectYLower);
        zLower = Math.max(zLower, objectZLower);
        xUpper = Math.min(xUpper, objectXUpper);
        yUpper = Math.min(yUpper, objectYUpper);
        zUpper = Math.min(zUpper, objectZUpper);
        if (isAABBVisible(xLower, yLower, zLower, xUpper, yUpper, zUpper, clippingPlanes)) {
            var minW = Math.max(minWClip, getBoxW(xLower, yLower, zLower, xUpper, yUpper, zUpper));
            var pixelSize = minW / scaleFactor;
            if (priorLodScale === 0 || pixelSize * detailCutoff < priorLodScale) {
                var lodScale = lodScales[lod];
                if (lodScale !== 0) {
                    callback(lod, row, lodScale / pixelSize, childEndAndEmpty >>> 31);
                }
                if (lod > 0 && (lodScale === 0 || pixelSize * detailCutoff < lodScale)) {
                    var nextPriorLodScale = lodScale === 0 ? priorLodScale : lodScale;
                    var childEnd = (childEndAndEmpty & 0x7FFFFFFF) >>> 0;
                    for (var childRow = childBegin; childRow < childEnd; ++childRow) {
                        handleChunk(lod - 1, childRow, nextPriorLodScale);
                    }
                }
            }
        }
    }
    handleChunk(maxLod, octree.length / 5 - 1, 0);
}
export function getMultiscaleChunksToDraw(manifest, modelViewProjection, clippingPlanes, detailCutoff, viewportWidth, viewportHeight, hasChunk, callback) {
    var lodScales = manifest.lodScales;

    var maxLod = 0;
    while (maxLod + 1 < lodScales.length && lodScales[maxLod + 1] !== 0) {
        ++maxLod;
    }
    var stackEntryStride = 3;
    // [row, parentSubChunkIndex, renderScale]
    var stack = [];
    var stackDepth = 0;
    var priorSubChunkIndex = 0;
    function emitChunksUpTo(targetStackIndex, subChunkIndex) {
        while (true) {
            if (stackDepth === 0) return;
            // Finish last chunk of last (finest) lod.
            var stackIndex = stackDepth - 1;
            var entryLod = maxLod - stackIndex;
            var entryRow = stack[stackIndex * stackEntryStride];
            var numSubChunks = entryLod === 0 ? 1 : 8;
            var entrySubChunkIndex = stack[stackIndex * stackEntryStride + 1];
            var entryRenderScale = stack[stackIndex * stackEntryStride + 2];
            if (targetStackIndex === stackDepth) {
                var endSubChunk = subChunkIndex & numSubChunks - 1;
                if (priorSubChunkIndex !== endSubChunk && entryRow !== -1) {
                    callback(entryLod, entryRow, priorSubChunkIndex, endSubChunk, entryRenderScale);
                }
                priorSubChunkIndex = endSubChunk + 1;
                return;
            }
            if (priorSubChunkIndex !== numSubChunks && entryRow !== -1) {
                callback(entryLod, entryRow, priorSubChunkIndex, numSubChunks, entryRenderScale);
            }
            priorSubChunkIndex = entrySubChunkIndex + 1;
            --stackDepth;
        }
    }
    var priorMissingLod = 0;
    var octree = manifest.octree;

    getDesiredMultiscaleMeshChunks(manifest, modelViewProjection, clippingPlanes, detailCutoff, viewportWidth, viewportHeight, function (lod, row, renderScale, empty) {
        if (!empty && !hasChunk(lod, row, renderScale)) {
            priorMissingLod = Math.max(lod, priorMissingLod);
            return;
        }
        if (lod < priorMissingLod) return;
        priorMissingLod = 0;
        var rowOffset = row * 5;
        var x = octree[rowOffset],
            y = octree[rowOffset + 1],
            z = octree[rowOffset + 2];
        var subChunkIndex = getOctreeChildIndex(x, y, z);
        var stackIndex = maxLod - lod;
        emitChunksUpTo(stackIndex, subChunkIndex);
        var stackOffset = stackIndex * stackEntryStride;
        stack[stackOffset] = empty ? -1 : row;
        stack[stackOffset + 1] = subChunkIndex;
        stack[stackOffset + 2] = renderScale;
        priorSubChunkIndex = 0;
        stackDepth = stackIndex + 1;
    });
    emitChunksUpTo(0, 0);
}
export function validateOctree(octree) {
    if (octree.length % 5 !== 0) {
        throw new Error('Invalid length');
    }
    var numNodes = octree.length / 5;
    var seenNodes = new _Set();
    function exploreNode(node) {
        if (seenNodes.has(node)) {
            throw new Error('Previously seen node');
        }
        seenNodes.add(node);
        if (node < 0 || node >= numNodes) {
            throw new Error('Invalid node reference');
        }
        var x = octree[node * 5],
            y = octree[node * 5 + 1],
            z = octree[node * 5 + 2],
            beginChild = octree[node * 5 + 3],
            endChild = octree[node * 5 + 4];
        if (beginChild < 0 || endChild < 0 || endChild < beginChild || endChild > numNodes || beginChild + 8 < endChild) {
            throw new Error('Invalid child references');
        }
        for (var child = beginChild; child < endChild; ++child) {
            var childX = octree[child * 5],
                childY = octree[child * 5 + 1],
                childZ = octree[child * 5 + 2];
            if (childX >>> 1 !== x || childY >>> 1 !== y || childZ >>> 1 != z) {
                throw new Error('invalid child');
            }
            exploreNode(child);
        }
    }
    if (numNodes === 0) return;
    exploreNode(numNodes - 1);
}
export function getMultiscaleFragmentKey(objectKey, lod, chunkIndex) {
    return objectKey + '/' + lod + ':' + chunkIndex;
}
//# sourceMappingURL=multiscale.js.map