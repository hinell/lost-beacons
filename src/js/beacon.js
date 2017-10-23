class Beacons extends Objects {}

BEACON_CENTER_RADIUS = 15;
BEACON_ARC_RADIUS    = 25;
BEACON_GAUGE_WIDTH   = 50;
BEACON_GAUGE_HEIGHT  = 4;
BEACON_GAUGE_RADIUS  = 30;

BEACON_CENTER_PERIOD          = .8;
BEACON_WAVE_PERIOD            = 1.5;
BEACON_BASE_THICKNESS         = 15;
BEACON_BASE_RADIUS            = 40;
BEACON_CONQUER_RADIUS         = 150;

BEACON_SPACING_RADIUS                         = 500;
BEACON_MAX_CONQUERING_UNITS                   = 6;
BEACON_REINFORCEMENTS_BUTTON_PADDING          = 5;
BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE        = 2;
BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS = 1;
BEACON_REINFORCEMENTS_BUTTON_Y                = 50;

const REINFORCEMENTS_STRING = 'reinforcements';

class Beacon extends Object_ {

    constructor(config = {}) {
        super();
        
        this.Unit               = Unit;
        this.Units              = Units;
        
        // conquer parameters
        this.previousController
        this.controller;
        this.conquerRadius          = BEACON_CONQUER_RADIUS;
        this.maxConquerors          = BEACON_MAX_CONQUERING_UNITS
        this.conquered; this.conqueror;
        this.conqueringUnits        = new this.Units();
        // TODO: add beacon retention factor later
        this.lastConqueringFactor   = 1;
        this.control       = 0;
        this.controlCap    = 1;
        this.nextParticle  = 1;
        
        // timers & cache settings
        this.cacheInterval = 1;
        this.cacheTimer    = 0; // check if any units in range immediately
        
        this.nearbyUnits   = new this.Units();
        this.unitsDetectionRadius = BEACON_SPACING_RADIUS

        // deployment
        this.reinforcementsSize = 1;
        this.readyUnits = new this.Units();
        this.indicator  = new Indicator(this);
        this.nextReinforcements = 0;
        this.spawnInterval      = 4;
      
        // rendering settings
        this.PI2 = Math.PI2;
        this.PI3 = Math.PI3;
        
        Object.assign(this,config)
    }
    
    // Return all visible units
    get units() { return this.nearbyUnits }
    
