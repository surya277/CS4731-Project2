var canvas;
var gl;
var program;

var numTimesToSubdivide = 0;
var chaikinSubdivision = 0;

var index = 0;

var pointsArray = [];
var normalsArray = [];
var linePoints;

var wireFrameMode = false;          // if True draw in WireFrame Mode else draw Normal

var near = -10;
var far = 10;

var left = -3.0;
var right = 3.0;
var ytop =3.0;
var bottom = -3.0;



// Square Vertices
var squareV1 = vec4(0.5,0.5,0.5,1);
var squareV2 = vec4(0.5,0.5,-0.5,1);
var squareV3 = vec4(0.5,-0.5,0.5,1);
var squareV4 = vec4(0.5,-0.5,-0.5,1);
var squareV5 = vec4(-0.5,0.5,0.5,1);
var squareV6 = vec4(-0.5,0.5,-0.5,1);
var squareV7 = vec4(-0.5,-0.5,0.5,1);
var squareV8 = vec4(-0.5,-0.5,-0.5,1);

// Chalkin control points
let lineControlPoints = [
    vec4(-2.5, -1.0, 0.0, 1.0),
    vec4(-3.25, 1.0, 0.0, 1.0),
    vec4(-1.55, 2.0, 0.0, 1.0),
    vec4(2.75, 1.4, 0.0, 1.0),
    vec4(3.25, 0.5, 0.0, 1.0),
    vec4(1.75, -0.5, 0.0, 1.0),
    vec4(2.5, -1.5, 0.0, 1.0),
    vec4(1.0, -1.15, 0.0, 1.0),
    vec4(-1.0, -1.5, 0.0, 1.0),
    
];


var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);


// Draw Triangles
function triangle(a, b, c) {

    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    // normals are vectors

    normalsArray.push(a[0],a[1], a[2], 0.0);
    normalsArray.push(b[0],b[1], b[2], 0.0);
    normalsArray.push(c[0],c[1], c[2], 0.0);

    index += 3;

}

// Subdivide Triangles based on
function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}

// Draw Traingle using each vertex and subdivide based on the count
function cube(a,b,c,d,e,f,g,h,count){
    // Right Side
    divideTriangle(a,b,c,count);
    divideTriangle(d,c,b,count);
    // Bottom
    divideTriangle(a,b,e,count);
    divideTriangle(b,f,e,count);
    // Left Side
    divideTriangle(e,f,h,count);
    divideTriangle(e,g,h,count);
    // Top
    divideTriangle(g,h,c,count);
    divideTriangle(h,c,d,count);
    // Front
    divideTriangle(d,f,h,count);
    divideTriangle(f,d,b,count);
    // Back
    divideTriangle(a,e,c,count);
    divideTriangle(e,c,g,count);
}


function chaikin(vertices, iterations) {

    //Terminating condition
    if(iterations === 0) {
        return vertices;
    }

    var newVertices = [];

    for(var i = 0; i < vertices.length - 1; i++) {
        var v0 = vertices[i];
        var v1 = vertices[i + 1];

        //Chaikin's 1/4, 3/4 division
        var p0 = mix(v0, v1, 0.25);
        var p1 = mix(v0, v1, 0.75);

        newVertices.push(p0, p1);
    }

    return chaikin(newVertices, iterations - 1);
}


window.onload = function init() {
    // Get Canvas
    canvas = document.getElementById( "gl-canvas" );

    window.addEventListener("keydown", keyDownListener);

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    
    setupProjection();

    drawChaikin();
    renderChaikin();
    drawCube();
    
    

    
    renderObjects(wireFrameMode);
}

function drawCube(){
    pointsArray=[];
    normalsArray= [];
    cube(squareV1,squareV2,squareV3,squareV4,squareV5,squareV6,squareV7,squareV8,numTimesToSubdivide);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function drawChaikin() {
    linePoints = chaikin(lineControlPoints, chaikinSubdivision);
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(linePoints), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    //gl.drawArrays(gl.LINE_STRIP, 0, lineControlPoints.length);
}


window.addEventListener("keydown", keyDownListener);

function keyDownListener(event){
    console.log("Key Pressed!");
    var key = event.key;
    switch(key){
        // Increase SubDivisions
        case 'e':
            numTimesToSubdivide+=1;
            if(numTimesToSubdivide>=5)
                numTimesToSubdivide=5;
            console.log(numTimesToSubdivide);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            drawChaikin();
            renderChaikin();
            drawCube();
            renderObjects(wireFrameMode);
            break;
        
        // Reduce Subdivisions
        case 'q':
            numTimesToSubdivide-=1;
            if(numTimesToSubdivide<=0)
                numTimesToSubdivide=0;
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            drawChaikin();
            renderChaikin();
            drawCube();
            renderObjects(wireFrameMode);
            break;

        // Set WireFrame Mode
        case 'm':           
            if(wireFrameMode)
                wireFrameMode = false;
            else
                wireFrameMode = true;
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            drawChaikin();
            renderChaikin();
            drawCube();
            renderObjects(wireFrameMode);
            break;

        // Increase Chaikin Subdivision
        case 'i':
            chaikinSubdivision+=1;
            if(chaikinSubdivision>=8)
                chaikinSubdivision=5;
            //console.log(numTimesToSubdivide);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            drawChaikin();
            renderChaikin();
            drawCube();
            renderObjects(wireFrameMode);
            break;

        case 'j':
            chaikinSubdivision-=1;
            if(chaikinSubdivision<=0)
                chaikinSubdivision=0;
            //console.log(numTimesToSubdivide);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            drawChaikin();
            renderChaikin();
            drawCube();
            renderObjects(wireFrameMode);
            break;
    }
}

function setupProjection(){
    
    eye = vec3(0, 0, 4);

    // Camera Matrix (Position, Looking at, Up)
    modelViewMatrix = lookAt(eye, at , up);

    // Projection Matrix (FOV, Aspect, Near, Far)
    projectionMatrix = perspective(90,1,0.1,10);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
}

function renderChaikin() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.LINE_LOOP,0,linePoints.length);
}

// Previous Model matrix location
function renderObjects(wireFrameMode) {

    //gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //renderChaikin();
    //gl.drawArrays(gl.LINE_LOOP,0,lineControlPoints.length);
    // Check if WireFrame Mode
    
    if(wireFrameMode){
        for( var i=0; i<index; i+=3)
            gl.drawArrays( gl.LINE_LOOP, i, 3 );
    }
    else{
        for( var i=0; i<index; i+=3)
            gl.drawArrays( gl.TRIANGLES, i, 3 );
    }
    
}



