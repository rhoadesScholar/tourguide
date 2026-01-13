import _Math$imul from "babel-runtime/core-js/math/imul";
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
 * This is a very simple string hash function.  It isn't secure, but
 * is suitable for sharding of requests.
 */
export function simpleStringHash(s) {
    var h = 0;
    var length = s.length;
    for (var i = 0; i < length; ++i) {
        h = h * 31 + s.charCodeAt(i) | 0;
    }
    return h;
}
/**
 * MurmurHash3_x86_32 mixing function
 */
export function murmurHash3_x86_32Mix(h, k) {
    k = _Math$imul(k, 0xcc9e2d51) >>> 0;
    k = (k << 15 | k >>> 17) >>> 0;
    k = _Math$imul(k, 0x1b873593) >>> 0;
    h ^= k;
    h = (h << 13 | h >>> 19) >>> 0;
    h = _Math$imul(h, 5) + 0xe6546b64 >>> 0;
    return h;
}
/**
 * MurmurHash3_x86_32 finalization function
 */
export function murmurHash3_x86_32Finalize(h, len) {
    h ^= len;
    h ^= h >>> 16;
    h = _Math$imul(h, 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
    h *= 0xc2b2ae35;
    h ^= h >>> 16;
    return h >>> 0;
}
/**
 * MurmurHash3_x86_32, specialized for 8 bytes of input.
 */
export function murmurHash3_x86_32Hash64Bits(seed, low, high) {
    var h = seed;
    h = murmurHash3_x86_32Mix(h, low);
    h = murmurHash3_x86_32Mix(h, high);
    return murmurHash3_x86_32Finalize(h, 8);
}
function murmurHash3_x86_128Mix(h) {
    h ^= h >>> 16;
    h = _Math$imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = _Math$imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h;
}
function rotl32(x, r) {
    return x << r | x >>> 32 - r;
}
/**
 * MurmurHash3_x86_128, specialized for 8 bytes of input.
 *
 * Only the low 8 bytes of output are returned.
 */
export function murmurHash3_x86_128Hash64Bits(out, seed, low, high) {
    var h1 = seed,
        h2 = seed,
        h3 = seed,
        h4 = seed;
    var c1 = 0x239b961b;
    var c2 = 0xab0e9789;
    var c3 = 0x38b34ae5;
    // const c4 = 0xa1e38b93;
    var k2 = _Math$imul(high, c2);
    k2 = rotl32(k2, 16);
    k2 = _Math$imul(k2, c3);
    h2 ^= k2;
    var k1 = _Math$imul(low, c1);
    k1 = rotl32(k1, 15);
    k1 = _Math$imul(k1, c2);
    h1 ^= k1;
    var len = 8;
    h1 ^= len;
    h2 ^= len;
    h3 ^= len;
    h4 ^= len;
    h1 = h1 + h2 >>> 0;
    h1 = h1 + h3 >>> 0;
    h1 = h1 + h4 >>> 0;
    h2 = h2 + h1 >>> 0;
    h3 = h3 + h1 >>> 0;
    h4 = h4 + h1 >>> 0;
    h1 = murmurHash3_x86_128Mix(h1);
    h2 = murmurHash3_x86_128Mix(h2);
    h3 = murmurHash3_x86_128Mix(h3);
    h4 = murmurHash3_x86_128Mix(h4);
    h1 = h1 + h2 >>> 0;
    h1 = h1 + h3 >>> 0;
    h1 = h1 + h4 >>> 0;
    h2 = h2 + h1 >>> 0;
    // h3 = (h3 + h1) >>> 0;
    // h4 = (h4 + h1) >>> 0;
    out.low = h1;
    out.high = h2;
    return out;
}
//# sourceMappingURL=hash.js.map