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
import { DataType } from './data_type';
import { parseNpy } from './npy';
function checkNpy(spec, encoded) {
    var decoded = parseNpy(encoded);
    expect(decoded.shape).toEqual(spec.shape);
    expect(DataType[decoded.dataType.dataType].toLowerCase()).toBe(spec.dataType);
    expect(_Array$from(decoded.data)).toEqual(spec.data);
}
describe('parseNpy', function () {
    it('uint8', function () {
        checkNpy(require('neuroglancer-testdata/npy_test.uint8.json'), require('raw-data!neuroglancer-testdata/npy_test.uint8.npy'));
    });
    it('uint16-le', function () {
        checkNpy(require('neuroglancer-testdata/npy_test.uint16.json'), require('raw-data!neuroglancer-testdata/npy_test.uint16-le.npy'));
    });
    it('uint16-be', function () {
        checkNpy(require('neuroglancer-testdata/npy_test.uint16.json'), require('raw-data!neuroglancer-testdata/npy_test.uint16-be.npy'));
    });
    it('uint32-le', function () {
        checkNpy(require('neuroglancer-testdata/npy_test.uint32.json'), require('raw-data!neuroglancer-testdata/npy_test.uint32-le.npy'));
    });
    it('uint32-be', function () {
        checkNpy(require('neuroglancer-testdata/npy_test.uint32.json'), require('raw-data!neuroglancer-testdata/npy_test.uint32-be.npy'));
    });
    it('uint64-le', function () {
        checkNpy(require('neuroglancer-testdata/npy_test.uint64.json'), require('raw-data!neuroglancer-testdata/npy_test.uint64-le.npy'));
    });
    it('uint64-be', function () {
        checkNpy(require('neuroglancer-testdata/npy_test.uint64.json'), require('raw-data!neuroglancer-testdata/npy_test.uint64-be.npy'));
    });
    it('float32-le', function () {
        checkNpy(require('neuroglancer-testdata/npy_test.float32.json'), require('raw-data!neuroglancer-testdata/npy_test.float32-le.npy'));
    });
    it('float32-be', function () {
        checkNpy(require('neuroglancer-testdata/npy_test.float32.json'), require('raw-data!neuroglancer-testdata/npy_test.float32-be.npy'));
    });
});
//# sourceMappingURL=npy.spec.js.map