import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Set from 'babel-runtime/core-js/set';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
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
/**
 * @file
 * Provides a simple way to request a file on the backend with priority integration.
 */
import { Chunk, ChunkSourceBase } from './backend';
import { ChunkPriorityTier, ChunkState } from './base';
import { CANCELED, makeCancelablePromise } from '../util/cancellation';
import { cancellableFetchOk, responseArrayBuffer } from '../util/http_request';
import { stableStringify } from '../util/json';
import { getObjectId } from '../util/object_id';

var GenericSharedDataChunk = function (_Chunk) {
    _inherits(GenericSharedDataChunk, _Chunk);

    function GenericSharedDataChunk() {
        _classCallCheck(this, GenericSharedDataChunk);

        var _this = _possibleConstructorReturn(this, (GenericSharedDataChunk.__proto__ || _Object$getPrototypeOf(GenericSharedDataChunk)).apply(this, arguments));

        _this.backendOnly = true;
        return _this;
    }

    _createClass(GenericSharedDataChunk, [{
        key: 'initialize',
        value: function initialize(key) {
            _get(GenericSharedDataChunk.prototype.__proto__ || _Object$getPrototypeOf(GenericSharedDataChunk.prototype), 'initialize', this).call(this, key);
            this.requesters = new _Set();
        }
    }, {
        key: 'downloadSucceeded',
        value: function downloadSucceeded() {
            _get(GenericSharedDataChunk.prototype.__proto__ || _Object$getPrototypeOf(GenericSharedDataChunk.prototype), 'downloadSucceeded', this).call(this);
            var requesters = this.requesters,
                data = this.data;

            this.requesters = undefined;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(requesters), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var requester = _step.value;

                    requester.resolve(data);
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
    }, {
        key: 'downloadFailed',
        value: function downloadFailed(error) {
            _get(GenericSharedDataChunk.prototype.__proto__ || _Object$getPrototypeOf(GenericSharedDataChunk.prototype), 'downloadFailed', this).call(this, error);
            var requesters = this.requesters;

            this.requesters = undefined;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(requesters), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var requester = _step2.value;

                    requester.reject(error);
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
        key: 'freeSystemMemory',
        value: function freeSystemMemory() {
            this.data = undefined;
        }
    }]);

    return GenericSharedDataChunk;
}(Chunk);

export var GenericSharedDataSource = function (_ChunkSourceBase) {
    _inherits(GenericSharedDataSource, _ChunkSourceBase);

    function GenericSharedDataSource(chunkManager, options) {
        _classCallCheck(this, GenericSharedDataSource);

        var _this2 = _possibleConstructorReturn(this, (GenericSharedDataSource.__proto__ || _Object$getPrototypeOf(GenericSharedDataSource)).call(this, chunkManager));

        _this2.registerDisposer(chunkManager);
        var _options$encodeKey = options.encodeKey,
            encodeKey = _options$encodeKey === undefined ? stableStringify : _options$encodeKey;

        _this2.downloadFunction = options.download;
        _this2.encodeKeyFunction = encodeKey;
        var _options$sourceQueueL = options.sourceQueueLevel,
            sourceQueueLevel = _options$sourceQueueL === undefined ? 0 : _options$sourceQueueL;

        _this2.sourceQueueLevel = sourceQueueLevel;
        // This source is unusual in that it updates its own chunk priorities.
        _this2.registerDisposer(_this2.chunkManager.recomputeChunkPrioritiesLate.add(function () {
            _this2.updateChunkPriorities();
        }));
        return _this2;
    }

    _createClass(GenericSharedDataSource, [{
        key: 'updateChunkPriorities',
        value: function updateChunkPriorities() {
            var chunkManager = this.chunkManager;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(this.chunks.values()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var chunk = _step3.value;
                    var requesters = chunk.requesters;

                    if (requesters !== undefined) {
                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = _getIterator(requesters), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var requester = _step4.value;

                                var _requester$getPriorit = requester.getPriority(),
                                    priorityTier = _requester$getPriorit.priorityTier,
                                    priority = _requester$getPriorit.priority;

                                if (priorityTier === ChunkPriorityTier.RECENT) continue;
                                chunkManager.requestChunk(chunk, priorityTier, priority);
                            }
                        } catch (err) {
                            _didIteratorError4 = true;
                            _iteratorError4 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                    _iterator4.return();
                                }
                            } finally {
                                if (_didIteratorError4) {
                                    throw _iteratorError4;
                                }
                            }
                        }
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
        }
    }, {
        key: 'download',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken) {
                var _ref2, size, data;

                return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.next = 2;
                                return this.downloadFunction(chunk.decodedKey, cancellationToken);

                            case 2:
                                _ref2 = _context.sent;
                                size = _ref2.size;
                                data = _ref2.data;

                                chunk.systemMemoryBytes = size;
                                chunk.data = data;

                            case 7:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function download(_x, _x2) {
                return _ref.apply(this, arguments);
            }

            return download;
        }()
        /**
         * Precondition: priorityTier <= ChunkPriorityTier.LAST_ORDERED_TIER
         */

    }, {
        key: 'getData',
        value: function getData(key, getPriority, cancellationToken) {
            var _this3 = this;

            var encodedKey = this.encodeKeyFunction(key);
            var chunk = this.chunks.get(encodedKey);
            if (chunk === undefined) {
                chunk = this.getNewChunk_(GenericSharedDataChunk);
                chunk.decodedKey = key;
                chunk.initialize(encodedKey);
                this.addChunk(chunk);
            }
            return makeCancelablePromise(cancellationToken, function (resolve, reject, token) {
                // If the data is already available or the request has already failed, resolve/reject the
                // promise immediately.
                switch (chunk.state) {
                    case ChunkState.FAILED:
                        reject(chunk.error);
                        return;
                    case ChunkState.SYSTEM_MEMORY_WORKER:
                        resolve(chunk.data);
                        return;
                }
                var requester = { resolve: resolve, reject: reject, getPriority: getPriority };
                chunk.requesters.add(requester);
                token.add(function () {
                    var _chunk = chunk,
                        requesters = _chunk.requesters;

                    if (requesters !== undefined) {
                        requesters.delete(requester);
                        _this3.chunkManager.scheduleUpdateChunkPriorities();
                    }
                    reject(CANCELED);
                });
                _this3.chunkManager.scheduleUpdateChunkPriorities();
            });
        }
    }], [{
        key: 'get',
        value: function get(chunkManager, memoizeKey, options) {
            return chunkManager.memoize.get('getFileSource:' + memoizeKey, function () {
                return new GenericSharedDataSource(chunkManager.addRef(), options);
            });
        }
    }, {
        key: 'getData',
        value: function getData(chunkManager, memoizeKey, options, key, getPriority, cancellationToken) {
            var source = GenericSharedDataSource.get(chunkManager, memoizeKey, options);
            var result = source.getData(key, getPriority, cancellationToken);
            source.dispose();
            return result;
        }
    }, {
        key: 'getUrl',
        value: function getUrl(chunkManager, decodeFunction, url, getPriority, cancellationToken) {
            return GenericSharedDataSource.getData(chunkManager, '' + getObjectId(decodeFunction), {
                download: function download(url, cancellationToken) {
                    return cancellableFetchOk(url, {}, responseArrayBuffer, cancellationToken).then(function (response) {
                        return decodeFunction(response, cancellationToken);
                    });
                }
            }, url, getPriority, cancellationToken);
        }
    }]);

    return GenericSharedDataSource;
}(ChunkSourceBase);
//# sourceMappingURL=generic_file_source.js.map