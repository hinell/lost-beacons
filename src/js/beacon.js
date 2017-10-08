class Beacons extends Objects {}

const REINFORCEMENTS_STRING = 'reinforcements';

class Beacon {

    constructor(config = {}) {
        this.Unit               = config.Unit || config.UnitConsturctor || Unit;
        this.reinforcementsSize = config.reinforcementsSize || 1;


        this.team = config.team || NEUTRAL_TEAM;
        this.conquerRadius = config.conquerRadius || BEACON_CONQUER_RADIUS;
        this.spawnInterval = config.spawnInterval || this.team.reinforcementsInterval;
        
        // Get rid of those if theyre set externally
        this.x = 0;
        this.y = 0;
      
        this.conqueringTeam = null;

        this.enemyTeamOwned = 0;
        this.playerTeamOwned = 0;

        this.nextParticle = 0;
      
        this.nextReinforcements = 0;
      
        this.readyUnits = new Units();
        
        this.indicator = new Indicator(this);
        
    }
    
    cycle(e) {
        let units       = W.units.filter(u => dist(u, this) < this.conquerRadius);
        let playerUnits = units.filter(unit => unit.team === PLAYER_TEAM);
        let enemyUnits  = units.filter(unit => (unit.team === ENEMY_TEAM || unit.team === NEMESIS_TEAM) );
        
        if(!units) { throw new Error('Invalid units assignment: units are undefined') }
        let actualConqueringTeam;
        let isConquering;
        if (enemyUnits.length > playerUnits.length) {
            actualConqueringTeam = enemyUnits[0].team;
            isConquering = this.enemyTeamOwned < 1;
            
        } else if (enemyUnits.length < playerUnits.length) {
            actualConqueringTeam = PLAYER_TEAM;
            isConquering = this.playerTeamOwned < 1;
        }
        
        // render particles
        this.nextParticle -= e;
        if (this.nextParticle < 0 && isConquering) {
            
            this.nextParticle = 0.2;
            // const unit = pick(actualConqueringTeam === PLAYER_TEAM ? playerUnits : enemyUnits);
            const unit = pick(units);
            const t = rand(0.5, 1.5);
            particle(5, actualConqueringTeam.body, [
                ['x', unit.x, this.x, t, 0],
                ['y', unit.y, this.y, t, 0],
                ['s', 0, rand(5, 10), t]
            ], true);
        }
           let playerOwnedSign = 0;
        let enemyOwnedSign  = 0
        
        if (actualConqueringTeam === ENEMY_TEAM || actualConqueringTeam === NEMESIS_TEAM) {
            playerOwnedSign = -1;
            enemyOwnedSign = this.playerTeamOwned > 0 ? 0 : 1;
        } else if (actualConqueringTeam === PLAYER_TEAM) {
            enemyOwnedSign = -1;
            playerOwnedSign = this.enemyTeamOwned > 0 ? 0 : 1;
        } else if (units.length === 0) {
                playerOwnedSign =  this.team === PLAYER_TEAM ?  1 : -1;
                enemyOwnedSign  =  this.team === ENEMY_TEAM || this.team === NEMESIS_TEAM ? 1 :  -1;
            // Otherwise, it means we have a tie, so let's not move ownership at all
        }
        
        const factor = BEACON_CONQUER_SPEED_PER_UNIT * between(1, abs(playerUnits.length - enemyUnits.length), BEACON_MAX_CONQUERING_UNITS);
        
        this.playerTeamOwned  = max(0, min(1, this.playerTeamOwned + playerOwnedSign * factor * e));
        this.enemyTeamOwned   = max(0, min(1, this.enemyTeamOwned + enemyOwnedSign * factor * e));
      
      

    let newOwner;
          if (this.playerTeamOwned === 1) {
              newOwner            = PLAYER_TEAM;
              this.conqueringTeam = playerUnits
          } else if (this.enemyTeamOwned === 1) {
              newOwner            = actualConqueringTeam;
              this.conqueringTeam = enemyUnits;
          } else if (!this.playerTeamOwned && !this.enemyTeamOwned) {
              newOwner = NEUTRAL_TEAM;
          }
          
          
          if (newOwner && newOwner !== this.team) {
              this.oldOwner  = this.team;
              this.team = newOwner;
              // reset timer immediately
              this.nextReinforcements = this.spawnInterval = this.team.reinforcementsInterval;
              this.readyUnits = [] // reset available units
              
              this.conqueredAnimation();
              
              if(this.oldOwner === PLAYER_TEAM) {
                 this.indicator.indicate(this.Unit._name + ' ' + 'factory is lost!', this.oldOwner.beacon, 3);
              }
              
              if (newOwner === PLAYER_TEAM) {
                  let replies = [this.Unit._name + ' factory is our!'].concat(this.conqueringTeam[0].replies)
                  this.indicator.indicate(pick(replies),this.team.beacon, 2);
                  
                  this.conqueringTeam = null
              } else {
                  this.indicator.indicate('beacon is lost', this.oldOwner.beacon);
              }
              
          }
          // stop spawning once the total cap is reached
          if (W.units.filter(unit => unit.team === this.team ).length > W.beacons.filter(b => b.team === this.team).length * G.levelId * 6 ) { return }
          if ((this.nextReinforcements -= e) < 0) {
            for (let i = 0; i < this.reinforcementsSize; i++) {
                this.buildUnit()
            }
            if (this.team === PLAYER_TEAM) {
                this.indicator.indicate(' + ' +this.readyUnits.length + ' ' + (this.Unit._name || 'unit'),PLAYER_TEAM.beacon);
            }
            if (this.team === ENEMY_TEAM )  {
                this.indicator.indicate('enemy reinforcements', this.team.beacon)
            }
            this.nextReinforcements = this.spawnInterval;
         }
    }
    
