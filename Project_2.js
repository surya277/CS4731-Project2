var canvas;
var gl;
var program;

var numTimesToSubdivide = 0;
var chaikinSubdivision = 0;

var index = 0;

var pointsArray = [];
var normalsArray = [];
var linePoints;

var wireFrameMode = 0.0;          // if True draw in WireFrame Mode else draw Normal
var animation = false;

var animReq;

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
    vec4(-3.55, 4.0, 0.0, 1.0),
    vec4(4.75, 3.4, 0.5, 1.0),
    vec4(2.5, -0.5, 1.0, 1.0),
    vec4(4.5, -3.5, -1.0, 1.0),
    vec4(0.0, -2.15, -2.0, 1.0),
    vec4(-3.0, -3.5, 1.0, 1.0),
    vec4(-4.5, -2.0, 0.0, 1.0),
    vec4(-4.5, -2.0, 0.0, 1.0),
    vec4(-5.25, 3.0, -1.0, 1.0),
    vec4(-3.55, 4.0, 0.0, 1.0),
];

var lightMode = 0.0;

var lightPosition = vec4(2.5, 2.5, -1.0, 1.0 );  
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var translateMatrix;
var previoustranslateMatrix;
var translateMatrixLoc;
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
    
    gl.uniform4fv(gl.getUniformLocation(program, "lightDiffuse"), flatten(lightDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"), flatten(materialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "lightSpecular"), flatten(lightSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"), flatten(materialSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "lightAmbient"), flatten(lightAmbient));
    gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"), flatten(materialAmbient));
    
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    

    setupProjection();

    drawChaikin();
    renderChaikin();
    translateMatrix = translate(-3.55, 4.0, 0.0);
    drawCube();
    
    

    
    renderObjects(wireFrameMode);
}

function drawCube(){
    pointsArray=[];
    normalsArray= [];
    cube(squareV1,squareV2,squareV3,squareV4,squareV5,squareV6,squareV7,squareV8,numTimesToSubdivide);

    //translateMatrix = translate(-3.55,4.0,0);
    translateMatrixLoc = gl.getUniformLocation(program,'translateMatrix');
    gl.uniformMatrix4fv(translateMatrixLoc, false, flatten(translateMatrix));

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormalPosition = gl.getAttribLocation( program, "vNormal");
    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);

    
    

}

function drawChaikin() {
    previoustranslateMatrix = translateMatrix;
    translateMatrix = translate(0.0,0,0);
    translateMatrixLoc = gl.getUniformLocation(program,'translateMatrix');
    gl.uniformMatrix4fv(translateMatrixLoc, false, flatten(translateMatrix));

    linePoints = chaikin(lineControlPoints, chaikinSubdivision);
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(linePoints), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    translateMatrix = previoustranslateMatrix;
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
            //translateMatrix = translate(linePoints[0][0], linePoints[0][1], linePoints[0][2]);
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
            //translateMatrix = translate(linePoints[0][0], linePoints[0][1], linePoints[0][2]);
            drawCube();
            renderObjects(wireFrameMode);
            break;

        // Set WireFrame Mode
        case 'm':           
            if(wireFrameMode == 0.0){
                wireFrameMode = 1.0;
                console.log("Wireframe Mode");
            }
            else{
                wireFrameMode = 0.0;
                console.log("Lit Mode");
            }
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.uniform1f(gl.getUniformLocation(program, "wireframeCheck"), wireFrameMode);
            drawChaikin();
            renderChaikin();
            //translateMatrix = translate(linePoints[0][0], linePoints[0][1], linePoints[0][2]);
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
            //translateMatrix = translate(linePoints[0][0], linePoints[0][1], linePoints[0][2]);
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
            //translateMatrix = translate(linePoints[0][0], linePoints[0][1], linePoints[0][2]);
            drawCube();
            renderObjects(wireFrameMode);
            break;

        case 'a':
            if(animation){
                animation = false;
                cancelAnimationFrame(animReq);
            }
            else{
                animation = true;
                translateAlongCurve();
            }
            break;

        
        case 'l':
            if(lightMode == 1.0){
                lightMode = 0.0;
                console.log("Phong");
            }
            else{
                lightMode = 1.0;
                console.log("Gouraud");
            }
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.uniform1f(gl.getUniformLocation(program, "gouradCheck"), lightMode);
            drawChaikin();
            renderChaikin();
            //translateMatrix = translate(linePoints[0][0], linePoints[0][1], linePoints[0][2]);
            drawCube();
            renderObjects(wireFrameMode);
            break;
    }
}


// Setup Camera and Projection matrix
function setupProjection(){
    
    eye = vec3(0, 0, 6);

    // Camera Matrix (Position, Looking at, Up)
    modelViewMatrix = lookAt(eye, at , up);

    // Projection Matrix (FOV, Aspect, Near, Far)
    projectionMatrix = perspective(90,1,0.1,10);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
}



// Render Chaikin curve onto Screen
function renderChaikin() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(wireFrameMode == 0.0){
        wireFrameMode = 1.0;
        gl.uniform1f(gl.getUniformLocation(program, "wireframeCheck"), wireFrameMode);
        gl.drawArrays(gl.LINE_LOOP,0,linePoints.length);
        wireFrameMode = 0.0;
        gl.uniform1f(gl.getUniformLocation(program, "wireframeCheck"), wireFrameMode);

    }
    else{
        gl.drawArrays(gl.LINE_LOOP,0,linePoints.length);
    }
        
    
}

var alpha = 0.1;
var i=0;
var interp;
function translateAlongCurve(){
    drawChaikin();
    renderChaikin();
    
    if(alpha<1 && i+1 < linePoints.length){
        var point1 = linePoints[i];
        var point2 = linePoints[i+1];
        interp = mix(point1,point2,alpha);
        
    }
    else{
        alpha = 0.1;
        i++;
    }
    if(i>=linePoints.length-1)
        i=0;

    translateMatrix = translate(interp[0],interp[1],interp[2]);
    alpha+=0.1 * (1/(chaikinSubdivision+1));
    drawCube();
    renderObjects(wireFrameMode);
    animReq = requestAnimationFrame(translateAlongCurve);
}


// Previous Model matrix location
function renderObjects(wireFrameMode) {

    //gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //renderChaikin();
    //gl.drawArrays(gl.LINE_LOOP,0,lineControlPoints.length);
    // Check if WireFrame Mode
    
    if(wireFrameMode == 1.0){
        for( var i=0; i<index; i+=3)
            gl.drawArrays( gl.LINE_LOOP, i, 3 );
    }
    else{
        for( var i=0; i<index; i+=3)
            gl.drawArrays( gl.TRIANGLES, i, 3 );
    }
    
}



