class GameplayWorld extends World {

    initialize() {
        G.levelId++;

        const rows = 20 + G.levelId * 10;
        const cols = 20 + G.levelId * 10;

        W.matrix = generate(rows, cols, false);
       
        
        W.symSquad(
            GRID_SIZE * (GRID_EMPTY_PADDING / 2 + GRID_OBSTACLE_PADDING + 2),
            GRID_SIZE * (GRID_EMPTY_PADDING / 2 + GRID_OBSTACLE_PADDING + 2),
            3
        );

        W.symSquad(
            GRID_SIZE * (GRID_EMPTY_PADDING / 2 + GRID_OBSTACLE_PADDING + 5),
            GRID_SIZE * (GRID_EMPTY_PADDING / 2 + GRID_OBSTACLE_PADDING + 2),
            3
        );

        W.symSquad(
            GRID_SIZE * (GRID_EMPTY_PADDING / 2 + GRID_OBSTACLE_PADDING + 8),
            GRID_SIZE * (GRID_EMPTY_PADDING / 2 + GRID_OBSTACLE_PADDING + 2),
            3
        );
        

        // Main central beacon
        
    let centralBeacon                    = window.centralBeacon = new Beacon();
        centralBeacon.Unit               = pick([Killer,Destructor]);
        
        centralBeacon.reinforcementsSize = 10;
        centralBeacon.spawnInterval      = 10;
        centralBeacon.controller         = NEMESIS_TEAM;
        centralBeacon.conquerRadius      = BEACON_CONQUER_RADIUS * 1.5;
        centralBeacon.x = W.center.x;
        centralBeacon.y = W.center.y;
        w.centralBeacon = centralBeacon
        // W.hasObstacleBetween(W.center.x-25,W.center.x+25)
        // W.hasObstacleBetween(W.center.y-25,W.center.y+25)
        W.spawnSquad(centralBeacon,W.createSquad(NEMESIS_TEAM, G.levelId*6,Killer),NEMESIS_TEAM);
        W.centralBeacon = centralBeacon;
        
        let beaconsQntty = (~~(rows * cols * 0.005));
        let beacons = new Beacons([centralBeacon])
        for (let i = 0 ; i < beaconsQntty; i++) {
            let beacon = new Beacon();
                beacon.Unit     = pick([Unit,Beast,Destructor]) || Unit;
                beacon.reinforcementsSize = ~~(rand(0,3));
                beacons.push(beacon);
        }
        
        beacons
            .freeCirclePositions({x:W.center.x,y:W.center.y},BEACON_SPACING_RADIUS,CANVAS_WIDTH,beaconsQntty,BEACON_SPACING_RADIUS)
            .forEach(function (position,i,positions){
                if(beacons[i] === centralBeacon) {W.add(centralBeacon); return}
                let beacon = beacons[i];
                if (position && beacon){
                    beacon.x = position.x;
                    beacon.y = position.y;
                    W.add(beacon);
                }
            });
            
        this.endGameCondition = {cycle: function () {
               
                let playerUnits = W.units.filter(unit => unit.controller === PLAYER_TEAM).length;
                let enemyUnits = W.units.filter(unit => (unit.controller === ENEMY_TEAM || unit.controller === NEMESIS_TEAM )).length;
                
                let playerBeacons = W.beacons.filter(beacon => beacon.controller === PLAYER_TEAM).length;
                let enemyBeacons = W.beacons.filter(beacon => (beacon.controller === ENEMY_TEAM || beacon.controller === NEMESIS_TEAM)).length;

                // End if someone captured all beacons OR if the player is completely dead
                let noPlayerUnitsLeft = !playerUnits;
                let noEnemyUnitsLeft  = !enemyBeacons && !enemyUnits;
                let allBeaconsCaptured = max(enemyBeacons, playerBeacons) === W.beacons.length;
                
                if ((noPlayerUnitsLeft && !playerBeacons) || allBeaconsCaptured || noEnemyUnitsLeft) {
                    W.remove(this.endGameCondition);
                    this.gameOver(!enemyBeacons);
                }
            }.bind(this)
        }
  
        W.add(this.endGameCondition,CYCLABLE);
        
        W.pauseAndAnnounce([
            'sector #' + G.levelId,
            'capture all the beacons to win'
        ]);
        
        this.enableHUDBack = false
        this.miniMapInterval = new Interval(0.1,this.renderMinimap.bind(this))
    }

    pauseAndAnnounce(s, callback) {
        const cyclables = W.cyclables.slice(0);
        W.cyclables = [];
        W.add(new Announcement(s, () => {
            W.cyclables = cyclables;
            if (callback) {
                callback();
            }
        }), RENDERABLE);
    }

    // Spawns squads for each team at opposite sides of the map
    symSquad(x, y, size, Unit) {
      
        let playerSquad = W.createSquad(PLAYER_TEAM,size,Unit);
        let enemySquad  = W.createSquad(ENEMY_TEAM,size,Unit);
            W.spawnSquad({x,y}, playerSquad);
            W.spawnSquad({x: W.width - x,y: W.height - y,enemySquad}, enemySquad);
      
    }
    
    render(t,ctx,c) {
        super.render(t,ctx,c);
        this.renderHUD(t);
        this.miniMapInterval.cycle(t)
    }
    
    gameOver(win) {
        if (win) {
            TimeData.saveTime(G.levelId, W.t);
        }

        // Ugly format, but it saves bytes
        W.add(new Announcement(
            win ?
                ['sector secured'] :
                ['sector lost', 'you have secured ' + (G.levelId - 1) + ' sectors'],
            () => {
                W.animatePolygons(1, 0);
                interp(W, 'flashAlpha', 0, 1, 1, 0.5, 0, () => G.launch(win ? GameplayWorld : MenuWorld));
            }),
            RENDERABLE
        );
    }

}
