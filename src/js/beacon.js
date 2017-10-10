class Beacons extends Objects {}

BEACON_CENTER_RADIUS = 15;
BEACON_ARC_RADIUS    = 25;
BEACON_GAUGE_WIDTH   = 50;
BEACON_GAUGE_HEIGHT  = 4;
BEACON_GAUGE_RADIUS  = 30;

BEACON_CENTER_PERIOD          = .7;
BEACON_WAVE_PERIOD            = 1;
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

class Beacon {

    constructor(config = {}) {
        this.Unit               = Unit;
        this.Units              = Units;
        this.reinforcementsSize = 1;
        
        this.previousController
        this.controller             = NEUTRAL_TEAM;
        this.conquerRadius          = BEACON_CONQUER_RADIUS;
        this.maxConquerors          = BEACON_MAX_CONQUERING_UNITS
        

        this.lastConqueringFactor = 0.01;
        
        this.conquered; this.conqueror;/* conquering controller, both*/
        this.conqueringUnits = new Units();
      
        this.x = 0;
        this.y = 0;
      
        this.control       = 0;
    // TODO: add beacon retention timer factor in play: longer it has been controlled - longer it take to gain control back
        this.controlCap    = 1;

        this.nextParticle = 1;
        
        this.nextReinforcements = 0;
      
        this.unitsDetectionRadius = config.unitsDetectionRadius || BEACON_SPACING_RADIUS
        this.detectedUnits        = new this.Units();
        this.controllerUnits      = new this.Units(); // in detectable range
        this.foreignUnits         = new this.Units(); // in detectable range
        
        this.cacheInterval = 0.1;
        this.cacheTimer    = 0; // check if any units in range immediately
        
        this.readyUnits = new this.Units();
        this.indicator  = new Indicator(this);
        
    }
    
    cycle(e) {
    // TODO: Rework
    if((this.cacheTimer-= e) <0){
        this.cacheTimer    = this.cacheInterval
        
        // TODO: Should be replaced by controller fields
        this.allControllerUnits     = W.units.filter(unit => unit.team === this.controller ).length;
        this.allControllerBeacons   = W.beacons.filter(b => b.team === this.controller).length;
        
        this.detectedUnits = W.units.at(this,this.unitsDetectionRadius)
        
        let filtered         = this.detectedUnits.filter(u => u.team === this.controller,true)
        this.controllerUnits = filtered[0];
        this.foreignUnits    = filtered[1];
    }
    
    let controllers     = this.controllerUnits.at(this,this.conquerRadius);
    let foreigners      = this.foreignUnits.at(this,this.conquerRadius);
    let conqueringTeams = foreigners.reduce((teams, unit) => {
        teams.indexOf(unit.team) < 0 && teams.push(unit.team);
        
        return teams
    } ,[]);
        if(conqueringTeams.length > 1){ debugger }
    
    let equilibrium    = controllers.length === foreigners.length
        || (controllers.length === 0 && foreigners.length === 0);
        
    let foreignersPrevail  = !equilibrium && foreigners.length > controllers.length || foreigners.totalHealth() > controllers.totalHealth();
    let controllersPrevail = !equilibrium && !foreignersPrevail;
    
    
  
    if (equilibrium || controllersPrevail) {
        this.conquered
        = this.conqueror
        = this.conqueringUnits
        = undefined;
    }
    if (equilibrium) {
        if(!this.controller || this.controller === NEUTRAL_TEAM){
            if (this.control > 0) {
                this.control-= e
            } else {
                this.control = 0;
            }
        }
        else {
            if (this.control <= this.controlCap) {
                this.control+= this.lastConqueringFactor * e
            } else {
                this.control = this.controlCap;
            }
        }
    }
    if (foreignersPrevail) {
        this.defended  = false;
        this.conquered = this.conqueror = foreigners[0].team;
        this.conqueringUnits = foreigners;
        
        let conqueringFactor = this.conqueringUnits
          .sort((a,b) => b.conqueringSpeed - a.conqueringSpeed )
          .slice(0,this.maxConquerors)
          .reduce((factor, u) => factor + u.conqueringSpeed ,0);
          
        if(!this.controller || this.controller === NEUTRAL_TEAM){
            // retaking control of neutral
                this.control+= conqueringFactor * e * .5
                
            if (this.control >= this.controlCap) {
                this.control                = this.controlCap;
                this.previousController     = this.controller;
                this.controller             = this.conqueror
                this.lastConqueringFactor   = conqueringFactor;
                this.conqueredAnimation();
                this.updateSpawnMachine();
                this.indicateNewController();
            }
        }
        else {
            //  retaking control from enemy
                this.control-= this.lastConqueringFactor * e * .5
                
            if (this.control <= 0) {
              this.control                           = 0;
              this.previousController                = this.controller
              this.controller                        = NEUTRAL_TEAM // neutral controller
              // this.controller.reinforcementsInterval = 10;
              this.conqueredAnimation();
              this.updateSpawnMachine();
              this.indicateNewController();
            
            }
        }

    }
    if (controllersPrevail) {
        this.defended = true
        // retaking control from neutral
        if (this.control < this.controlCap) {
            this.control+= this.lastConqueringFactor * e * 3;
        } else {
            this.control = this.controlCap
        }
    }
    
    
    // stop spawning once the total cap is reached
    if (this.allControllerUnits  > (this.allControllerBeacons + 1)  * G.levelId * 6 ) { return }
    if ((this.nextReinforcements -= e) < 0) {
    this.nextReinforcements = this.spawnInterval;
        for (let i = 0; i < this.reinforcementsSize; i++) { this.buildUnit() }
    }
    }
    
