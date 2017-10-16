function rise(x,y,segment, z, renderCondition) {
    return new Polygon(x,y,[
        {'x': segment[0].x, 'y': segment[0].y, 'z': z},
        {'x': segment[1].x, 'y': segment[1].y, 'z': z},
        {'x': segment[1].x, 'y': segment[1].y, 'z': z + GRID_SIZE},
        {'x': segment[0].x, 'y': segment[0].y, 'z': z + GRID_SIZE}
    ], renderCondition);
}

function cube(x, y, w, h, z) {
    let roofZ = z + GRID_SIZE
    return [
        // Roof
        new Polygon(x,y,[
            { x: x    , y: y,     z: roofZ }, // left above
            { x: x    , y: y + h, z: roofZ }, // left below
            { x: x + w, y: y + h, z: roofZ }, // right below
            { x: x + w, y: y,     z: roofZ }, // right above
        ], function() {
            return true;
        }),

        // Top side
        rise(x,y,[
            {'x': x, 'y': y},
            {'x': x + w, 'y': y}
        ], z, function(c) {
            return c.y < y;
        }),

        // Bottom side
        rise(x,y,[
            {'x': x, 'y': y + h},
            {'x': x + w, 'y': y + h}
        ], z, function(c) {
            return c.y > y + h;
        }),

        // Left side
        rise(x,y,[
            {'x': x, 'y': y},
            {'x': x, 'y': y + h}
        ], z, function(c) {
            return c.x < x;
        }),

        // Right side
        rise(x,y,[
            {'x': x + w, 'y': y},
            {'x': x + w, 'y': y + h}
        ], z, function(c) {
            return c.x > x + w;
        }),
    ];
}
