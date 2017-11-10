let MOUSE_POSITION = {
    'x': 0,
    'y': 0
};

let draggingMinimap = false;

function eventCoords(e) {
    let r = C.getBoundingClientRect();
    return {
        'x': CANVAS_WIDTH * (e.pageX - r.left) / r.width,
        'y': CANVAS_HEIGHT * (e.pageY - r.top) / r.height
    };
}

function followMinimap(xOnMap,yOnMap) {
    xOnMap = xOnMap || (MOUSE_POSITION.x - (CANVAS_WIDTH - G.minimapWidth - MINIMAP_MARGIN)) / G.minimapWidth;
    yOnMap = yOnMap || (MOUSE_POSITION.y - (CANVAS_HEIGHT - G.minimapHeight - MINIMAP_MARGIN)) / G.minimapHeight;

    if (xOnMap.isBetween(0, 1) && yOnMap.isBetween(0, 1)) {
        V.x = (xOnMap * W.width) - CANVAS_WIDTH / 2;
        V.y = (yOnMap * W.height) - CANVAS_HEIGHT / 2;
    }
}

onmousedown = e => {
  MOUSE_POSITION = eventCoords(e);
// Assuming the minimap is a square
  const xOnMap = (MOUSE_POSITION.x - (CANVAS_WIDTH - G.minimapWidth - MINIMAP_MARGIN )) / G.minimapWidth;
  const yOnMap = (MOUSE_POSITION.y - (CANVAS_HEIGHT - G.minimapHeight - MINIMAP_MARGIN)) / G.minimapHeight;
  if (e.button === 0
    && xOnMap > 0 && xOnMap < 1
    && yOnMap > 0 && yOnMap < 1
    ) {
    // TODO: Minimap Dragging should be done by mini map itself
    draggingMinimap = true;
    followMinimap(xOnMap,yOnMap);
    return;
  }
  const position = {
    'x': MOUSE_POSITION.x + V.x,
    'y': MOUSE_POSITION.y + V.y
    };
  if (!W.beacons.some(b => b.maybeClick(position))) {
    e.button === 0 && G.cursor.down(position,e);
    e.button === 1 && G.cursor.wheelDown(position,e);
    e.button === 2 && G.cursor.rightDown(position,e);
    }
};
onmousemove = e => {
  MOUSE_POSITION = eventCoords(e);
  if (draggingMinimap) {
    followMinimap();
    return;
  }
  let inactiveMargine         = 5;
  G.viewport.cursorInViewport =
       (e.offsetX > inactiveMargine && e.offsetX < innerWidth - inactiveMargine)
    && (e.offsetY > inactiveMargine && e.offsetY < innerHeight - inactiveMargine);
  G.cursor.move({
                  'x': MOUSE_POSITION.x + V.x,
                  'y': MOUSE_POSITION.y + V.y
                });
};
onmouseup = () => {
  draggingMinimap = false;
  if (G.cursor.downPosition) {
    G.cursor.up({
                  'x': MOUSE_POSITION.x + V.x,
                  'y': MOUSE_POSITION.y + V.y
                });
  }
};
oncontextmenu = e => {
  e.preventDefault();
};