    updateSpawnMachine(){
        this.nextReinforcements = this.spawnInterval = this.controller.reinforcementsInterval;
        this.readyUnits = new Units() // reset available units
    }
    
    indicateNewController(){
        if(this.previousController === PLAYER_TEAM) {
            this.indicator.indicate('control over ' + this.Unit._name + ' is lost!',this.previousController.beacon,3); }
        if (this.controller === PLAYER_TEAM) {
            let replies = [this.Unit._name + ' factory is our!'].concat(this.detectedUnits.filter(u => u.team === this.controller)[0].replies)
            this.indicator.indicate(pick(replies),this.controller.beacon,2);
        } else {
            this.indicator.indicate('beacon is lost', this.previousController.beacon);
        }
    }
    
    buildUnit(){
        const unit = this.Unit ? new this.Unit() : new Unit();
        unit.team  = this.controller;
        this.readyUnits.push(unit);
        if (this.controller === PLAYER_TEAM) { this.indicator.indicate(' + ' +this.readyUnits.length + ' ' + (this.Unit._name || 'unit'),PLAYER_TEAM.beacon) }
        if (this.controller === ENEMY_TEAM )  { this.indicator.indicate('enemy reinforcements', this.controller.beacon) }

    }
    
    spawnUnits(){
        let freePositionsAround = W.units.concat(this).freeCirclePositions(this,UNIT_RADIUS ,this.conquerRadius * 2)
        let freePosAmount = freePositionsAround.length, i = 0;
        
        while(this.readyUnits.length && i <= freePosAmount) {
            
            let unit = this.readyUnits.shift()
            
            unit.beacon = this;
            unit.x = this.x; // setting up its current location
            unit.y = this.y; //
            // TODO: spawn only if space is available
            unit.setBehavior(this.controller.behavior(this,freePositionsAround[i]));
            W.add(unit, CYCLABLE | RENDERABLE | UNIT);
            i++
        }
        // this.readyUnits = []
    }
    
