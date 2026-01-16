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
import { getDesiredMultiscaleMeshChunks, getMultiscaleChunksToDraw } from './multiscale';
import { getFrustrumPlanes, mat4, vec3 } from '../util/geom';
function getDesiredChunkList(manifest, modelViewProjection, detailCutoff, viewportWidth, viewportHeight) {
    var results = [];
    getDesiredMultiscaleMeshChunks(manifest, modelViewProjection, getFrustrumPlanes(new Float32Array(24), modelViewProjection), detailCutoff, viewportWidth, viewportHeight, function (lod, row, renderScale, empty) {
        results.push({ lod: lod, row: row, renderScale: renderScale, empty: empty });
    });
    return results;
}
function getDrawChunkList(manifest, modelViewProjection, detailCutoff, viewportWidth, viewportHeight, hasChunk) {
    var results = [];
    getMultiscaleChunksToDraw(manifest, modelViewProjection, getFrustrumPlanes(new Float32Array(24), modelViewProjection), detailCutoff, viewportWidth, viewportHeight, function (_lod, row, _renderScale) {
        return hasChunk(row);
    }, function (lod, row, subChunkBegin, subChunkEnd, renderScale) {
        results.push({ lod: lod, row: row, subChunkBegin: subChunkBegin, subChunkEnd: subChunkEnd, renderScale: renderScale });
    });
    return results;
}
describe('multiscale', function () {
    it('getDesiredMultiscaleMeshChunks simple', function () {
        var manifest = {
            chunkShape: vec3.fromValues(10, 20, 30),
            chunkGridSpatialOrigin: vec3.fromValues(5, 6, -50),
            clipLowerBound: vec3.fromValues(20, 23, -50),
            clipUpperBound: vec3.fromValues(40, 45, -20),
            lodScales: Float32Array.of(20, 40),
            vertexOffsets: new Float32Array(2 * 3),
            octree: Uint32Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
        };
        var viewportWidth = 640;
        var viewportHeight = 480;
        var modelViewProjection = mat4.perspective(mat4.create(), Math.PI / 2, viewportWidth / viewportHeight, 5, 100);
        expect(getDesiredChunkList(manifest, modelViewProjection, /*detailCutoff=*/1000, viewportWidth, viewportHeight)).toEqual([{
            lod: 1,
            renderScale: 960,
            row: 1,
            empty: 0
        }]);
        expect(getDesiredChunkList(manifest, modelViewProjection, /*detailCutoff=*/800, viewportWidth, viewportHeight)).toEqual([{
            lod: 1,
            renderScale: 960,
            row: 1,
            empty: 0
        }, {
            lod: 0,
            renderScale: 480,
            row: 0,
            empty: 0
        }]);
    });
    it('getDesiredMultiscaleMeshChunks multiple chunks 2 lods', function () {
        var manifest = {
            chunkShape: vec3.fromValues(10, 20, 30),
            chunkGridSpatialOrigin: vec3.fromValues(5, 6, -50),
            clipLowerBound: vec3.fromValues(5, 6, -50),
            clipUpperBound: vec3.fromValues(100, 200, 10),
            lodScales: Float32Array.of(20, 40),
            vertexOffsets: new Float32Array(2 * 3),
            octree: Uint32Array.from([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 8])
        };
        var viewportWidth = 640;
        var viewportHeight = 480;
        var modelViewProjection = mat4.perspective(mat4.create(), Math.PI / 2, viewportWidth / viewportHeight, 5, 100);
        expect(getDesiredChunkList(manifest, modelViewProjection, /*detailCutoff=*/4000, viewportWidth, viewportHeight)).toEqual([{
            lod: 1,
            renderScale: 3840,
            row: 8,
            empty: 0
        }]);
        expect(getDesiredChunkList(manifest, modelViewProjection, /*detailCutoff=*/1000, viewportWidth, viewportHeight)).toEqual([{
            lod: 1,
            renderScale: 3840,
            row: 8,
            empty: 0
        }, {
            lod: 0,
            renderScale: 1920,
            row: 4,
            empty: 0
        }, {
            lod: 0,
            renderScale: 1920,
            row: 5,
            empty: 0
        }]);
        expect(getDesiredChunkList(manifest, modelViewProjection, /*detailCutoff=*/800, viewportWidth, viewportHeight)).toEqual([{
            lod: 1,
            renderScale: 3840,
            row: 8,
            empty: 0
        }, {
            lod: 0,
            renderScale: 480,
            row: 0,
            empty: 0
        }, {
            lod: 0,
            renderScale: 480,
            row: 1,
            empty: 0
        }, {
            lod: 0,
            renderScale: 480,
            empty: 0,
            row: 2
        }, {
            lod: 0,
            renderScale: 480,
            empty: 0,
            row: 3
        }, {
            lod: 0,
            renderScale: 1920,
            empty: 0,
            row: 4
        }, {
            lod: 0,
            renderScale: 1920,
            empty: 0,
            row: 5
        }]);
    });
    it('getMultiscaleChunksToDraw multiple chunks 2 lods', function () {
        var manifest = {
            chunkShape: vec3.fromValues(10, 20, 30),
            chunkGridSpatialOrigin: vec3.fromValues(5, 6, -50),
            clipLowerBound: vec3.fromValues(5, 6, -50),
            clipUpperBound: vec3.fromValues(100, 200, 10),
            lodScales: Float32Array.of(20, 40),
            vertexOffsets: new Float32Array(2 * 3),
            octree: Uint32Array.from([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 8])
        };
        var viewportWidth = 640;
        var viewportHeight = 480;
        var modelViewProjection = mat4.perspective(mat4.create(), Math.PI / 2, viewportWidth / viewportHeight, 5, 100);
        expect(getDrawChunkList(manifest, modelViewProjection, /*detailCutoff=*/4000, viewportWidth, viewportHeight, function () {
            return true;
        })).toEqual([{
            lod: 1,
            renderScale: 3840,
            row: 8,
            subChunkBegin: 0,
            subChunkEnd: 8
        }]);
        expect(getDrawChunkList(manifest, modelViewProjection, /*detailCutoff=*/1000, viewportWidth, viewportHeight, function (row) {
            return row !== 4;
        })).toEqual([{
            lod: 1,
            renderScale: 3840,
            row: 8,
            subChunkBegin: 0,
            subChunkEnd: 5
        }, {
            lod: 0,
            renderScale: 1920,
            row: 5,
            subChunkBegin: 0,
            subChunkEnd: 1
        }, {
            lod: 1,
            renderScale: 3840,
            row: 8,
            subChunkBegin: 6,
            subChunkEnd: 8
        }]);
    });
    it('getMultiscaleChunksToDraw multiple chunks 2 lods with missing', function () {
        var manifest = {
            chunkShape: vec3.fromValues(10, 20, 30),
            chunkGridSpatialOrigin: vec3.fromValues(5, 6, -50),
            clipLowerBound: vec3.fromValues(5, 6, -50),
            clipUpperBound: vec3.fromValues(100, 200, 10),
            lodScales: Float32Array.of(20, 40),
            vertexOffsets: new Float32Array(2 * 3),
            octree: Uint32Array.from([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 8])
        };
        var viewportWidth = 640;
        var viewportHeight = 480;
        var modelViewProjection = mat4.perspective(mat4.create(), Math.PI / 2, viewportWidth / viewportHeight, 5, 100);
        expect(getDrawChunkList(manifest, modelViewProjection, /*detailCutoff=*/1000, viewportWidth, viewportHeight, function (row) {
            return row !== 8;
        })).toEqual([]);
    });
    it('getMultiscaleChunksToDraw multiple chunks 2 lods with empty', function () {
        var manifest = {
            chunkShape: vec3.fromValues(10, 20, 30),
            chunkGridSpatialOrigin: vec3.fromValues(5, 6, -50),
            clipLowerBound: vec3.fromValues(5, 6, -50),
            clipUpperBound: vec3.fromValues(100, 200, 10),
            lodScales: Float32Array.of(20, 40),
            vertexOffsets: new Float32Array(2 * 3),
            octree: Uint32Array.from([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0x80000008])
        };
        var viewportWidth = 640;
        var viewportHeight = 480;
        var modelViewProjection = mat4.perspective(mat4.create(), Math.PI / 2, viewportWidth / viewportHeight, 5, 100);
        expect(getDrawChunkList(manifest, modelViewProjection, /*detailCutoff=*/1000, viewportWidth, viewportHeight, function () {
            return true;
        })).toEqual([{
            lod: 0,
            renderScale: 1920,
            row: 4,
            subChunkBegin: 0,
            subChunkEnd: 1
        }, {
            lod: 0,
            renderScale: 1920,
            row: 5,
            subChunkBegin: 0,
            subChunkEnd: 1
        }]);
        expect(getDrawChunkList(manifest, modelViewProjection, /*detailCutoff=*/1000, viewportWidth, viewportHeight, function (row) {
            return row !== 4;
        })).toEqual([{
            lod: 0,
            renderScale: 1920,
            row: 5,
            subChunkBegin: 0,
            subChunkEnd: 1
        }]);
    });
    it('getDesiredMultiscaleMeshChunks multiple chunks 2 lods with empty', function () {
        var manifest = {
            chunkShape: vec3.fromValues(10, 20, 30),
            chunkGridSpatialOrigin: vec3.fromValues(5, 6, -50),
            clipLowerBound: vec3.fromValues(5, 6, -50),
            clipUpperBound: vec3.fromValues(100, 200, 10),
            lodScales: Float32Array.of(20, 40),
            vertexOffsets: new Float32Array(2 * 3),
            octree: Uint32Array.from([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0x80000000, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 8])
        };
        var viewportWidth = 640;
        var viewportHeight = 480;
        var modelViewProjection = mat4.perspective(mat4.create(), Math.PI / 2, viewportWidth / viewportHeight, 5, 100);
        expect(getDesiredChunkList(manifest, modelViewProjection, /*detailCutoff=*/1000, viewportWidth, viewportHeight)).toEqual([{
            lod: 1,
            renderScale: 3840,
            row: 8,
            empty: 0
        }, {
            lod: 0,
            renderScale: 1920,
            row: 4,
            empty: 1
        }, {
            lod: 0,
            renderScale: 1920,
            row: 5,
            empty: 0
        }]);
    });
    it('getDesiredMultiscaleMeshChunks multiple chunks 4 lods', function () {
        var manifest = {
            chunkShape: vec3.fromValues(10, 20, 30),
            chunkGridSpatialOrigin: vec3.fromValues(5, 6, -50),
            clipLowerBound: vec3.fromValues(5, 6, -50),
            clipUpperBound: vec3.fromValues(100, 200, 10),
            lodScales: Float32Array.of(20, 40, 80, 160, 0),
            vertexOffsets: new Float32Array(5 * 3),
            octree: Uint32Array.from([5, 3, 0, 0, 0, 7, 0, 3, 0, 0, 7, 1, 3, 0, 0, 7, 3, 2, 0, 0, 1, 7, 0, 0, 0, 2, 7, 0, 0, 0, 5, 4, 0, 0, 0, 6, 4, 0, 0, 0, 6, 4, 1, 0, 0, 6, 5, 1, 0, 0, 7, 5, 1, 0, 0, 4, 7, 1, 0, 0, 5, 7, 1, 0, 0, 6, 6, 1, 0, 0, 7, 6, 1, 0, 0, 6, 7, 1, 0, 0, 7, 7, 1, 0, 0, 7, 4, 2, 0, 0, 7, 5, 2, 0, 0, 6, 7, 2, 0, 0, 7, 7, 2, 0, 0, 7, 7, 3, 0, 0, 7, 6, 4, 0, 0, 7, 7, 4, 0, 0, 10, 3, 0, 0, 0, 11, 3, 0, 0, 0, 8, 1, 2, 0, 0, 9, 1, 2, 0, 0, 8, 0, 3, 0, 0, 9, 0, 3, 0, 0, 8, 1, 3, 0, 0, 9, 1, 3, 0, 0, 10, 0, 2, 0, 0, 2, 1, 0, 0, 1, 3, 0, 1, 1, 3, 3, 1, 1, 3, 4, 0, 3, 0, 4, 5, 1, 3, 0, 5, 6, 2, 2, 0, 6, 7, 3, 2, 0, 7, 11, 2, 3, 0, 11, 13, 3, 3, 0, 13, 17, 3, 2, 1, 17, 19, 3, 3, 1, 19, 22, 3, 3, 2, 22, 24, 5, 1, 0, 24, 26, 4, 0, 1, 26, 32, 5, 0, 1, 32, 33, 1, 0, 0, 33, 36, 0, 1, 0, 36, 38, 1, 1, 0, 38, 44, 1, 1, 1, 44, 45, 2, 0, 0, 45, 48, 0, 0, 0, 48, 52, 1, 0, 0, 52, 53, 0, 0, 0, 53, 55])
        };
        var viewportWidth = 640;
        var viewportHeight = 480;
        var modelViewProjection = mat4.perspective(mat4.create(), Math.PI / 2, viewportWidth / viewportHeight, 5, 100);
        expect(getDesiredChunkList(manifest, modelViewProjection, /*detailCutoff=*/100000, viewportWidth, viewportHeight)).toEqual([{
            lod: 3,
            renderScale: 15360,
            row: 53,
            empty: 0
        }]);
    });
});
//# sourceMappingURL=multiscale.spec.js.map