    cycle(e) {
    if((this.cacheTimer-= e) <= 0){
        this.cacheTimer    = this.cacheInterval
        
        // TODO: Should be replaced by controller fields
        this.allControllerUnits     = W.units.filter(unit => unit.controller === this.controller ).length;
        this.allControllerBeacons   = W.beacons.filter(b => b.controller === this.controller).length;
        
        this.nearbyUnits     = W.units.at(this,this.unitsDetectionRadius)
        this.conqueringUnits = this.nearbyUnits.at(this,this.conquerRadius);
        

        this.conqueringTeams = new Map();
        this.conqueringUnits.forEach(u => {
            let controllerObj = this.conqueringTeams.get(u.controller);
            if(!controllerObj){ this.conqueringTeams.set(u.controller,controllerObj = { controller: u.controller , count: 0, units: [] }) }
                controllerObj.count++;
                controllerObj.units.push(u)
                this.conqueringTeams.set(u.controller,controllerObj);
        });
    }
    // equilibrium if units of conquering teams are equal by health
    let equilibrium = !this.conqueringTeams.size;
    if(this.conqueringTeams.size === 2){
        equilibrium  = this.conqueringTeams.values(true)[0].count === this.conqueringTeams.values(true)[1].count
    } else if (this.conqueringTeams.size > 2) {
        equilibrium = this.conqueringTeams.values()
        .map(controllerObj => controllerObj.units.length )
        .every((n,i,a)=> a[i+1] ? n === a[i+1] : true )
    }
    
    // if quantity of units in the conquering radius is equal
    // then reset this.conqueror
    // and rewind taken score of this.control to the previous state
    if (equilibrium) {
        this.conquered =
        this.conqueror =
        this.conqueringUnits = undefined;
        
        if(!this.controller){
            if (this.control > 0) {
                this.control-= e
            } else {
                this.control = 0;
            }
        }
        else {
            if (this.control <= this.controlCap) {
                this.control+= e
            } else {
                this.control = this.controlCap;
            }
        }
    }
    if(!equilibrium) {

        let conquerorObj = this.conqueringTeams.size === 1
        ? this.conqueringTeams.values(true)[0]
        : this.conqueringTeams
            .values(true)
            .sort((a,b) => b.count - a.count )[0];
      
        // if new conqueror then remember previous to use it later
        this.previousConqueror = this.conqueror

        this.conquered =
        this.conqueror = conquerorObj.controller

        if(!this.controller && this.conqueror !== this.previousConqueror){
            this.control = 0 // reset
        }
        
        let conqueringFactor = conquerorObj.units
              .sort((a,b) => b.conqueringSpeed - a.conqueringSpeed)
              .slice(0,this.maxConquerors)
              .reduce((factor,u) => factor + u.conqueringSpeed,0);
              
          
        // if beacon is free from control then
        if (!this.controller) {
          // retake control of the neutral/non existing owner
          this.control += conqueringFactor * e * 1
          if (this.control >= this.controlCap) {
            this.control              = this.controlCap;
            this.previousController   = this.controller;
            this.controller           = this.conqueror
            this.conqueredAnimation();
            this.nextReinforcements =
            this.spawnInterval  = this.controller.reinforcementsInterval;
            this.readyUnits     = new Units() // reset available units
            this.indicateNewController();
          }
        }
        else if(this.controller !== this.conqueror) {
          // retake control from the enemy otherwise rewinding its score back
          // once zero is reached
          this.control -= conqueringFactor * e * 1
          if (this.control <= 0) {
            this.control            = 0;
            this.previousController = this.controller
            this.controller         = undefined // none is controller currently
            this.conqueredAnimation();
            this.nextReinforcements =
            this.spawnInterval  = 1;
            this.readyUnits     = new Units() // reset available units
            this.indicateNewController();
          }
        }
    }
    
    // stop spawning once the total cap is reached
    if (this.allControllerUnits  > (this.allControllerBeacons + 1)  * G.levelId * 5 ) { return }
    if (this.controller && (this.nextReinforcements -= e) < 0 && this.controller) {
    this.nextReinforcements = this.spawnInterval;
        for (let i = 0; i < this.reinforcementsSize; i++) { this.buildUnit() }
    }
    }
    
    indicateNewController(){
        if(this.previousController === PLAYER_TEAM) {
            this.indicator.indicate('control over ' + this.Unit._name + ' is lost!',this.previousController.beacon,3); }
        if (this.controller === PLAYER_TEAM) {
            let replies = [this.Unit._name + ' factory is our!'].concat(this.nearbyUnits.filter(u => u.controller === this.controller)[0].replies)
            this.indicator.indicate(pick(replies),this.controller.beacon);
        } else {
            this.indicator.indicate('beacon is lost','#fff');
        }
    }
    
    buildUnit(){
        const unit      = this.Unit ? new this.Unit() : new Unit();
        unit.controller = this.controller;
        this.readyUnits.push(unit);
        if (this.controller === PLAYER_TEAM) { this.indicator.indicate(' + ' +this.readyUnits.length + ' ' + (this.Unit._name || 'unit'),this.controller.beacon) }
        if (this.controller === ENEMY_TEAM )  { this.indicator.indicate('enemy reinforcements', this.controller.beacon) }

    }
    
    spawnUnits(){
        let freePositionsAround = this.nearbyUnits
            .concat(this)
            .concat(this.readyUnits)
            .freeCirclePositions(this,this.readyUnits.first.radius, this.conquerRadius * 2)
        let freePosAmount = freePositionsAround.length, i = 0;
        
        while(this.readyUnits.length && i <= freePosAmount) {
            let unit = this.readyUnits.shift()
            
            unit.beacon = this;
            unit.x = this.x; // setting up its current location
            unit.y = this.y; //
            // TODO: spawn only if space is available
            unit.setBehavior(this.controller.behavior(this,freePositionsAround[i]));
            W.add(unit);
            i++
        }
        // this.readyUnits = []
    }
    