    render() {
        wrap(() => {
            const beaconRow = ~~(this.y / GRID_SIZE);
            const beaconCol = ~~(this.x / GRID_SIZE);
            const radiusCells = ~~(this.conquerRadius / GRID_SIZE);

            R.fillStyle = this.controller.beacon;
            R.globalAlpha = 0.05;

            for (let row = beaconRow - radiusCells ; row < beaconRow + radiusCells ; row++) {
                for (let col = beaconCol - radiusCells ; col < beaconCol + radiusCells ; col++) {
                    const center = {
                        'x': (col + 0.5) * GRID_SIZE,
                        'y': (row + 0.5) * GRID_SIZE
                    };
                    const angle = angleBetween(this, center);
                    if (
                        dist(this, center) < dist(this, {'x': this.x + cos(angle) * this.conquerRadius, 'y': this.y + sin(angle) * this.conquerRadius})
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

        R.fillStyle = R.strokeStyle = this.controller.beacon;
        beginPath();
        arc(0, 0, BEACON_CENTER_RADIUS * s, 0, PI * 2, true);
        fill();

        R.globalAlpha = 1 - s;
        beginPath();
        arc(0, 0, BEACON_CENTER_RADIUS, 0, PI * 2, true);
        fill();

        R.globalAlpha = 0.5;

        [
            -G.t * PI * 2,
            -G.t * PI * 2 + PI
        ].forEach(angle => this.drawArc(angle, BEACON_ARC_RADIUS));

        [
            G.t * PI * 3,
            G.t * PI * 3 + PI
        ].forEach(angle => this.drawArc(angle, BEACON_ARC_RADIUS + 2));
    }

    inReinforcementsButton(position) {
        const bounds = this.reinforcementsButtonBounds();
        return this.readyUnits.length > 0 && this.controller === PLAYER_TEAM
        && isBetween(bounds.x, position.x, bounds.x + bounds.width)
        && isBetween(bounds.y, position.y, bounds.y + bounds.height);
    }

    reinforcementsButtonBounds() {
        const width = requiredCells(REINFORCEMENTS_STRING) * BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE + (BEACON_REINFORCEMENTS_BUTTON_PADDING + BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS) * 2;
        return {
            'x': this.x - width / 2,
            'y': this.y + BEACON_REINFORCEMENTS_BUTTON_Y,
            'width': width,
            'height': 5 * BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE + (BEACON_REINFORCEMENTS_BUTTON_PADDING + BEACON_REINFORCEMENTS_BUTTON_BORDER_THICKNESS) * 2
        };
    }

    maybeClick(position) {
        if (this.inReinforcementsButton(position)) {
            this.spawnUnits();
            this.indicator.clear();
            return true;
        }
    }

    renderTimer (buttonBounds) {
        // render time below the beacon
        drawCenteredText(this.Unit._name || REINFORCEMENTS_STRING,this.x,buttonBounds.y,BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE,this.controller.beacon,true);
        drawCenteredText(this.reinforcementsSize + ' in ' + formatTime(this.nextReinforcements),this.x, buttonBounds.y + 14,BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE,this.controller.beacon,true);
    }
    
    renderReinforceButton(buttonBounds){
        // Border
        R.fillStyle = PLAYER_TEAM.beacon; // only the player ever needs to click the button
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
            this.readyUnits.length + ' ' +(this.Unit._name || REINFORCEMENTS_STRING),
            this.x,
            buttonBounds.y + (buttonBounds.height - 5 * BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE) / 2,
            BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE,
            PLAYER_TEAM.beacon,
            true
        );
    }
    
    postRender(e) {
        wrap(() => this.indicator.postRender());
     // render particles
     
        const buttonBounds = this.reinforcementsButtonBounds();
        
        if (this.controller !== PLAYER_TEAM      ) { this.renderTimer(buttonBounds) }
        else if (this.readyUnits.length === 0    ) { this.renderTimer(buttonBounds) }
        else { this.renderReinforceButton(buttonBounds) }
        
        this.nextParticle -= e;
        if (this.nextParticle < 0 && this.conquered) {
            let units = this.detectedUnits.at(this,this.conquerRadius);
            this.nextParticle = 0.2;
            // const unit = pick(actualConqueringTeam === PLAYER_TEAM ? playerUnits : enemyUnits);
            const unit = pick(units) || units[0];
            const t = rand(0.5, 1.5);
            particle(5,this.conquered.body,[
                ['x', unit.x, this.x, t, 0],
                ['y', unit.y, this.y, t, 0],
                ['s', 0, rand(5, 10), t]
            ],true);
        }
        
        if (this.conquered) {
            // Draw nothing if neutral
            // if (this.controller === NEUTRAL_TEAM && !this.oldOwner) {
            //     drawCenteredText('x x x x x x x x', this.x, this.y + BEACON_REINFORCEMENTS_BUTTON_Y, BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE, this.controller.beacon, true)
            // }
            
            translate(this.x, this.y);
    
            const s =  (G.t % BEACON_WAVE_PERIOD) / BEACON_WAVE_PERIOD;
            R.strokeStyle = this.controller.beacon;
            R.lineWidth = 2;
            R.globalAlpha = s;
            beginPath();
            arc(0, 0, 80 * (1 - s), 0, PI * 2, true);
            stroke();
            
            let color = '#f00';
            if(this.controller !== PLAYER_TEAM && this.conqueror === PLAYER_TEAM) { color = '#0f0' }
    
            const maxOwned = this.control;
            if (maxOwned >= 0 && maxOwned < this.controlCap) {
                R.globalAlpha = 1;
                R.fillStyle = '#000';
                fr(
                    -BEACON_GAUGE_WIDTH / 2 - 1,
                    -BEACON_GAUGE_RADIUS - 1,
                    evaluate(BEACON_GAUGE_WIDTH + 2),
                    evaluate(BEACON_GAUGE_HEIGHT + 2)
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
    }

    drawArc(angle, radius) {
        wrap(() => {
            rotate(angle);

            beginPath();
            arc(0, 0, radius, 0, PI / 3, false);
            stroke();
        });
    }

    get index() {
        return W.beacons.indexOf(this) + 1;
    }

    conqueredAnimation() {
        for (let i = 0 ; i < 100 ; i++) {
            const angle = rand(0, PI * 2);
            const dist = rand(100, 200);
            const t = rand(0.5, 1.5);
            particle(5,(this.controller && this.controller.body) || '#fff',[
                ['x', this.x, this.x + cos(angle) * dist, t, 0, easeOutQuad],
                ['y', this.y, this.y + sin(angle) * dist, t, 0, easeOutQuad],
                ['s', rand(5, 10), 0, t]
            ],true);
        }

        const effect = {
            'radius': 0,
            'render': () => {
                const beaconRow = ~~(this.y / GRID_SIZE);
                const beaconCol = ~~(this.x / GRID_SIZE);
                const radiusCells = ceil(effect.radius / GRID_SIZE);

                R.fillStyle = this.controller.beacon;
                R.globalAlpha = 0.2;

                for (let row = beaconRow - radiusCells ; row < beaconRow + radiusCells ; row++) {
                    for (let col = beaconCol - radiusCells ; col < beaconCol + radiusCells ; col++) {
                        const center = {
                            'x': (col + 0.5) * GRID_SIZE,
                            'y': (row + 0.5) * GRID_SIZE
                        };
                        const angle = angleBetween(this, center);
                        if (
                            // dist(this, center) < dist(this, {'x': this.x + cos(angle) * effect.radius, 'y': this.y + sin(angle) * effect.radius})
                            isBetween(center.x - GRID_SIZE / 2, this.x + cos(angle) * effect.radius, center.x + GRID_SIZE / 2) &&
                            isBetween(center.y - GRID_SIZE / 2, this.y + sin(angle) * effect.radius, center.y + GRID_SIZE / 2)
                        ) {
                            fr(center.x - GRID_SIZE / 2, center.y - GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
                        }
                    }
                }
            }
        };
        W.add(effect, RENDERABLE);

        interp(effect, 'radius', 0, GRID_SIZE * 10, 1, 0, easeOutQuad, () => W.remove(effect));
    }

}