    buildUnit(){
        const unit = new this.Unit();
        unit.team = this.team;
        this.readyUnits.push(unit);
    }
    
    spawnUnits(){
        let freePositionsAround = W.units.concat(this).allocateCirclePositions(this,UNIT_RADIUS ,this.conquerRadius * 2)
        let freePosAmount = freePositionsAround.length, i = 0;
        
        while(this.readyUnits.length && i <= freePosAmount) {
            
            let unit = this.readyUnits.shift()
            let exists;

            unit.beacon = this;
            unit.x = this.x; // setting up its current location
            unit.y = this.y; //
            // TODO: spawn only if space is available
            unit.setBehavior(this.team.behavior(this,freePositionsAround[i]));
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

            R.fillStyle = this.team.beacon;
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

        R.fillStyle = R.strokeStyle = this.team.beacon;
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
        return this.readyUnits.length > 0 && this.team === PLAYER_TEAM
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
        drawCenteredText(this.Unit._name || REINFORCEMENTS_STRING,this.x,buttonBounds.y,BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE,this.team.beacon,true);
        drawCenteredText(this.reinforcementsSize + ' in ' + formatTime(this.nextReinforcements),this.x, buttonBounds.y + 14,BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE,this.team.beacon,true);
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
    
    postRender() {
        wrap(() => this.indicator.postRender());

        if (this.oldOwner) {
            const buttonBounds = this.reinforcementsButtonBounds();
            
            if (this.team !== PLAYER_TEAM) { this.renderTimer(buttonBounds) }
            else if (this.readyUnits.length === 0    ) { this.renderTimer(buttonBounds) }
            else { this.renderReinforceButton(buttonBounds) }
        }
        // Draw nothing if neutral
        // if (this.team === NEUTRAL_TEAM && !this.oldOwner) {
        //     drawCenteredText('x x x x x x x x', this.x, this.y + BEACON_REINFORCEMENTS_BUTTON_Y, BEACON_REINFORCEMENTS_BUTTON_CELL_SIZE, this.team.beacon, true)
        // }
        
        translate(this.x, this.y);

        const s =  (G.t % BEACON_WAVE_PERIOD) / BEACON_WAVE_PERIOD;
        R.strokeStyle = this.team.beacon;
        R.lineWidth = 2;
        R.globalAlpha = s;
        beginPath();
        arc(0, 0, 80 * (1 - s), 0, PI * 2, true);
        stroke();

        if (DEBUG) {
            fillText(roundP(this.playerTeamOwned, 0.1) + ' - ' + roundP(this.enemyTeamOwned, 0.1), 0, 50);
        }

        const maxOwned = max(this.enemyTeamOwned, this.playerTeamOwned);
        if (maxOwned && maxOwned < 1) {
            R.globalAlpha = 1;
            R.fillStyle = '#000';
            fr(
                -BEACON_GAUGE_WIDTH / 2 - 1,
                -BEACON_GAUGE_RADIUS - 1,
                evaluate(BEACON_GAUGE_WIDTH + 2),
                evaluate(BEACON_GAUGE_HEIGHT + 2)
            );

            R.fillStyle = '#0f0';
            fr(
                -BEACON_GAUGE_WIDTH / 2 * this.playerTeamOwned,
                -BEACON_GAUGE_RADIUS,
                BEACON_GAUGE_WIDTH * this.playerTeamOwned,
                BEACON_GAUGE_HEIGHT
            );

            R.fillStyle = '#f00';
            fr(
                -BEACON_GAUGE_WIDTH / 2 * this.enemyTeamOwned,
                -BEACON_GAUGE_RADIUS,
                BEACON_GAUGE_WIDTH * this.enemyTeamOwned,
                BEACON_GAUGE_HEIGHT
            );
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
            particle(5, this.team.body, [
                ['x', this.x, this.x + cos(angle) * dist, t, 0, easeOutQuad],
                ['y', this.y, this.y + sin(angle) * dist, t, 0, easeOutQuad],
                ['s', rand(5, 10), 0, t]
            ], true);
        }

        const effect = {
            'radius': 0,
            'render': () => {
                const beaconRow = ~~(this.y / GRID_SIZE);
                const beaconCol = ~~(this.x / GRID_SIZE);
                const radiusCells = ceil(effect.radius / GRID_SIZE);

                R.fillStyle = this.team.beacon;
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