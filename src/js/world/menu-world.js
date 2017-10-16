class MenuWorld extends World {

    initialize() {
        W.matrix = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1 ,1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1 ,1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1 ,1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];

    let beacon = new Beacon();
        beacon.x = V.center.x-25;
        beacon.y = V.center.y + 100;
        beacon.controller = NEUTRAL_TEAM;
        beacon.control = 0;
    // beacon.indicator.postRender = () => 0;
      
        W.spawnSquad(beacon ,W.createSquad(NEMESIS_TEAM,3,Unit)   );
        // W.spawnSquad({x: beacon.x - 60, y: beacon.y} ,W.createSquad(NEMESIS_TEAM,7,Beast)   );
        // W.spawnSquad({x: beacon.x + 60, y: beacon.y} ,W.createSquad(NEMESIS_TEAM,7,Unit )   );
        

        W.add(beacon);
        // checking if need to start a new game
        const endGameChecker = {
            'cycle': () => {
                if (beacon.controller === PLAYER_TEAM) {
                    this.launch();
                    W.remove(endGameChecker);
                }
            }
        };
       W.add(endGameChecker, CYCLABLE);
       W.add({
        cycle: function (){
            // make camera still
            V.x = (W.width - CANVAS_WIDTH) / 2;
            V.y = (W.height - CANVAS_HEIGHT) / 2;
            
        }},true)
        
    let bcn1                    = new Beacon();
        bcn1.previousController = true;
        bcn1.control            = 1;
        bcn1.controller         = PLAYER_TEAM;
        bcn1.Unit               = Destructor;
        bcn1.spawnInterval      = 10;
        bcn1.x = V.center.x - 450;
        bcn1.y = V.center.y + 100;
        
    let bcn2                    = new Beacon();
        bcn2.previousController = true;
        bcn2.control            = 0;
        bcn2.controller         = PLAYER_TEAM;
        bcn2.Unit               = Killer
        bcn2.spawnInterval      = 10;
        bcn2.x = V.center.x + 400;
        bcn2.y = V.center.y + 100;
        
      
    let units = w.units = [
          W.createSquad(PLAYER_TEAM,5,Unit)
        , W.createSquad(PLAYER_TEAM,5,Unit)
        , W.createSquad(PLAYER_TEAM,5,Unit)
        , W.createSquad(PLAYER_TEAM,5,Unit)
        ].reduce((arr,c) => arr.concat(c));
        
    let units2 = (4).range().map(n => W.createSquad(PLAYER_TEAM,5,Killer)).reduce((arr,c) => arr.concat(c));
        
        units.forEach(u => u.setBehavior(new Idle()) )
        units = new Units(units);
        
    let positions = units.freeRectanglePositions(bcn1,units[0].radius)
        positions.forEach(function (pos,i,arr){
            if(!units[i]) {return}
            units[i].x = pos.x || 300
            units[i].y = pos.y || 300
        })

        // units.forEach(W.add)
        bcn1.readyUnits = units
        bcn2.readyUnits = units2
        W.add(bcn1);
        W.add(bcn2);

        // let weakUnit        = new Unit();
        //     weakUnit.health = 0.1;
        //     weakUnit.x      = V.center.x - 500
        //     weakUnit.y      = V.center.y + 200
        //     weakUnit.team   = PLAYER_TEAM
        // W.add(weakUnit);
        
      
        interp(W, 'textAlpha', 0, 1, 0.5, 0.8);

        // selection prompt
        let UnitOnMap = false && W.units.at({x: V.center.x - 150, y: V.center.y - 100},150)[0];
        UnitOnMap && W.add({
            cycle: () => {
                if (!G.selectionCursor.selection.length && !G.selectionCursor.downPosition) {
                    if (!W.selectHint) {
                        W.selectHint = new SelectHelp(() => {
                            W.remove(W.selectHint);
                            W.selectHint = null;
                        });

                        W.selectHint.x = UnitOnMap.x - SELECT_HELP_SIZE / 2;
                        W.selectHint.y = UnitOnMap.y - SELECT_HELP_SIZE / 2;
                        W.add(W.selectHint, RENDERABLE)
                    }
                } else {
                    W.remove(W.selectHint);
                }
            }
        }, CYCLABLE);
    }

    render(e) {
        super.render(e);

        wrap(() => {
            R.globalAlpha = W.textAlpha;
            
            drawCenteredText('lost beacons II', CANVAS_WIDTH / 2, 140, 16 ,'#c63600',true);
            drawCenteredText('tactical territory control', CANVAS_WIDTH / 2, 150 + 16 * 7, 5, '#fff', true);

            let s;
            if (!G.selectionCursor.selection.length) {
                s = 'click left     to select units';
                G.reachCursor.sentUnits = false;
                fakeMouse(555, 850 + 5 * 5 / 2, LEFT_CLICK,e);
            } else if (!G.reachCursor.sentUnits) {
                s = 'click right     to send units';
                fakeMouse(555 + 25, 850 + 5 * 5 / 2, RIGHT_CLICK,e);
            } else {
                s = 'capture the beacon to start';
            }
            drawCenteredText(s, CANVAS_WIDTH / 2, 850, 5, '#fff', true);

            const labels = ['--- best times ---'];
            let i = 0;
            while (true) {
                const time = TimeData.timeForLevelIndex(++i);
                if (!time) {
                    break;
                }
                labels.unshift('sector #' + zeroes(i) + ' - ' + formatTime(time));
            }

            if (i > 1) {
                labels.forEach((label, i) => {
                    drawText(label, 10, CANVAS_HEIGHT - (i + 1) * 7 * 2, 2, '#fff', true);
                });
            }
            
            drawCenteredText('wasd/arrows: move the camera  -  left click: select units  -  right click: send units', CANVAS_WIDTH / 2, 10, 2, '#888');
        });
    }

    launch() {
        interp(W, 'textAlpha', 1, 0, 0.5, 0, 0, () => {
            delayed(() => W.animatePolygons(1, 0), 500);
            interp(W, 'flashAlpha', 0, 1, 1, 0.5, 0, () => G.launch(GameplayWorld));
        });
    }

}
