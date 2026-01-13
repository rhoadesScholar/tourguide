import _getIterator from "babel-runtime/core-js/get-iterator";
import _Promise from "babel-runtime/core-js/promise";
import _Map from "babel-runtime/core-js/map";
import _get from "babel-runtime/helpers/get";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
/**
 * @license
 * Copyright 2018 Google Inc.
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
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
import { WithParameters } from "../../chunk_manager/backend";
import { ChunkPriorityTier, ChunkState } from "../../chunk_manager/base";
import { getArrayView } from "./base";
import { ComputedVolumeChunkSourceParameters } from "./base";
import { decodeRawChunk } from "../../sliceview/backend_chunk_decoders/raw";
import { decodeChannels as decodeChannels32 } from "../../sliceview/compressed_segmentation/decode_uint32";
import { decodeChannels as decodeChannels64 } from "../../sliceview/compressed_segmentation/decode_uint64";
import { VolumeChunk, VolumeChunkSource } from "../../sliceview/volume/backend";
import { CANCELED } from "../../util/cancellation";
import { DATA_TYPE_BYTES, DataType } from "../../util/data_type";
import { prod3 as prod, vec3 } from "../../util/geom";
import { registerSharedObject, SharedObjectCounterpart } from "../../worker_rpc";
export var VolumeComputationBackend = function (_SharedObjectCounterp) {
    _inherits(VolumeComputationBackend, _SharedObjectCounterp);

    function VolumeComputationBackend(rpc, params) {
        _classCallCheck(this, VolumeComputationBackend);

        var _this = _possibleConstructorReturn(this, (VolumeComputationBackend.__proto__ || _Object$getPrototypeOf(VolumeComputationBackend)).call(this, rpc, params));

        _this.params = params;
        return _this;
    }

    _createClass(VolumeComputationBackend, [{
        key: "createOutputBuffer",
        value: function createOutputBuffer() {
            var outputSpec = this.params.outputSpec;

            return new ArrayBuffer(prod(outputSpec.size) * outputSpec.numChannels * DATA_TYPE_BYTES[outputSpec.dataType]);
        }
    }]);

    return VolumeComputationBackend;
}(SharedObjectCounterpart);
/**
 * Computes the index relative to the origin of a larger 4d volume given the
 * index relative to a fully contained sub volume. In particular this allows
 * for iteration along a subregion of a volume using linear indices.
 * @param idx the linear index into a subregion
 * @param offset the subregion's offset relative to the overall volume
 * @param cropSize the subregion's size
 * @param size the overal volume's size
 */
function subBoxIndex(idx, offset, cropSize, size) {
    return idx % cropSize[0] + offset[0] + (Math.floor(idx / cropSize[0]) % cropSize[1] + offset[1]) * size[0] + (Math.floor(idx / (cropSize[0] * cropSize[1])) % cropSize[2] + offset[2]) * size[0] * size[1] + Math.floor(idx / (cropSize[0] * cropSize[1] * cropSize[2])) * size[0] * size[1] * size[2];
}
/**
 * Copies the overlapping region of the source array into the destination
 * array.
 * @param sourceCorner the corner (lower-bound) corresponding to the source
 *   array, in global coordinates.
 * @param sourceSize the source array's size
 * @param sourceView the source array
 * @param destCorner the corner corresponding to the destination array
 * @param destSize the destination array's size
 * @param destView the destination array
 * @param dataType the data type of both source and destintation arrays.
 */
