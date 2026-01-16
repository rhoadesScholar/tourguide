import _Array$from from 'babel-runtime/core-js/array/from';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
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
import { computeTriangleStrips, getBaseIndex, getEdgeIndex, getNextEdge, vertexAIndex, vertexBIndex, vertexCIndex } from './triangle_strips';
describe('triangle_strips', function () {
    describe('getBaseIndex', function () {
        it('works for simple examples', function () {
            expect([7 * 4 + 0, 7 * 4 + 1, 7 * 4 + 2].map(getBaseIndex)).toEqual([7 * 3, 7 * 3, 7 * 3]);
        });
    });
    describe('getEdgeIndex', function () {
        it('works for simple examples', function () {
            expect([7 * 4 + 0, 7 * 4 + 1, 7 * 4 + 2].map(getEdgeIndex)).toEqual([0, 1, 2]);
        });
    });
    describe('vertexAIndex', function () {
        it('works', function () {
            expect([0, 1, 2].map(vertexAIndex)).toEqual([0, 0, 1]);
        });
    });
    describe('vertexBIndex', function () {
        it('works', function () {
            expect([0, 1, 2].map(vertexBIndex)).toEqual([1, 2, 2]);
        });
    });
    describe('vertexCIndex', function () {
        it('works', function () {
            expect([0, 1, 2].map(vertexCIndex)).toEqual([2, 1, 0]);
        });
    });
    describe('getNextEdge', function () {
        it('works', function () {
            expect([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]].map(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                    edgeIndex = _ref2[0],
                    flipped = _ref2[1];

                return getNextEdge(edgeIndex + flipped * 4);
            })).toEqual([2 + 0 * 4, 2 + 1 * 4, 1 + 1 * 4, 1 + 0 * 4, 0 + 0 * 4, 0 + 1 * 4]);
        });
    });
});
function getTrianglesFromIndices(indices) {
    var x = [];
    for (var i = 0; i < indices.length; i += 3) {
        var a = indices[i],
            b = indices[i + 1],
            c = indices[i + 2];
        var t = void 0;
        if (a > b) {
            t = a;
            a = b;
            b = t;
        }
        if (b > c) {
            t = b;
            b = c;
            c = t;
        }
        if (a > b) {
            t = a;
            a = b;
            b = t;
        }
        x.push(a + ',' + b + ',' + c);
    }
    x.sort();
    return x;
}
function getTrianglesFromStrips(indices) {
    var x = [];
    var invalidVertex = indices.BYTES_PER_ELEMENT === 2 ? 0xFFFF : 0xFFFFFFFF;
    for (var i = 0; i + 2 < indices.length; ++i) {
        var a = indices[i],
            b = indices[i + 1],
            c = indices[i + 2];
        if (c === invalidVertex) {
            i += 2;
            continue;
        }
        var t = void 0;
        if (a > b) {
            t = a;
            a = b;
            b = t;
        }
        if (b > c) {
            t = b;
            b = c;
            c = t;
        }
        if (a > b) {
            t = a;
            a = b;
            b = t;
        }
        x.push(a + ',' + b + ',' + c);
    }
    x.sort();
    return x;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function makeRandomIndices(numTriangles, numVertices) {
    var indices = new Uint32Array(numTriangles * 3);
    for (var i = 0; i < numTriangles * 3; i += 3) {
        while (true) {
            var a = getRandomInt(0, numVertices),
                b = getRandomInt(0, numVertices),
                c = getRandomInt(0, numVertices);
            if (a === b || a === c || b === c) continue;
            indices[i] = a;
            indices[i + 1] = b;
            indices[i + 2] = c;
            break;
        }
    }
    return indices;
}
describe('triangle_strips', function () {
    it('works for simple example', function () {
        var indices = Uint32Array.from([0, 1, 2, 3, 2, 1, 5, 3, 4, 4, 2, 3]);
        var output = computeTriangleStrips(indices);
        expect(_Array$from(output)).toEqual([0, 1, 2, 3, 4, 5]);
    });
    it('works for two-strip example', function () {
        var indices = Uint32Array.from([0, 1, 2, 3, 2, 1, 6, 7, 8, 7, 8, 9, 6, 7, 9, 5, 3, 4, 4, 2, 3]);
        var output = computeTriangleStrips(indices);
        expect(_Array$from(output)).toEqual([0, 1, 2, 3, 4, 5, 0xFFFF, 8, 6, 7, 9, 8]);
    });
    it('works for two-strip example with isolated strip', function () {
        var indices = Uint32Array.from([0, 1, 2, 3, 2, 1, 6, 7, 8, 6, 7, 8, 7, 8, 9, 6, 7, 9, 5, 3, 4, 4, 2, 3]);
        var output = computeTriangleStrips(indices);
        expect(_Array$from(output)).toEqual([0, 1, 2, 3, 4, 5, 0xFFFF, 8, 6, 7, 9, 8, 0xFFFF, 6, 7, 8]);
    });
    it('works for difficult example', function () {
        var indices = Uint32Array.from([1, 2, 3, 0, 1, 2, 0, 2, 3]);
        var origTriangles = getTrianglesFromIndices(indices);
        var output = computeTriangleStrips(new Uint32Array(indices));
        // console.log('indices', Array.from(indices));
        // console.log('output', Array.from(output));
        var newTriangles = getTrianglesFromStrips(output);
        expect(newTriangles).toEqual(origTriangles);
        // expect(Array.from(output)).toEqual([0, 1, 2, 3, 4, 5, 0xFFFF, 8, 6, 7, 9, 8]);
    });
    it('works for random examples', function () {
        var numVertices = 10;
        var numTriangles = 20;
        for (var iter = 0; iter < 10; ++iter) {
            var indices = makeRandomIndices(numTriangles, numVertices);
            var origTriangles = getTrianglesFromIndices(indices);
            var output = computeTriangleStrips(new Uint32Array(indices));
            // console.log('indices', Array.from(indices));
            // console.log('output', Array.from(output));
            var newTriangles = getTrianglesFromStrips(output);
            expect(newTriangles).toEqual(origTriangles);
        }
    });
    it('works for random partitioned examples', function () {
        var numVertices = 10;
        var numTriangles = 20 + 30 + 40 + 50;
        for (var iter = 0; iter < 10; ++iter) {
            var indices = makeRandomIndices(numTriangles, numVertices);
            var subChunkOffsets = Uint32Array.of(0, 20 * 3, (20 + 30) * 3, (20 + 30 + 40) * 3, (20 + 30 + 40 + 50) * 3);
            var outputSubChunkOffsets = new Uint32Array(subChunkOffsets);
            var output = computeTriangleStrips(new Uint32Array(indices), outputSubChunkOffsets);
            // console.log('indices', Array.from(indices));
            // console.log('output', Array.from(output));
            for (var subChunk = 0; subChunk < 4; ++subChunk) {
                var outputBegin = outputSubChunkOffsets[subChunk],
                    outputEnd = outputSubChunkOffsets[subChunk + 1];
                expect(outputBegin).toBeLessThanOrEqual(outputEnd);
                expect(outputBegin).toBeGreaterThanOrEqual(0);
                expect(outputEnd).toBeLessThanOrEqual(output.length);
                var newTriangles = getTrianglesFromStrips(output.subarray(outputBegin, outputEnd));
                var origTriangles = getTrianglesFromIndices(indices.subarray(subChunkOffsets[subChunk], subChunkOffsets[subChunk + 1]));
                expect(newTriangles).toEqual(origTriangles);
            }
        }
    });
});
//# sourceMappingURL=triangle_strips.spec.js.map