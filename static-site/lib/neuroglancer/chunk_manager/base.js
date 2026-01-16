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
export var ChunkState;
(function (ChunkState) {
    // Chunk is stored in GPU memory in addition to system memory.
    ChunkState[ChunkState["GPU_MEMORY"] = 0] = "GPU_MEMORY";
    // Chunk is stored only in system memory but not in GPU memory.
    ChunkState[ChunkState["SYSTEM_MEMORY"] = 1] = "SYSTEM_MEMORY";
    // Chunk is stored in system memory on worker.
    ChunkState[ChunkState["SYSTEM_MEMORY_WORKER"] = 2] = "SYSTEM_MEMORY_WORKER";
    // Chunk is downloading.
    ChunkState[ChunkState["DOWNLOADING"] = 3] = "DOWNLOADING";
    // Chunk is not yet downloading.
    ChunkState[ChunkState["QUEUED"] = 4] = "QUEUED";
    // Chunk has just been added.
    ChunkState[ChunkState["NEW"] = 5] = "NEW";
    // Download failed.
    ChunkState[ChunkState["FAILED"] = 6] = "FAILED";
    ChunkState[ChunkState["EXPIRED"] = 7] = "EXPIRED";
    // If new states are added, keep numChangeStates in sync.
})(ChunkState || (ChunkState = {}));
export var numChunkStates = 8;
export var ChunkPriorityTier;
(function (ChunkPriorityTier) {
    ChunkPriorityTier[ChunkPriorityTier["FIRST_TIER"] = 0] = "FIRST_TIER";
    ChunkPriorityTier[ChunkPriorityTier["FIRST_ORDERED_TIER"] = 0] = "FIRST_ORDERED_TIER";
    ChunkPriorityTier[ChunkPriorityTier["VISIBLE"] = 0] = "VISIBLE";
    ChunkPriorityTier[ChunkPriorityTier["PREFETCH"] = 1] = "PREFETCH";
    ChunkPriorityTier[ChunkPriorityTier["LAST_ORDERED_TIER"] = 1] = "LAST_ORDERED_TIER";
    ChunkPriorityTier[ChunkPriorityTier["RECENT"] = 2] = "RECENT";
    ChunkPriorityTier[ChunkPriorityTier["LAST_TIER"] = 2] = "LAST_TIER";
})(ChunkPriorityTier || (ChunkPriorityTier = {}));
export var numChunkPriorityTiers = 3;
export var ChunkDownloadStatistics;
(function (ChunkDownloadStatistics) {
    ChunkDownloadStatistics[ChunkDownloadStatistics["totalTime"] = 0] = "totalTime";
    ChunkDownloadStatistics[ChunkDownloadStatistics["totalChunks"] = 1] = "totalChunks";
})(ChunkDownloadStatistics || (ChunkDownloadStatistics = {}));
export var ChunkMemoryStatistics;
(function (ChunkMemoryStatistics) {
    ChunkMemoryStatistics[ChunkMemoryStatistics["numChunks"] = 0] = "numChunks";
    ChunkMemoryStatistics[ChunkMemoryStatistics["systemMemoryBytes"] = 1] = "systemMemoryBytes";
    ChunkMemoryStatistics[ChunkMemoryStatistics["gpuMemoryBytes"] = 2] = "gpuMemoryBytes";
})(ChunkMemoryStatistics || (ChunkMemoryStatistics = {}));
export var numChunkMemoryStatistics = 3;
export var numChunkDownloadStatistics = 2;
export var numChunkStatistics = numChunkStates * numChunkPriorityTiers * numChunkMemoryStatistics + numChunkDownloadStatistics;
export function getChunkStateStatisticIndex(state, priorityTier) {
    return state * numChunkPriorityTiers + priorityTier;
}
export function getChunkDownloadStatisticIndex(statistic) {
    return numChunkStates * numChunkPriorityTiers * numChunkMemoryStatistics + statistic;
}
export var PREFETCH_PRIORITY_MULTIPLIER = 1e13;
export var CHUNK_QUEUE_MANAGER_RPC_ID = 'ChunkQueueManager';
export var CHUNK_MANAGER_RPC_ID = 'ChunkManager';
export var CHUNK_SOURCE_INVALIDATE_RPC_ID = 'ChunkSource.invalidate';
export var REQUEST_CHUNK_STATISTICS_RPC_ID = 'ChunkQueueManager.requestChunkStatistics';
//# sourceMappingURL=base.js.map