export function copyBufferOverlap(sourceCorner, sourceSize, sourceView, destCorner, destSize, destView, dataType) {
    // UINT64 data is packed two-at-a-time into a UINT32 array, so we handle it as a special case.
    var copyFunction = dataType === DataType.UINT64 ? function (j, k) {
        destView[2 * k] = sourceView[2 * j];
        destView[2 * k + 1] = sourceView[2 * j + 1];
    } : function (j, k) {
        destView[k] = sourceView[j];
    };
    // Global Coordinates
    var commonLower = vec3.max(vec3.create(), sourceCorner, destCorner);
    var sourceUpper = vec3.add(vec3.create(), sourceCorner, sourceSize);
    var destUpper = vec3.add(vec3.create(), destCorner, destSize);
    var commonUpper = vec3.min(vec3.create(), sourceUpper, destUpper);
    var commonSize = vec3.subtract(vec3.create(), commonUpper, commonLower);
    var sourceLower = vec3.subtract(vec3.create(), commonLower, sourceCorner);
    var destLower = vec3.subtract(vec3.create(), commonLower, destCorner);
    for (var i = 0; i < prod(commonSize); ++i) {
        var j = subBoxIndex(i, /*offset=*/sourceLower, /*cropSize=*/commonSize, /*size=*/sourceSize);
        var k = subBoxIndex(i, /*offset=*/destLower, /*cropSize=*/commonSize, /*size=*/destSize);
        copyFunction(j, k);
    }
}
/**
 * Computes a consistent key string from a chunk grid position.
 *
 * It's tempting to use chunk.key, in particular because these values will
 * often be the same, but we won't always have access to a fully-specified
 * chunk, and there's no contractual guarantee that its key will be equal to
 * the value returned here.
 * @param gridPosition chunk grid position
 */
