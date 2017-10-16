class Game {

    constructor() {
        G = this;

        G.t = 0;
        G.levelId = 1;
        G.MINIMAP_SCALE = MINIMAP_SCALE;
        MINIMAP_SCALE   = G.MINIMAP_SCALE + (.01 / (1 + Math.pow(1.5,(-6 + G.levelId))) )
        // G.launch(GameplayWorld); // creates the world
        G.launch(MenuWorld); // creates the world

        // Initialize cursors
        G.cursor =
        G.selectionCursor = new SelectionCursor();
        G.attackCursor    = new AttackCursor();
        G.reachCursor     = new ReachCursor();
        G.healCursor      = new HealCursor();
        
        // Main loop, starting point, entry point
        let pts = 0; // previous timestamp
        let frame = (ts) => {
            let e = (ts - pts) / 1000;
                e = ~~(e*10000)/10000;
                pts = ts;   // assign current timestamp
                G.cycle(e); // Main game loop
                
                // setTimeout(function (){ requestAnimationnFrame(frame); },10)
                requestAnimationFrame(frame)
            if(DEBUG){ G.fps = ~~(1 / e); }
            };
            frame();
    }

    launch(worldType) {
        new Camera();
        new worldType(); // instantiate world
      
        // Add a proxy object that will call render on the current cursor
        W.add({
            // No cursor implements render()
            // 'render': () => G.cursor.render(),

            // Not post rendering the cursor if hovering a reinforcements button
            'postRender': () => C.style['cursor'] == 'default' && G.cursor.postRender()
        }, RENDERABLE);
    }
    // main cycle
    cycle(e) {
        G.t += e;
        W.cycle(e);
        G.updateCursor();
        W.render(e);
    }

    beaconsScore(controller) {
        return W.beacons.filter(b => b.controller === controller).length;
    }
    

    unitsScore(controller) {
        return W.units.filter(u => u.team === controller).length;
    }

    get minimapWidth() {return MINIMAP_SCALE * W.width;}
    
    get minimapHeight() {return MINIMAP_SCALE * W.height;}

    updateCursor() {
    let p = {
            'x': MOUSE_POSITION.x + V.x,
            'y': MOUSE_POSITION.y + V.y
        };
        p = new Object_(p);

        // Reset cursor
        const unit = W.units.filter(unit => {
            return p.distanceTo(unit) < unit.radius;
        }).closestTo(p)[0];

        let newCursor;

        if (G.cursor === G.selectionCursor && G.selectionCursor.downPosition || !G.selectionCursor.units.length) {
            newCursor = G.selectionCursor;
        } else if (unit && (G.selectionCursor.units.length > 1 || G.selectionCursor.units[0] !== unit)) {
            newCursor = unit.team === PLAYER_TEAM ? G.healCursor : G.attackCursor;
            newCursor.setTarget(unit);
        } else if (G.selectionCursor.units.length) {
            newCursor = G.reachCursor;
        } else {
            newCursor = G.selectionCursor;
        }

        G.cursor = newCursor;
        G.cursor.move(p);

        C.style['cursor'] = W.beacons.filter(beacon => beacon.inReinforcementsButton(G.cursor)).length ? 'pointer' : 'default';
    }

}
