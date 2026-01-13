import _Map from 'babel-runtime/core-js/map';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
 * Parser for VTK file format.
 * See http://www.vtk.org/wp-content/uploads/2015/04/file-formats.pdf
 */
var maxHeaderLength = 1000;
var vtkHeaderPattern = /^[ \t]*#[ \t]+vtk[ \t]+DataFile[ \t]+Version[ \t]+([^\s]+)[ \t]*\n(.*)\n[ \t]*(ASCII|BINARY)[ \t]*\n[ \t]*DATASET[ \t]+([^ ]+)[ \t]*\n/;
var pointDataHeaderPattern = /^[ \t]*POINT_DATA[ \t]+([0-9]+)[ \t]*$/;
var pointsHeaderPattern = /^[ \t]*POINTS[ \t]+([0-9]+)[ \t]+([^\s]+)[ \t]*$/;
var scalarsHeaderPattern = /^[ \t]*SCALARS[ \t]+([^\s]+)[ \t]+([^\s]+)(?:[ \t]+([0-9]+))?[ \t]*$/;
var scalarsLookupTableHeaderPattern = /^[ \t]*LOOKUP_TABLE[ \t]+([^\s]+)[ \t]*$/;
var polygonsHeaderPattern = /^[ \t]*POLYGONS[ \t]+([0-9]+)[ \t]+([0-9]+)[ \t]*$/;
var trianglePattern = /^[ \t]*3[ \t]+([0-9]+)[ \t]+([0-9]+)[ \t]+([0-9]+)[ \t]*$/;
var blankLinePattern = /^[ \t]*$/;
export var TriangularMesh = function TriangularMesh(header, numVertices, vertexPositions, numTriangles, indices, vertexAttributes) {
    _classCallCheck(this, TriangularMesh);

    this.header = header;
    this.numVertices = numVertices;
    this.vertexPositions = vertexPositions;
    this.numTriangles = numTriangles;
    this.indices = indices;
    this.vertexAttributes = vertexAttributes;
};
export function getTriangularMeshSize(mesh) {
    var size = mesh.vertexPositions.byteLength + mesh.indices.byteLength;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(mesh.vertexAttributes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var attribute = _step.value;

            size += attribute.data.byteLength;
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

    return size;
}
function parsePolydataAscii(header, data) {
    var decoder = new TextDecoder();
    var text = decoder.decode(data);
    var lines = text.split('\n');
    var numLines = lines.length;
    var lineNumber = 0;
    var numVertices = -1;
    var vertexPositions = undefined;
    var numTriangles = -1;
    var indices = undefined;
    var vertexAttributes = new Array();
    function parseArray(fieldName, n, numComponents, _dataType) {
        // TODO(jbms): respect dataType
        var pattern = RegExp('^[ \t]*' + '([^\s]+)[ \t]+'.repeat(numComponents - 1) + '([^\s]+)[ \t]*$');
        if (numLines - lineNumber < n) {
            throw new Error('VTK data ended unexpectedly while parsing ' + fieldName + '.');
        }
        var result = new Float32Array(n * numComponents);
        var outIndex = 0;
        for (var i = 0; i < n; ++i) {
            var line = lines[lineNumber++];
            var m = line.match(pattern);
            if (m === null) {
                throw new Error('Failed to parse ' + fieldName + ' line ' + i + ': ' + _JSON$stringify(line) + '.');
            }
            for (var j = 0; j < numComponents; ++j) {
                result[outIndex++] = parseFloat(m[j + 1]);
            }
        }
        return result;
    }
    function parsePoints(nVertices, dataType) {
        if (indices !== undefined) {
            throw new Error('POINTS specified more than once.');
        }
        numVertices = nVertices;
        vertexPositions = parseArray('POINTS', nVertices, 3, dataType);
    }
    function parsePolygons(numFaces, numValues) {
        if (indices !== undefined) {
            throw new Error('VERTICES specified more than once.');
        }
        if (numLines - lineNumber < numFaces) {
            throw new Error('VTK data ended unexpectedly');
        }
        if (numValues !== numFaces * 4) {
            throw new Error('Only triangular faces are supported.');
        }
        numTriangles = numFaces;
        indices = new Uint32Array(numFaces * 3);
        var outIndex = 0;
        for (var i = 0; i < numFaces; ++i) {
            var m = lines[lineNumber++].match(trianglePattern);
            if (m === null) {
                throw new Error('Failed to parse indices for face ' + i);
            }
            indices[outIndex++] = parseInt(m[1], 10);
            indices[outIndex++] = parseInt(m[2], 10);
            indices[outIndex++] = parseInt(m[3], 10);
        }
    }
    function parseScalars(name, dataType, numComponents) {
        if (lineNumber === numLines) {
            throw new Error('Expected LOOKUP_TABLE directive.');
        }
        var firstLine = lines[lineNumber++];
        var match = firstLine.match(scalarsLookupTableHeaderPattern);
        if (match === null) {
            throw new Error('Expected LOOKUP_TABLE directive in ' + _JSON$stringify(firstLine) + '.');
        }
        var tableName = match[1];
        var values = parseArray('SCALARS(' + name + ')', numVertices, numComponents, dataType);
        vertexAttributes.push({ name: name, data: values, numComponents: numComponents, dataType: dataType, tableName: tableName });
    }
    function parsePointData(nVertices) {
        if (numVertices !== nVertices) {
            throw new Error('Number of vertices specified in POINT_DATA section (' + nVertices + ') ' + ('must match number of points (' + numVertices + ').'));
        }
        while (lineNumber < numLines) {
            var line = lines[lineNumber];
            if (line.match(blankLinePattern)) {
                ++lineNumber;
                continue;
            }
            var match = void 0;
            match = line.match(scalarsHeaderPattern);
            if (match !== null) {
                var numComponents = void 0;
                if (match[3] === undefined) {
                    numComponents = 1;
                } else {
                    numComponents = parseInt(match[3], 10);
                }
                ++lineNumber;
                parseScalars(match[1], match[2], numComponents);
                continue;
            }
        }
    }
    while (lineNumber < numLines) {
        var line = lines[lineNumber];
        if (line.match(blankLinePattern)) {
            ++lineNumber;
            continue;
        }
        var match = void 0;
        match = line.match(pointsHeaderPattern);
        if (match !== null) {
            ++lineNumber;
            parsePoints(parseInt(match[1], 10), match[2]);
            continue;
        }
        match = line.match(polygonsHeaderPattern);
        if (match !== null) {
            ++lineNumber;
            parsePolygons(parseInt(match[1], 10), parseInt(match[2], 10));
            continue;
        }
        match = line.match(pointDataHeaderPattern);
        if (match !== null) {
            ++lineNumber;
            parsePointData(parseInt(match[1], 10));
            break;
        }
        throw new Error('Failed to parse VTK line ' + _JSON$stringify(line) + '.');
    }
    if (vertexPositions === undefined) {
        throw new Error('Vertex positions not specified.');
    }
    if (indices === undefined) {
        throw new Error('Indices not specified.');
    }
    return new TriangularMesh(header, numVertices, vertexPositions, numTriangles, indices, vertexAttributes);
}
var asciiFormatParsers = new _Map([['POLYDATA', parsePolydataAscii]]);
export function parseVTK(data) {
    // Decode start of data as UTF-8 to determine whether it is ASCII or BINARY format.  Decoding
    // errors (as will occur if it is binary format) will be ignored.
    var decoder = new TextDecoder();
    var decodedHeaderString = decoder.decode(new Uint8Array(data.buffer, data.byteOffset, Math.min(data.byteLength, maxHeaderLength)));
    var headerMatch = decodedHeaderString.match(vtkHeaderPattern);
    if (headerMatch === null) {
        throw new Error('Failed to parse VTK file header.');
    }
    var byteOffset = headerMatch[0].length;
    var datasetType = headerMatch[4];
    var dataFormat = headerMatch[3];
    var header = {
        version: headerMatch[1],
        comment: headerMatch[2],
        datasetType: datasetType,
        dataFormat: dataFormat
    };
    var remainingData = new Uint8Array(data.buffer, data.byteOffset + byteOffset, data.byteLength - byteOffset);
    if (dataFormat === 'ASCII') {
        var formatParser = asciiFormatParsers.get(datasetType);
        if (formatParser === undefined) {
            throw new Error('VTK dataset type ' + _JSON$stringify(datasetType) + ' is not supported.');
        }
        return formatParser(header, remainingData);
    }
    throw new Error('VTK data format ' + _JSON$stringify(dataFormat) + ' is not supported.');
}
//# sourceMappingURL=parse.js.map