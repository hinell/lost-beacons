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

    this.controllers = [
            this.human   = new Human()
        ,   this.nemesis = new Nemesis()
    ]
    let beacon = new Beacon();
        beacon.x = W.center.x-25;
        beacon.y = W.center.y + 100;
        beacon.control = 0;
    // beacon.indicator.postRender = () => 0;
      
        W.spawnSquad(beacon ,3..range().map(n => {
            n = new Unit()
            this.nemesis.control(n);
            return n
        }));
        W.add(beacon);
        
    let units = 50..range().map(n => {
            this.human.control(n = new Unit())
            return n
        })
        w.units = units = new Units(units);
        units.forEach(u => u.setBehavior(new Idle()) );
    
    let leftUnits     = units.slice(0,units.length/2);
    let leftPosition  = {x: W.center.x - 450, y: W.center.y + 100};
    let leftPositions = leftUnits.freeCirclePositions(leftPosition,units.first.radius);
        leftUnits.forEach(function (unit,i){
            let position = leftPositions[i];
            if(!position) {return}
            unit.x = position.x || 300
            unit.y = position.y || 300
        });

    let rightUnits     = units.slice(units.length/2);
    let rightPosition  = {x: W.center.x + 400, y: W.center.y + 100};
    let rightPositions = rightUnits.freeCirclePositions(rightPosition,units.first.radius);
        rightUnits.forEach(function (unit,i){
            let position = rightPositions[i];
            if(!position) {return}
            unit.angle = Math.PI;
            unit.x = position.x || 300
            unit.y = position.y || 300
        });
        
        units.forEach(this.add,this);
      
        interp(W, 'textAlpha', 0, 1, 0.5, 0.8);

        // selection prompt
        this.add(new CursorHelp(
            () => pick([leftUnits.first,rightUnits.first])
          , () => G.selectionCursor.units.length || G.selectionCursor.downPosition
          , G.canvas
          , G.cursor.pointer
          )
        );
      
        // checking if need to start a new game
        const endGameChecker = {
            'cycle': () => {
                if (beacon.controller === this.human) {
                    this.launch();
                    W.remove(endGameChecker);
                }
            }
        };
       W.add(endGameChecker, CYCLABLE);
       W.add({
        cycle: function (){
            // make camera still
            V.x = (W.width - CANVAS_WIDTH  ) / 2;
            V.y = (W.height - CANVAS_HEIGHT) / 2;
            
        }},true)
    }
    
    render(t,ctx,c) {
        super.render(t,ctx,c);
        wrap(() => {
            R.globalAlpha = W.textAlpha;
            
            drawCenteredText('lost beacons II', CANVAS_WIDTH / 2, 140, 16 ,'#c63600',true);
            drawCenteredText('tactical territory control', CANVAS_WIDTH / 2, 150 + 16 * 7, 5, '#fff', true);

            let s;
            if (!G.selectionCursor.selection.length) {
                s = 'click left     to select units';
                G.reachCursor.sentUnits = false;
                fakeMouse(655, 850 + 5 * 5 / 2, LEFT_CLICK,t);
            } else if (!G.reachCursor.sentUnits) {
                s = 'click right     to send units';
                fakeMouse(655 + 25, 850 + 5 * 5 / 2, RIGHT_CLICK,t);
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
