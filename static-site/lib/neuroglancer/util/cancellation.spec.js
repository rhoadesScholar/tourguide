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
import { CANCELED, CancellationTokenSource, makeCancelablePromise, MultipleConsumerCancellationTokenSource, throwIfCanceled, uncancelableToken } from './cancellation';
describe('cancellation', function () {
    describe('CancellationTokenSource', function () {
        it('supports cancel', function () {
            var source = new CancellationTokenSource();
            expect(source.isCanceled).toBe(false);
            source.cancel();
            expect(source.isCanceled).toBe(true);
            source.cancel();
            expect(source.isCanceled).toBe(true);
        });
        it('supports add', function () {
            var source = new CancellationTokenSource();
            var log = [];
            var handler = function handler() {
                log.push(1);
            };
            source.add(handler);
            source.cancel();
            expect(log).toEqual([1]);
            source.cancel();
            expect(log).toEqual([1]);
        });
        it('supports add after cancel', function () {
            var source = new CancellationTokenSource();
            source.cancel();
            var log = [];
            var handler = function handler() {
                log.push(1);
            };
            source.add(handler);
            expect(log).toEqual([1]);
        });
        it('supports remove', function () {
            var source = new CancellationTokenSource();
            var log = [];
            var handler = function handler() {
                log.push(1);
            };
            source.add(handler);
            source.remove(handler);
            source.cancel();
            expect(log).toEqual([]);
        });
        it('supports throwIfCanceled', function () {
            var source = new CancellationTokenSource();
            expect(function () {
                return throwIfCanceled(source);
            }).not.toThrow();
            source.cancel();
            expect(function () {
                return throwIfCanceled(source);
            }).toThrow(CANCELED);
        });
    });
    describe('uncancelableToken', function () {
        it('supports isCanceled', function () {
            expect(uncancelableToken.isCanceled).toBe(false);
        });
        it('supports add', function () {
            uncancelableToken.add(function () {});
        });
        it('supports remove', function () {
            var handler = function handler() {};
            uncancelableToken.add(handler);
            uncancelableToken.remove(handler);
        });
    });
    describe('MultipleConsumerCancellationTokenSource', function () {
        it('supports cancellation from two consumers', function () {
            var multiToken = new MultipleConsumerCancellationTokenSource();
            var token1 = new CancellationTokenSource();
            multiToken.addConsumer(token1);
            var token2 = new CancellationTokenSource();
            multiToken.addConsumer(token2);
            token1.cancel();
            expect(multiToken.isCanceled).toBe(false);
            token2.cancel();
            expect(multiToken.isCanceled).toBe(true);
        });
        it('supports cancellation from three consumers', function () {
            var multiToken = new MultipleConsumerCancellationTokenSource();
            var token1 = new CancellationTokenSource();
            multiToken.addConsumer(token1);
            var token2 = new CancellationTokenSource();
            multiToken.addConsumer(token2);
            token1.cancel();
            expect(multiToken.isCanceled).toBe(false);
            var token3 = new CancellationTokenSource();
            multiToken.addConsumer(token3);
            token2.cancel();
            expect(multiToken.isCanceled).toBe(false);
            token3.cancel();
            expect(multiToken.isCanceled).toBe(true);
        });
    });
    describe('makeCancellablePromise', function () {
        it('supports basic resolve behavior', function (done) {
            var promise = makeCancelablePromise(uncancelableToken, function (resolve, _reject, _token) {
                resolve(3);
            });
            promise.then(function (value) {
                expect(value).toBe(3);
                done();
            });
        });
        it('supports basic reject behavior', function (done) {
            var promise = makeCancelablePromise(uncancelableToken, function (_resolve, reject, _token) {
                reject(3);
            });
            promise.catch(function (value) {
                expect(value).toBe(3);
                done();
            });
        });
        it('unregisters the cancellation handler when the promise is fulfilled', function () {
            var source = new CancellationTokenSource();
            var log = [];
            makeCancelablePromise(source, function (resolve, _reject, token) {
                token.add(function () {
                    log.push('cancel called');
                });
                resolve(1);
                source.cancel();
                expect(log).toEqual([]);
            });
        });
        it('unregisters the cancellation handler when the promise is rejected', function () {
            var source = new CancellationTokenSource();
            var log = [];
            makeCancelablePromise(source, function (_resolve, reject, token) {
                token.add(function () {
                    log.push('cancel called');
                });
                reject(1);
                source.cancel();
                expect(log).toEqual([]);
            });
        });
    });
});
//# sourceMappingURL=cancellation.spec.js.map