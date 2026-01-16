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
import { Memoize } from '../util/memoize';
export var DEBUG_SHADERS = false;
export function initializeWebGL(canvas) {
    var options = {
        'antialias': false,
        'stencil': true
    };
    if (DEBUG_SHADERS) {
        console.log('DEBUGGING via preserveDrawingBuffer');
        options['preserveDrawingBuffer'] = true;
    }
    var gl = canvas.getContext('webgl2', options);
    if (gl == null) {
        throw new Error('WebGL not supported.');
    }
    gl.memoize = new Memoize();
    gl.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    gl.maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    gl.tempTextureUnit = gl.maxTextureImageUnits - 1;
    // FIXME: verify that we received a stencil buffer
    // var contextAttributes = gl.getContextAttributes();
    // var haveStencilBuffer = contextAttributes.stencil;
    var _arr = ['EXT_color_buffer_float'];
    for (var _i = 0; _i < _arr.length; _i++) {
        var extension = _arr[_i];
        if (!gl.getExtension(extension)) {
            throw new Error(extension + ' extension not available');
        }
    }
    // Extensions to attempt to add but not fail if they are not available.
    var _arr2 = [
    // Some versions of Firefox 67.0 seem to require this extension being added in addition
    // to EXT_color_buffer_float, despite the note here indicating it is unnecessary:
    // https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend
    //
    // See https://github.com/google/neuroglancer/issues/140
    'EXT_float_blend'];
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        var _extension = _arr2[_i2];
        gl.getExtension(_extension);
    }
    return gl;
}
//# sourceMappingURL=context.js.map