    render(e) {
      
        if(DEBUG && this.nearbyUnits.length) {
            R.fillStyle = '#ffffff'
            R.testAlign = 'center'
            R.font = '14px "Calibri Light",system-ui'
            R.fillText('DETECTED UNITS '+this.nearbyUnits.length,this.x - 50, this.y - 20)
        }
        if(this.color){ this.debug(this.color) }
        // circles of the radiuses
        beginPath();
        R.strokeStyle = '#ffffff';
        R.globalAlpha = 0.1
        arc(this.x,this.y,this.conquerRadius,0,2 * PI)
        stroke();
        
        
        beginPath();
        R.strokeStyle = '#ffffff';
        R.globalAlpha = 0.1
        arc(this.x,this.y,this.unitsDetectionRadius,0,2 * PI)
        stroke();
        
        beginPath();
        wrap(() => {
            // draw rectangles around center
            const beaconRow = ~~(this.y / GRID_SIZE);
            const beaconCol = ~~(this.x / GRID_SIZE);
            const radiusCells = ~~(this.conquerRadius / GRID_SIZE);

            R.fillStyle = this.controller ? this.controller.beacon : '#fff';
            R.globalAlpha = 0.05;

            for (let row = beaconRow - radiusCells ; row < beaconRow + radiusCells ; row++) {
                for (let col = beaconCol - radiusCells ; col < beaconCol + radiusCells ; col++) {
                    const center = {
                        'x': (col + 0.5) * GRID_SIZE,
                        'y': (row + 0.5) * GRID_SIZE
                    };
                    const angle = this.angleTo(center);
                    if (
                        this.distanceTo(center) < this.distanceTo({'x': this.x + cos(angle) * this.conquerRadius, 'y': this.y + sin(angle) * this.conquerRadius})
                    ) {
                        fr(center.x - GRID_SIZE / 2, center.y - GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
                    }
                }
            }
        });

        translate(this.x, this.y);

        R.fillStyle = '#000';
        fr(-BEACON_BASE_RADIUS / 2, -BEACON_BASE_THICKNESS / 2, BEACON_BASE_RADIUS, BEACON_BASE_THICKNESS);
        fr(-BEACON_BASE_THICKNESS / 2, -BEACON_BASE_RADIUS / 2, BEACON_BASE_THICKNESS, BEACON_BASE_RADIUS);

        const s = (G.t % BEACON_CENTER_PERIOD) / BEACON_CENTER_PERIOD;
        
        // central circle
        R.fillStyle = R.strokeStyle = this.controller ? this.controller.beacon : '#fff' ;
        beginPath();
        arc(0, 0, BEACON_CENTER_RADIUS * s, 0, PI * 2, true);
        fill();

        R.globalAlpha = 1 - s;
        beginPath();
        arc(0, 0, BEACON_CENTER_RADIUS, 0, PI * 2, true);
        fill();

        // rotating arcs near the center
        R.globalAlpha = 0.5;
        
        if (!this.conquered) {
            let beaconArcRadius = BEACON_ARC_RADIUS + 3;
            let piFract = PI / 3
            
            this.drawArc( -G.t * this.PI2     , BEACON_ARC_RADIUS, piFract);
            this.drawArc( -G.t * this.PI2 + 2,  BEACON_ARC_RADIUS, piFract);
            this.drawArc( -G.t * this.PI2 + 4,  BEACON_ARC_RADIUS, piFract);
            
            
            this.drawArc(  G.t * this.PI2     , beaconArcRadius, piFract);
            this.drawArc(  G.t * this.PI2 + 2,  beaconArcRadius, piFract);
            this.drawArc(  G.t * this.PI2 + 4,  beaconArcRadius, piFract);
            
            }

        

    }

    inMouseOverButton(position) {
        const bounds = this.reinforcementButtonBounds;
        if(!bounds){return}
        return this.readyUnits.length > 0 && this.controller === PLAYER_TEAM
        && position.x.isBetween(bounds.x, bounds.x + bounds.width)
        && position.y.isBetween(bounds.y, bounds.y + bounds.height);
    }

    reinforcementsButtonBounds(text) {
        if(this.buttonBounds){ return this.buttonBounds }
        let width = requiredCells(text) * BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE + (BEACON_REINFORCEMENTS_BUTTON_PADDING + BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS) * 2;
        return this.buttonBounds = {
            'x': this.x - width / 2,
            'y': this.y + BEACON_REINFORCEMENTS_BUTTON_Y,
            'width': width,
            'height': 5 * BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE + (BEACON_REINFORCEMENTS_BUTTON_PADDING + BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS) * 2
        };
    }

    maybeClick(position) {
        if (this.inMouseOverButton(position)) {
            this.spawnUnits();
            this.indicator.clear();
            return true;
        }
    }

    renderTimer () {
        // render time below the beacon
        let color = this.controller ? this.controller.beacon : '#fff';
        let yOffSet = this.y + BEACON_REINFORCEMENTS_BUTTON_Y;
        drawCenteredText(this.Unit._name || REINFORCEMENTS_STRING,this.x,yOffSet,BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE,color,true);
        drawCenteredText(this.reinforcementsSize + ' in ' + formatTime(this.nextReinforcements),this.x, yOffSet + 14,BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE,color,true);
    }
    
    renderReinforceButton(text){
        // Border
        let buttonBounds = this.reinforcementButtonBounds = this.reinforcementsButtonBounds(text);;
        R.fillStyle = this.controller ? this.controller.beacon : '#fff';; // only the player ever needs to click the button
        fr(
            buttonBounds.x,
            buttonBounds.y,
            buttonBounds.width,
            buttonBounds.height
        );
    
        // Bottom part (with reflection)
        R.fillStyle = '#444';
        fr(
            buttonBounds.x + BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS,
            buttonBounds.y + BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS,
            buttonBounds.width - 2 * BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS,
            buttonBounds.height - BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS * 2
        );
    
        // Top part (no reflection)
        R.fillStyle = '#000';
        fr(
            buttonBounds.x + BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS,
            buttonBounds.y + BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS,
            buttonBounds.width - 2 * BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS,
            buttonBounds.height / 2
        );
        
        drawCenteredText(
            text,
            this.x,
            buttonBounds.y + (buttonBounds.height - 5 * BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE) / 2,
            BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE,
            this.controller ? this.controller.beacon : '#fff',
            true
        );
    }
    
    postRender(e) {
        // TODO: attach indicator to the controllers' viewport
        // it has the wrong place
        wrap(() => this.indicator.postRender());
     // render particles

        if (this.controller !== PLAYER_TEAM      ) { this.renderTimer() }
        else if (this.readyUnits.length === 0    ) { this.renderTimer() }
        else {
        let text = this.readyUnits.length + ' ' +(this.Unit._name || REINFORCEMENTS_STRING);
            this.renderReinforceButton(text)
        }
        
        if (this.conquered && this.conqueringUnits.length) {
            this.nextParticle -= e;
            if (this.nextParticle < 0) {
                let units = this.conqueringUnits;
                this.nextParticle = 0.2;
                // const unit = pick(actualConqueringTeam === PLAYER_TEAM ? playerUnits : enemyUnits);
                const unit = pick(units) || units[0];
                const t = rand(0.5, 1.5);
                particle(5,this.conqueror.body,[
                    ['x', unit.x, this.x, t, 0],
                    ['y', unit.y, this.y, t, 0],
                    ['s', 0, rand(5, 10), t]
                ],true);
            }
        }
        // Draw nothing if neutral
        // if (this.controller === NEUTRAL_TEAM && !this.oldOwner) {
        //     drawCenteredText('x x x x x x x x', this.x, this.y + BEACON_REINFORCEMENTS_BUTTON_Y, BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE, this.controller.beacon, true)
        // }
        
        
        translate(this.x, this.y);
        
        if(this.conquered)
        { this.renderWaves(BEACON_WAVE_PERIOD - .5) } else
        { this.renderWaves(BEACON_WAVE_PERIOD) }
        

        // const maxOwned = this.control;
        if (this.conquered) {
        let color = this.controller ? this.controller.beacon : '#fff';
        if(!this.controller) { color = this.conqueror.beacon || '#0f0' }
            R.globalAlpha = 1;
            R.fillStyle = '#000000'; // background of the gauge
            fr(
                -BEACON_GAUGE_WIDTH / 2 - 1,
                -BEACON_GAUGE_RADIUS - 1,
                (BEACON_GAUGE_WIDTH + 2),
                (BEACON_GAUGE_HEIGHT + 2)
            );

            R.fillStyle = color;
            fr(
                -BEACON_GAUGE_WIDTH / 2 * this.control,
                -BEACON_GAUGE_RADIUS,
                BEACON_GAUGE_WIDTH * this.control,
                BEACON_GAUGE_HEIGHT
            );
        }

    }

    drawArc(angle, radius, length) {
        wrap(() => {
            rotate(angle);
            beginPath();
            arc(0, 0, radius, 0, length, false);
            stroke();
        });
    }

    get index() {
        return W.beacons.indexOf(this) + 1;
    }
    
    debug(color){
        R.beginPath()
        R.strokeStyle = color || '#ffffff'
        R.arc(this.x,this.y,this.unitsDetectionRadius+3,0,2 * PI)
        R.stroke()
    }
    
    renderWaves(frequency = 1){
        const s =  (G.t % frequency) / frequency;
        R.strokeStyle = this.controller ? this.controller.beacon : '#fff';
        R.lineWidth = 2;
        R.globalAlpha = 1- s;
        beginPath();
        // arc(0, 0, 80 * (1 - s), 0, PI * 2, true);
        arc(0, 0, this.conquerRadius *  s , 0, PI * 2, true);
        stroke();
    }
    
    conqueredAnimation() {
        for (let i = 0 ; i < 100 ; i++) {
            const angle = rand(0, PI * 2);
            const dist = rand(100, 200);
            const t = rand(0.5, 1.5);
            particle(5,(this.controller && this.controller.body) || '#fff',[
                ['x', this.x, this.x + cos(angle) * dist, t, 0, 'easeOutQuad'],
                ['y', this.y, this.y + sin(angle) * dist, t, 0, 'easeOutQuad'],
                ['s', rand(5, 10), 0, t]
            ],true);
        }

        const effect = {
            x: this.x, y: this.y, // renders only if in sight of users' view
            radius: 0,
            render: () => {
                const beaconRow = ~~(this.y / GRID_SIZE);
                const beaconCol = ~~(this.x / GRID_SIZE);
                const radiusCells = ceil(effect.radius / GRID_SIZE);

                R.fillStyle = this.controller ? this.controller.beacon : "#fff";
                R.globalAlpha = 0.2;

                for (let row = beaconRow - radiusCells ; row < beaconRow + radiusCells ; row++) {
                    for (let col = beaconCol - radiusCells ; col < beaconCol + radiusCells ; col++) {
                        const center = {
                            'x': (col + 0.5) * GRID_SIZE,
                            'y': (row + 0.5) * GRID_SIZE
                        };
                        const angle = this.angleTo(center);
                        if (
                            // dist(this, center) < dist(this, {'x': this.x + cos(angle) * effect.radius, 'y': this.y + sin(angle) * effect.radius})
                            (this.x + cos(angle) * effect.radius).isBetween(center.x - GRID_SIZE / 2, center.x + GRID_SIZE / 2) &&
                            (this.y + sin(angle) * effect.radius).isBetween(center.y - GRID_SIZE / 2, center.y + GRID_SIZE / 2)
                        ) {
                            fr(center.x - GRID_SIZE / 2, center.y - GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
                        }
                    }
                }
            }
        };
        W.add(effect, RENDERABLE);

        interp(effect, 'radius', 0, GRID_SIZE * 10, 1, 0, 'easeOutQuad', () => W.remove(effect));
    }

}