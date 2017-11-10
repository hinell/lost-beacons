class Game {

    constructor(cfg = {}) {
        this.renderingContext = cfg.renderingContext;
        this.canvas           = cfg.canvas;
        G                     = this;
        // Initialize cursors
        G.cursor =
        G.selectionCursor = new SelectionCursor(this.canvas);
        G.attackCursor    = new AttackCursor(this.canvas);
        G.reachCursor     = new ReachCursor(this.canvas);
        G.healCursor      = new HealCursor(this.canvas);
        this.viewport     = new Camera();
        this.viewport.contacts = document.getElementById('contacts');
        G.t = 0;
        G.levelId = 2; // // TODO: BUG, if setting to 1 renders NO space for beacons positioning
        G.MINIMAP_SCALE = MINIMAP_SCALE;
        MINIMAP_SCALE   = G.MINIMAP_SCALE + (.01 / (1 + Math.pow(1.5,(-6 + G.levelId))) )
        G.launch(MenuWorld); // creates the world
        // G.launch(GameplayWorld); // creates the world
        // G.launch(TestWorld); // creates the world
        // G.mainAudio = new Audio('E:\\Backup\\music\\SoundCloud\\2017\\Galactic Neighborhood SEPTEMBER. 2017\\DesuExSounds - Ad astra per alas fideles.m4a')
        // G.mainAudio.play()
        
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
        this.world = new worldType(this.viewport); // instantiate world
        this.viewport.contacts.style.display = this.world instanceof MenuWorld ? '' : 'none'
    }
    // main cycle
    cycle(t) {
        this.t += t;
        W.cycle(t);
        G.updateCursor();
        W.render(t,this.renderingContext,this.canvas);
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
        // TODO: Optimize
        const unit = W.units.filter(unit => {
            return p.distanceTo(unit) < unit.radius;
        }).sortByClosestTo(p)[0];

        let newCursor;

        if (G.cursor === G.selectionCursor && G.selectionCursor.downPosition || !G.selectionCursor.units.length) {
            newCursor = G.selectionCursor;
        } else if (unit && (G.selectionCursor.units.length > 1 || G.selectionCursor.units[0] !== unit)) {
            newCursor = unit.controller instanceof Human ? G.healCursor : G.attackCursor;
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
