CAMERA_SPEED =  800;

class Camera extends Object_ {
    
    constructor() {
        super()
        V = this; // bad practice
    }

    cycle(e) {
        const p = {'x': 0, 'y': 0};
        // control by keyboard
        if (w.down[37] || w.down[65] || w.down[81]) { p.x = -1; }
        if (w.down[39] || w.down[68]) { p.x = 1; }
        if (w.down[38] || w.down[87] || w.down[90]) { p.y = -1; }
        if (w.down[40] || w.down[83]) { p.y = 1; }
        
        
        const xOnMap = (MOUSE_POSITION.x - (CANVAS_WIDTH - G.minimapWidth - MINIMAP_MARGIN)) / G.minimapWidth;
        const yOnMap = (MOUSE_POSITION.y - (CANVAS_HEIGHT - G.minimapHeight - MINIMAP_MARGIN)) / G.minimapHeight;
        if (!xOnMap.isBetween(0, 1) || !yOnMap.isBetween(0, 1)) {
            const xBetween = MOUSE_POSITION.x.isBetween(CURSOR_MOVE_CAMERA_MARGIN, CANVAS_WIDTH - CURSOR_MOVE_CAMERA_MARGIN);
            const yBetween = MOUSE_POSITION.y.isBetween(CURSOR_MOVE_CAMERA_MARGIN, CANVAS_HEIGHT - CURSOR_MOVE_CAMERA_MARGIN);
            if (!xBetween || !yBetween) {
                if (!xBetween) {
                    p.x = MOUSE_POSITION.x > CANVAS_WIDTH / 2 ? 1 : -1;
                }
                if (!yBetween) {
                    p.y = MOUSE_POSITION.y > CANVAS_HEIGHT / 2 ? 1 : -1;
                }
            }
        }

        if (p.x || p.y) {
            const angle = atan2(p.y, p.x);
            this.x += cos(angle) * CAMERA_SPEED * e;
            this.y += sin(angle) * CAMERA_SPEED * e;
        }

        this.x = max(0, min(this.x, W.width - CANVAS_WIDTH));
        this.y = max(0, min(this.y, W.height - CANVAS_HEIGHT));
    }

    get center() {
        return new Object_({
              x : V.x + ~~(CANVAS_WIDTH / 2)
            , y : V.y + ~~(CANVAS_HEIGHT / 2)
        })
    }

    contains(x, y, offsetFromPoint = GRID_SIZE) {
        return x.isBetween(this.x - offsetFromPoint, this.x + CANVAS_WIDTH  + offsetFromPoint)
            && y.isBetween(this.y - offsetFromPoint, this.y + CANVAS_HEIGHT + offsetFromPoint);
    }

}