function gridPositionKey(gridPosition) {
    return gridPosition.toLocaleString();
}
// In addition to acting as a VolumeChunk for the purposes of a ChunkManager
// object, also performs the book-keeping necessary to prepare the data buffer
// used as input by the computation that provides its data. This includes
// fetching chunk data from other datasources.
export var ComputedVolumeChunk = function (_VolumeChunk) {
    _inherits(ComputedVolumeChunk, _VolumeChunk);

    function ComputedVolumeChunk() {
        _classCallCheck(this, ComputedVolumeChunk);

        // True iff this chunk is actively computing.
        var _this2 = _possibleConstructorReturn(this, (ComputedVolumeChunk.__proto__ || _Object$getPrototypeOf(ComputedVolumeChunk)).apply(this, arguments));

        _this2.computing_ = false;
        // True iff this chunk has been initialized for computation.
        _this2.initialized_ = false;
        // A map from grid position string keys, as returned by gridPositionKey to
        // vec3 grid positions. This is used as an indirection to avoid storing
        // explicit references to VolumeChunks belonging to the origin source.
        _this2.originGridPositions_ = new _Map();
        // Indicate to the ChunkManager that this is a computational Chunk.
        _this2.isComputational = true;
        return _this2;
    }
    /**
     * Sets up computation parameters, computes overlapping origin chunks and
     * initializes the input buffer. Returns a Promise that will resolve when
     * computation completes, or reject if computation fails or is cancelled.
     * @param computationParams computation parameters
     * @param cancellationToken cancellation token
     */


    _createClass(ComputedVolumeChunk, [{
        key: "initializeComputation",
        value: function initializeComputation(computationParams, cancellationToken) {
            var _this3 = this;

            if (!this.source) {
                throw new Error('initializeComputation must be called after source is valid.');
            }
            if (!this.chunkDataSize) {
                throw new Error('initializeComputation must be called after computeChunkBounds.');
            }
            this.computationParams_ = computationParams;
            this.cancellationToken_ = cancellationToken;
            this.computing_ = false;
            this.inputBuffer_ = undefined;
            this.cancellationToken_.add(function () {
                _this3.fail_(CANCELED);
            });
            // Compute the input bounding box for this manager
            // These computations happen without regard for edge effects, which are
            // handled post-computation by cropping to this VolumeChunk's geometry.
            var _computationParams_ = this.computationParams_,
                inputSpec = _computationParams_.inputSpec,
                outputSpec = _computationParams_.outputSpec;

            var twos = [2.0, 2.0, 2.0];
            var outBoxLower = vec3.multiply(vec3.create(), this.chunkGridPosition, outputSpec.size);
            var outputCenter = vec3.add(vec3.create(), outBoxLower, vec3.divide(vec3.create(), outputSpec.size, twos));
            var scaleFactor = this.source.parameters.scaleFactor;
            var inputCenter = vec3.divide(vec3.create(), outputCenter, scaleFactor);
            var inputSize = inputSpec.size;
            this.inputLower_ = vec3.subtract(vec3.create(), inputCenter, vec3.divide(vec3.create(), inputSize, twos));
            this.inputBuffer_ = new ArrayBuffer(this.systemMemoryBytes);
            this.setupSourceChunks_();
            this.initialized_ = true;
            return new _Promise(function (resolve, reject) {
                _this3.resolve_ = resolve;
                _this3.reject_ = reject;
            });
        }
    }, {
        key: "initializeVolumeChunk",
        value: function initializeVolumeChunk(key, chunkGridPosition) {
            _get(ComputedVolumeChunk.prototype.__proto__ || _Object$getPrototypeOf(ComputedVolumeChunk.prototype), "initializeVolumeChunk", this).call(this, key, chunkGridPosition);
            var inputSpec = this.source.computation.params.inputSpec;

            var inputSize = inputSpec.size;
            var bufferLength = prod(inputSize) * inputSpec.numChannels;
            var originDataType = inputSpec.dataType;
            // Signal that we're about to take up memory. This value will be overwritten
            // post-computation by a call to decodeRawChunk.
            this.systemMemoryBytes = bufferLength * DATA_TYPE_BYTES[originDataType];
        }
        /**
         * Listens to state changes on origin Chunks.
         * @param chunk an origin Chunk.
         */

    }, {
        key: "stateChanged",
        value: function stateChanged(chunk) {
            var _this4 = this;

            var volumeChunk = chunk;
            switch (volumeChunk.state) {
                case ChunkState.SYSTEM_MEMORY_WORKER:
                    {
                        this.copyOriginChunk_(volumeChunk);
                        break;
                    }
                case ChunkState.FAILED:
                case ChunkState.EXPIRED:
                    {
                        this.fail_(new Error('Data source chunk has expired.'));
                        break;
                    }
                case ChunkState.SYSTEM_MEMORY:
                case ChunkState.GPU_MEMORY:
                    {
                        // The data was moved to the frontend before we could intercept it, so
                        // request it to be sent back.
                        var gridKey = gridPositionKey(volumeChunk.chunkGridPosition);
                        var chunkSize = volumeChunk.chunkDataSize;
                        var originSource = this.source.originSource;
                        var chunkCorner = vec3.multiply(vec3.create(), volumeChunk.chunkGridPosition, originSource.spec.chunkDataSize);
                        this.source.requestChunkData(this, volumeChunk).then(function (data) {
                            var originGridPosition = _this4.originGridPositions_.get(gridKey);
                            var originChunk = originSource.getChunk(originGridPosition);
                            originChunk.unregisterListener(_this4);
                            _this4.originGridPositions_.delete(gridKey);
                            var inputSpec = _this4.computationParams_.inputSpec;
                            var destination = getArrayView(_this4.inputBuffer_, inputSpec.dataType);
                            var numChannels = originSource.spec.numChannels;
                            var rawSource = _this4.maybeDecodeBuffer_(data, inputSpec.dataType, originChunk.chunkDataSize, numChannels);
                            copyBufferOverlap(chunkCorner, chunkSize, rawSource, _this4.inputLower_, inputSpec.size, destination, inputSpec.dataType);
                            setTimeout(function () {
                                return _this4.checkDone_();
                            }, 0);
                        }).catch(function (error) {
                            console.log(_this4.key, 'unable to retrieve frontend data for', volumeChunk.key);
                            _this4.fail_(error);
                        });
                        break;
                    }
            }
        }
        /**
         * Returns a list of the grid positions corresponding to chunks on the origin
         * source that this chunk overlaps.
         */

    }, {
        key: "getOverlappingOriginGridPositions",
        value: function getOverlappingOriginGridPositions() {
            return this.originGridPositions_.values();
        }
    }, {
        key: "dispose",
        value: function dispose() {
            _get(ComputedVolumeChunk.prototype.__proto__ || _Object$getPrototypeOf(ComputedVolumeChunk.prototype), "dispose", this).call(this);
            this.cleanup_();
        }
        /**
         * Unregisters listeners and so forth that were originally registered by this
         * chunk.
         */

    }, {
        key: "cleanup_",
        value: function cleanup_() {
            if (!this.initialized_ || !this.source) {
                return;
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.originGridPositions_.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var chunkGridPosition = _step.value;

                    this.source.originSource.getChunk(chunkGridPosition).unregisterListener(this);
                    this.source.cancelChunkDataRequest(gridPositionKey(chunkGridPosition), this.key);
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

            this.originGridPositions_.clear();
            this.source.unregisterChunk(this);
        }
        /**
         * Handles failure conditions encountered while fetching data from the origin
         * source.
         * @param reason reason for failure
         */

    }, {
        key: "fail_",
        value: function fail_(reason) {
            this.cleanup_();
            this.reject_(reason);
        }
        /**
         * Decompresses a compressed segmentation buffer, or simply passes it back if
         * raw.
         * @param buffer the possibly-compressed data buffer
         * @param dataType the buffer's datatype
         * @param size the buffer's size
         * @param numChannels the number of channels in the buffer
         */

    }, {
        key: "maybeDecodeBuffer_",
        value: function maybeDecodeBuffer_(buffer, dataType, size, numChannels) {
            var originSource = this.source.originSource;
            if (!originSource.spec.compressedSegmentationBlockSize) {
                return buffer;
            }
            var compressedBlockSize = originSource.spec.compressedSegmentationBlockSize;
            var size4 = [size[0], size[1], size[2], numChannels];
            if (dataType === DataType.UINT32) {
                var decoded = new Uint32Array(prod(size) * numChannels);
                decodeChannels32(decoded, buffer, 0, size4, compressedBlockSize);
                return decoded;
            }
            if (dataType === DataType.UINT64) {
                var _decoded = new Uint32Array(prod(size) * numChannels * 2);
                decodeChannels64(_decoded, buffer, 0, size4, compressedBlockSize);
                return _decoded;
            }
            throw new Error("Compression is unsupported for datatypes other than UINT32 and UINT64");
        }
        /**
         * Copies an origin chunk's data into the appropriate location in the input
         * buffer.
         * @param originChunk origin Chunk
         */

    }, {
        key: "copyOriginChunk_",
        value: function copyOriginChunk_(originChunk) {
            var _this5 = this;

            var inputSpec = this.computationParams_.inputSpec;
            var gridKey = gridPositionKey(originChunk.chunkGridPosition);
            this.originGridPositions_.delete(gridKey);
            var chunkSize = originChunk.chunkDataSize;
            var numChannels = inputSpec.numChannels;
            var chunkCorner = vec3.multiply(vec3.create(), originChunk.chunkGridPosition, this.source.originSource.spec.chunkDataSize);
            var destination = getArrayView(this.inputBuffer_, inputSpec.dataType);
            var source = this.maybeDecodeBuffer_(originChunk.data, inputSpec.dataType, chunkSize, numChannels);
            copyBufferOverlap(chunkCorner, chunkSize, source, this.inputLower_, inputSpec.size, destination, inputSpec.dataType);
            originChunk.unregisterListener(this);
            setTimeout(function () {
                return _this5.checkDone_();
            }, 0);
        }
        /**
         * Peforms the computation over the input buffer, ensuring validity of the
         * eventual output data that will be set for this chunk. This includes
         * handling volume-boundary effects.
         */

    }, {
        key: "performComputation_",
        value: function performComputation_() {
            var _this6 = this;

            if (this.cancellationToken_.isCanceled) {
                return _Promise.reject(CANCELED);
            }
            var computation = this.source.computation;
            var outputSpec = this.computationParams_.outputSpec;

            var outputSize = outputSpec.size;
            var outputDataType = outputSpec.dataType;
            // Most of the time, the chunk data size corresponds to the output buffer
            // size, but a chunk at the upper bound of a volume will be clipped to the
            // volume bounds. Computations are guaranteed the same buffer sizes each
            // time, so we check for this situation and perform a crop-and-copy when
            // necessary.
            return computation.compute(this.inputBuffer_, this.cancellationToken_, this).then(function (outputBuffer) {
                _this6.inputBuffer_ = undefined;
                if (vec3.equals(outputSize, _this6.chunkDataSize)) {
                    return decodeRawChunk(_this6, _this6.cancellationToken_, outputBuffer);
                }
                var outputBufferView = getArrayView(outputBuffer, outputDataType);
                var chunkBuffer = new ArrayBuffer(prod(_this6.chunkDataSize) * outputSpec.numChannels * DATA_TYPE_BYTES[outputDataType]);
                var chunkBufferView = getArrayView(chunkBuffer, outputDataType);
                var outputCorner = vec3.multiply(vec3.create(), _this6.chunkGridPosition, outputSize);
                copyBufferOverlap(outputCorner, outputSize, outputBufferView, outputCorner, _this6.chunkDataSize, chunkBufferView, outputDataType);
                return decodeRawChunk(_this6, _this6.cancellationToken_, chunkBuffer);
            });
        }
        /**
         * Idempotently performs the computation, if the input buffer is ready. This
         * function should be called after a timeout in most cases, because it may
         * take a long time to return.
         */

    }, {
        key: "checkDone_",
        value: function checkDone_() {
            var _this7 = this;

            if (this.computing_) {
                return;
            }
            if (this.originGridPositions_.size === 0) {
                this.computing_ = true;
                this.cleanup_();
                this.performComputation_().then(function () {
                    if (_this7.resolve_) {
                        _this7.resolve_();
                    }
                }).catch(function (error) {
                    _this7.reject_(error);
                });
            }
        }
        /**
         * Computes the chunkGridPosition for each valid origin chunk that the input
         * field of this computational chunk overlaps, populating the origin grid
         * positions map. Also registers this chunk as a listener on the state
         * changes of the origin chunks.
         */

    }, {
        key: "setupSourceChunks_",
        value: function setupSourceChunks_() {
            var originSource = this.source.originSource;
            var originChunkSize = originSource.spec.chunkDataSize;
            var inputSpec = this.computationParams_.inputSpec;
            var inputLower = this.inputLower_;
            var gridLower = vec3.floor(vec3.create(), vec3.divide(vec3.create(), inputLower, originChunkSize));
            var inputSizeMinusOne = vec3.subtract(vec3.create(), inputSpec.size, [1, 1, 1]);
            var inBoxUpper = vec3.add(vec3.create(), inputLower, inputSizeMinusOne);
            vec3.max(gridLower, gridLower, [0, 0, 0]);
            vec3.min(inBoxUpper, inBoxUpper, originSource.spec.upperVoxelBound);
            var gridUpper = vec3.floor(vec3.create(), vec3.divide(vec3.create(), inBoxUpper, originChunkSize));
            var gridPosition = vec3.create();
            for (var z = gridLower[2]; z <= gridUpper[2]; ++z) {
                for (var y = gridLower[1]; y <= gridUpper[1]; ++y) {
                    for (var x = gridLower[0]; x <= gridUpper[0]; ++x) {
                        gridPosition.set([x, y, z]);
                        var key = gridPositionKey(gridPosition);
                        this.originGridPositions_.set(key, vec3.copy(vec3.create(), gridPosition));
                    }
                }
            }
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.originGridPositions_.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var chunkGridPosition = _step2.value;

                    var chunk = originSource.getChunk(chunkGridPosition);
                    chunk.registerListener(this);
                    this.stateChanged(chunk);
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
    }]);

    return ComputedVolumeChunk;
}(VolumeChunk);
var ComputedVolumeChunkSource = function (_WithParameters) {
    _inherits(ComputedVolumeChunkSource, _WithParameters);

    function ComputedVolumeChunkSource(rpc, options) {
        _classCallCheck(this, ComputedVolumeChunkSource);

        // Computations that are waiting for input data.
        var _this8 = _possibleConstructorReturn(this, (ComputedVolumeChunkSource.__proto__ || _Object$getPrototypeOf(ComputedVolumeChunkSource)).call(this, rpc, options));

        _this8.pendingComputations_ = new _Map();
        // Promise callbacks for pending data requests that were made to the
        // front-end, which are necessary when source data has been previously
        // downloaded and moved to the GPU. The top-level map is keyed by the origin
        // chunk keys. The inner maps are keyed by the requestor.
        _this8.frontendRequestPromises_ = new _Map();
        _this8.originSource = _this8.rpc.getRef(_this8.parameters.sourceRef);
        _this8.computation = _this8.rpc.getRef(_this8.parameters.computationRef);
        _this8.registerDisposer(_this8.chunkManager);
        _this8.registerDisposer(_this8.chunkManager.recomputeChunkPrioritiesLate.add(function () {
            _this8.updateChunkPriorities();
        }));
        return _this8;
    }
    /**
     * Requests that the relevant chunks on the origin source are downloaded, so
     * their data may be available for computation.
     */


    _createClass(ComputedVolumeChunkSource, [{
        key: "updateChunkPriorities",
        value: function updateChunkPriorities() {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(this.pendingComputations_.values()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var outputChunk = _step3.value;

                    if (outputChunk.priorityTier === ChunkPriorityTier.RECENT) {
                        continue;
                    }
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = _getIterator(outputChunk.getOverlappingOriginGridPositions()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var gridPosition = _step4.value;

                            var sourceChunk = this.originSource.getChunk(gridPosition);
                            this.chunkManager.requestChunk(sourceChunk, outputChunk.priorityTier, outputChunk.priority, false);
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
        /**
         * Unregisters a ComputedVolumeChunk from the list of pending computations.
         * @param chunk the computed volume chunk to unregister
         */

    }, {
        key: "unregisterChunk",
        value: function unregisterChunk(chunk) {
            var key = chunk.key;
            this.pendingComputations_.delete(key);
        }
        /**
         * Requests chunk data that has already been moved to the frontend.
         * @param computedChunk the chunk to which data will be provided
         * @param dataChunk the chunk representing the source data.
         */

    }, {
        key: "requestChunkData",
        value: function requestChunkData(computedChunk, dataChunk) {
            var _this9 = this;

            return new _Promise(function (resolve, reject) {
                var originGridKey = gridPositionKey(dataChunk.chunkGridPosition);
                var computedChunkKey = computedChunk.key;
                if (_this9.frontendRequestPromises_.has(originGridKey)) {
                    _this9.frontendRequestPromises_.get(originGridKey).set(computedChunkKey, { resolve: resolve, reject: reject });
                    return;
                }
                _this9.frontendRequestPromises_.set(originGridKey, new _Map([[computedChunkKey, { resolve: resolve, reject: reject }]]));
                _this9.chunkManager.queueManager.retrieveChunkData(dataChunk).then(function (data) {
                    var promiseMap = _this9.frontendRequestPromises_.get(originGridKey);
                    if (!promiseMap) {
                        // The chunk or chunks requesting this data chunk were cancelled.
                        return;
                    }
                    var _iteratorNormalCompletion5 = true;
                    var _didIteratorError5 = false;
                    var _iteratorError5 = undefined;

                    try {
                        for (var _iterator5 = _getIterator(promiseMap.values()), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                            var promisePair = _step5.value;

                            promisePair.resolve(data);
                        }
                    } catch (err) {
                        _didIteratorError5 = true;
                        _iteratorError5 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                _iterator5.return();
                            }
                        } finally {
                            if (_didIteratorError5) {
                                throw _iteratorError5;
                            }
                        }
                    }

                    _this9.frontendRequestPromises_.delete(originGridKey);
                }).catch(function (error) {
                    var promiseMap = _this9.frontendRequestPromises_.get(originGridKey);
                    if (!promiseMap) {
                        return;
                    }
                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;

                    try {
                        for (var _iterator6 = _getIterator(promiseMap.values()), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            var promisePair = _step6.value;

                            promisePair.reject(error);
                        }
                    } catch (err) {
                        _didIteratorError6 = true;
                        _iteratorError6 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                _iterator6.return();
                            }
                        } finally {
                            if (_didIteratorError6) {
                                throw _iteratorError6;
                            }
                        }
                    }

                    _this9.frontendRequestPromises_.delete(originGridKey);
                });
            });
        }
        /**
         * Cancels an outstanding chunk data request.
         * @param originGridKey the key corresponding to the requested chunk
         * @param requestKey the key corresponding to the requestor
         */

    }, {
        key: "cancelChunkDataRequest",
        value: function cancelChunkDataRequest(originGridKey, requestKey) {
            if (this.frontendRequestPromises_.has(originGridKey)) {
                var map = this.frontendRequestPromises_.get(originGridKey);
                map.delete(requestKey);
                if (map.size === 0) {
                    this.frontendRequestPromises_.delete(originGridKey);
                }
            }
        }
    }, {
        key: "download",
        value: function download(chunk, cancellationToken) {
            var outputChunk = chunk;
            this.computeChunkBounds(outputChunk);
            this.pendingComputations_.set(chunk.key, outputChunk);
            var promise = outputChunk.initializeComputation(this.computation.params, cancellationToken);
            this.chunkManager.scheduleUpdateChunkPriorities();
            return promise;
        }
    }]);

    return ComputedVolumeChunkSource;
}(WithParameters(VolumeChunkSource, ComputedVolumeChunkSourceParameters));
ComputedVolumeChunkSource = __decorate([registerSharedObject()], ComputedVolumeChunkSource);
export { ComputedVolumeChunkSource };
ComputedVolumeChunkSource.prototype.chunkConstructor = ComputedVolumeChunk;
//# sourceMappingURL=backend.js.map