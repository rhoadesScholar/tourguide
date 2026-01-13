import _Object$assign from 'babel-runtime/core-js/object/assign';
/**
 * @license
 * Copyright 2017 Google Inc.
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
import { fetchWithCredentials } from '../../credentials_provider/http_request';
import { uncancelableToken } from '../../util/cancellation';
/**
 * Key used for retrieving the CredentialsProvider from a CredentialsManager.
 */
export var credentialsKey = 'boss';
export function fetchWithBossCredentials(credentialsProvider, input, init, transformResponse) {
    var cancellationToken = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : uncancelableToken;

    return fetchWithCredentials(credentialsProvider, input, init, transformResponse, function (credentials) {
        var headers = new Headers(init.headers);
        headers.set('Authorization', 'Bearer ' + credentials);
        return _Object$assign({}, init, { headers: headers });
    }, function (error) {
        var status = error.status;

        if (status === 403 || status === 401) {
            // Authorization needed.  Retry with refreshed token.
            return 'refresh';
        }
        if (status === 504) {
            // Gateway timeout can occur if the server takes too long to reply.  Retry.
            return 'retry';
        }
        throw error;
    }, cancellationToken);
}
//# sourceMappingURL=api.js.map