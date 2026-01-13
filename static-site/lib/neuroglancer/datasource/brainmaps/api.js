import _Object$assign from 'babel-runtime/core-js/object/assign';
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
import { fetchWithCredentials } from '../../credentials_provider/http_request';
import { uncancelableToken } from '../../util/cancellation';
import { responseArrayBuffer, responseJson } from '../../util/http_request';
/**
 * Key used for retrieving the CredentialsProvider from a CredentialsManager.
 */
export var credentialsKey = 'google-brainmaps';
export function makeRequest(instance, credentialsProvider, httpCall) {
    var cancellationToken = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : uncancelableToken;

    return fetchWithCredentials(credentialsProvider, '' + instance.serverUrl + httpCall.path, { method: httpCall.method, body: httpCall.payload }, httpCall.responseType === 'json' ? responseJson : responseArrayBuffer, function (credentials, init) {
        var headers = new Headers(init.headers);
        headers.set('Authorization', credentials.tokenType + ' ' + credentials.accessToken);
        return _Object$assign({}, init, { headers: headers });
    }, function (error) {
        var status = error.status;

        if (status === 401) {
            // 401: Authorization needed.  OAuth2 token may have expired.
            return 'refresh';
        } else if (status === 504 || status === 503) {
            // 503: Service unavailable.  Retry.
            // 504: Gateway timeout.  Can occur if the server takes too long to reply.  Retry.
            return 'retry';
        }
        throw error;
    }, cancellationToken);
}
//# sourceMappingURL=api.js.map