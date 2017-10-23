class Game {

    constructor(cfg = {}) {
        this.renderingContext = cfg.renderingContext;
        this.rendered         = cfg.rendered;
        G                     = this;

        G.t = 0;
        G.levelId = 2; // // TODO: BUG, if setting to 1 renders NO space for beacons positioning
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
        this.viewport = new Camera();
        new worldType(this.viewport); // instantiate world
    }
    // main cycle
    cycle(t) {
        this.t += t;
        W.cycle(t);
        G.updateCursor();
        W.render(t,this.renderingContext,this.rendered);
    }

    beaconsScore(controller) {
        return W.beacons.filter(b => b.controller === controller).length;
    }
    

    unitsScore(controller) {
        return W.units.filter(u => u.controller === controller).length;
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
            newCursor = unit.controller === PLAYER_TEAM ? G.healCursor : G.attackCursor;
            newCursor.setTarget(unit);
        } else if (G.selectionCursor.units.length) {
            newCursor = G.reachCursor;
        } else {
            newCursor = G.selectionCursor;
        }

        G.cursor = newCursor;
        G.cursor.move(p);
        
    }

}
