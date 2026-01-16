import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Array$from from 'babel-runtime/core-js/array/from';
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
import { DisjointUint64Sets } from './disjoint_sets';
import { Uint64 } from './uint64';
function getSortedElementStrings(disjointSets, x) {
    var members = _Array$from(disjointSets.setElements(x));
    members.sort(Uint64.compare);
    return members.map(function (v) {
        return v.toString();
    });
}
function getContiguousElementStrings(start, end) {
    var result = new Array(end - start);
    for (var i = 0, length = result.length; i < length; ++i) {
        result[i] = (start + i).toString();
    }
    return result;
}
describe('disjoint_sets', function () {
    it('basic', function () {
        var disjointSets = new DisjointUint64Sets();
        // Link the first 25 elements.
        for (var i = 0; i < 24; ++i) {
            var a = new Uint64(i, 0);
            var b = new Uint64(i + 1, 0);
            expect(disjointSets.get(a).toString()).toEqual('0');
            expect(disjointSets.get(b)).toBe(b);
            disjointSets.link(a, b);
            expect(disjointSets.get(a).toString()).toEqual('0');
            expect(disjointSets.get(b).toString()).toEqual('0');
            expect(getSortedElementStrings(disjointSets, a)).toEqual(getContiguousElementStrings(0, i + 2));
        }
        // Link the next 25 elements.
        for (var _i = 25; _i < 49; ++_i) {
            var _a = new Uint64(_i, 0);
            var _b = new Uint64(_i + 1, 0);
            expect(disjointSets.get(_a).toString()).toEqual('25');
            expect(disjointSets.get(_b)).toBe(_b);
            disjointSets.link(_a, _b);
            expect(disjointSets.get(_a).toString()).toEqual('25');
            expect(disjointSets.get(_b).toString()).toEqual('25');
            expect(getSortedElementStrings(disjointSets, _a)).toEqual(getContiguousElementStrings(25, _i + 2));
        }
        // Link the two sets of 25 elements each.
        expect(disjointSets.link(new Uint64(15, 0), new Uint64(40, 0))).toBe(true);
        expect(disjointSets.get(new Uint64(15, 0)).toString()).toEqual('0');
        expect(disjointSets.get(new Uint64(40, 0)).toString()).toEqual('0');
        expect(getSortedElementStrings(disjointSets, new Uint64(15, 0))).toEqual(getContiguousElementStrings(0, 50));
        // Does nothing, the two elements are already merged.
        expect(disjointSets.link(new Uint64(15, 0), new Uint64(40, 0))).toBe(false);
        for (var _i2 = 0; _i2 < 50; ++_i2) {
            var x = new Uint64(_i2, 0);
            // Check that the same representative is returned.
            expect(disjointSets.get(x).toString()).toEqual('0');
            // Check that getSortedElementStrings returns the same list for each member of a set.
            expect(getSortedElementStrings(disjointSets, x)).toEqual(getContiguousElementStrings(0, 50));
        }
        // Check that non-linked elements correctly have only a single element.
        for (var _i3 = 51; _i3 < 100; ++_i3) {
            expect(getSortedElementStrings(disjointSets, new Uint64(_i3, 0))).toEqual(getContiguousElementStrings(_i3, _i3 + 1));
        }
    });
    it('toJSON', function () {
        var disjointSets = new DisjointUint64Sets();
        disjointSets.link(Uint64.parseString('5'), Uint64.parseString('0'));
        disjointSets.link(Uint64.parseString('2'), Uint64.parseString('10'));
        disjointSets.link(Uint64.parseString('2'), Uint64.parseString('3'));
        expect(_JSON$stringify(disjointSets)).toEqual('[["0","5"],["2","3","10"]]');
    });
});
//# sourceMappingURL=disjoint_sets.spec.js.map