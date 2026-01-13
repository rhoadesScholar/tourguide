import _getIterator from 'babel-runtime/core-js/get-iterator';
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
 * Returns the longest common prefix of a sequence of strings.
 *
 * Returns '' if the sequence of strings is empty.
 */
export function longestCommonPrefix(strings) {
    var it = _getIterator(strings);

    var _it$next = it.next(),
        firstValue = _it$next.value,
        noValues = _it$next.done;

    if (noValues) {
        // The sequence of strings is empty.
        return '';
    }
    var commonPrefixLength = firstValue.length;
    while (commonPrefixLength > 0) {
        var _it$next2 = it.next(),
            value = _it$next2.value,
            done = _it$next2.done;

        if (done) {
            break;
        }
        var i = 0;
        for (; i < commonPrefixLength; ++i) {
            if (firstValue.charCodeAt(i) !== value.charCodeAt(i)) {
                break;
            }
        }
        commonPrefixLength = i;
    }
    return firstValue.substring(0, commonPrefixLength);
}
//# sourceMappingURL=longest_common_prefix.js.map