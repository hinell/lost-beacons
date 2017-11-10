MINIMAP_SCALE =  0.05;
MINIMAP_MARGIN =  20;

HUD_SCORE_CELL_SIZE =  2;
HUD_GAUGE_GAP =  80;
HUD_HEIGHT =  50;
function copyMap(map) {
    return map.map(row => row.slice());
}

class World {

    constructor() {
        W = this;

        W.t = 0;
        W.cyclables = new Objects(); // all objects on the map
        W.units   = new Units();
        W.beacons = new Beacons();
        W.renderables = new Objects(); // renderable objects

        W.initialize();
        W.volumes = new Objects();
        
        let hsl = (a,s = 0,l = 0) => `hsl(${a[0]},${a[1] + s}%,${a[2] + l}%)`;
        this.mapThemes = [
                [10 , 50, 20]
              , [15 , 50, 20]
              , [20 , 50, 20]
              , [40 , 50, 20]
              , [50 , 50, 20]
              , [100, 40, 17]
              , [105, 40, 17]
              , [132, 40, 17]
              , [159, 50, 20]
              , [177, 40, 20]
              , [195, 50, 20]
              , [200, 50, 20]
              , [205, 50, 20]
              , [210, 50, 20]
              , [220, 50, 20]
              , [270, 40, 20]
              , [340, 50, 17]
            ]
            
        this.theme = [rand(0,360),pick([40,50]),pick([17,20])]
        this.color = hsl(this.theme);
        this.secondColor  = hsl(this.theme,0,2)
        this.stroke = hsl(this.theme,0,20) || GRID_COLOR;

        // TODO maybe use reduce?
        let cubeObj;
        W.map = W.matrix.forEach((r, row) => {
            r.forEach((e, col) => {
                for (let i = 0 ; i < e ; i++) {
                     cubeObj = cube(
                        col * GRID_SIZE // x
                      , row * GRID_SIZE // y
                      , GRID_SIZE // width
                      , GRID_SIZE // height
                      , GRID_SIZE * i  // vertical position on z axis
                      ).map( (polygon) => {
                        polygon.color = this.secondColor;
                        polygon.stroke = this.stroke;
                        return polygon
                      })

                    W.volumes.push(cubeObj);
                }
            });
        });
        
        W.polygons = new Objects();
        W.volumes.forEach(v => v.forEach(p => W.polygons.push(p)));

        const polygonCountByHash = {};
        W.polygons.forEach(polygon => {
            const hash = polygon.hash();
            polygonCountByHash[hash] = (polygonCountByHash[hash] || 0) + 1;
        });

        W.polygons = W.polygons.filter(polygon => {
            return polygonCountByHash[polygon.hash()] == 1;
        });

        // heavy rendered when used too many polygons
        W.animatePolygons(0, 1);
        this.flashAlpha = 1;
        interp(W, 'flashAlpha', 1, 0, 1);
        
                // Generates grid for map
        W.floorPattern = new Canvas().render(GRID_SIZE * 5, GRID_SIZE * 5, (r, c) => {
            r.fillStyle = this.color;
            r.fr(0, 0, c.width, c.height);

            r.globalAlpha = 0.05;
            r.fillStyle = stroke || '#ffffff';
            for (let x = 0 ; x < c.width ; x += GRID_SIZE / 2) {
                r.fr(0, x, c.width, 1);
                r.fr(x, 0, 1, c.height);
            }

            r.globalAlpha = 0.5;
            r.fillStyle = stroke || '#fff';
            r.shadowColor = 'rgba(255,255,255, 0.2)';
            r.shadowBlur = 3;
            for (let x = 0 ; x < c.width ; x += GRID_SIZE) {
                r.fr(0, x, c.width, 1);
                r.fr(x, 0, 1, c.height);
            }

            r.shadowBlur = 0;

            // + signs
            r.globalAlpha = 0.5;
            r.fillStyle = '#ffffff';
            r.fr(GRID_SIZE, GRID_SIZE - 7, 1, 14);
            r.fr(GRID_SIZE - 7, GRID_SIZE, 14, 1);
            
            r.globalAlpha = 0.02;
            r.fr(GRID_SIZE * 3, GRID_SIZE * 4, GRID_SIZE, GRID_SIZE);
            r.fr(GRID_SIZE * 4, GRID_SIZE * 2, GRID_SIZE, GRID_SIZE);
            r.fr(GRID_SIZE * 1, GRID_SIZE * 3, GRID_SIZE, GRID_SIZE);
        let pattern = r.createPattern(c, 'repeat');
            pattern.canvas = c;
            return pattern;
        });
        
        this.gridPattern = new Canvas().render(1, 4, (r, c) => {
            r.fillStyle = 'rgba(0,0,0,.2)';
            r.fr(0, 0, 1, 1);
            return r.createPattern(c, 'repeat');
        });

        this.hudGradient = R.createLinearGradient(0, 0, 0, HUD_HEIGHT);
        this.hudGradient.addColorStop(0, 'rgba(0,0,0,0)');
        this.hudGradient.addColorStop(1, 'rgba(0,0,0,0.5)');

        this.hudBg = R.createLinearGradient(0, 0, 0, HUD_HEIGHT);
        this.hudBg.addColorStop(0, W.stroke || '#035');
        this.hudBg.addColorStop(1, W.color || '#146');
    }
    
    // Creates a squad of the specified size at the specified position
    
    spawnSquad(position, units, controller){
        W.units
        .freeCirclePositions(position,units[0].radius, units[0].radius * 5,units.length)
        // .allocateRectanglePositions({x: x, y: y},~~(units.length * .4),~~(units.length * .6), units[0].radius * 2)
        .forEach((position,i,arr) => {
        let unit;
          if(!(unit = units[i])) { return };
          unit.x = position.x;
          unit.y = position.y;
          unit.setBehavior((controller || unit.controller).behaviour(position)); // set default unit behaviour
          W.add(unit, UNIT | CYCLABLE | RENDERABLE)
        })
    }
    
    createSquad(team,size,UnitConstructor = Unit) {
      
      let units = new Units()
      for (let i = 0; i < size; i++) {
        let unit            = new UnitConstructor({controller: team});
            unit.controller = team
            units.surcol    = units;
            units.push(unit)
      }
      return units
 
    }
    
    positionBeacons(beacons,width,height) {

        // position the beacon randomly
        //if(beacons.length === 1) {
        //    beacon.x = roundP(rand() *( W.width  - beacon.conquerRadius * 2),GRID_SIZE);
        //    beacon.y = roundP(rand() *( W.height - beacon.conquerRadius * 2),GRID_SIZE);
        //    return beacons.push(beacon);
        //}
            width   = width || W.width;
            height  = height|| W.height;
      
        let minDistance = BEACON_SPACING_RADIUS
        let maxDistance = minDistance + GRID_SIZE
        
        let distBetweenTwoBeacons, noObstacle, farFromOthers;
        let i = 1000 * 10;
        beacons.forEach(function (beacon){
            while(true) {
              beacon.x = ~~(random() * (width  - BEACON_SPACING_RADIUS));
              beacon.y = ~~(random() * (height - BEACON_SPACING_RADIUS));
              
              noObstacle    = !W.hasObstacle(beacon.x,beacon.y, 2);
              farFromOthers = beacons.every(b => {
                distBetweenTwoBeacons = b.distanceTo(beacon);
                return  distBetweenTwoBeacons <= maxDistance || distBetweenTwoBeacons >= minDistance
              });
              
              if(farFromOthers && noObstacle) { W.add(beacon); break }
              if (!beacons.filter(u => u.distanceTo(beacon) < BEACON_SPACING_RADIUS).length) {
              break;
              }
            }
        })

    }
    
    // TODO: Create separate Class MiniMap
    renderMinimap() {
        wrap(() => {
            translate(
                CANVAS_WIDTH    - W.width   * MINIMAP_SCALE - MINIMAP_MARGIN
            ,   CANVAS_HEIGHT   - W.height  * MINIMAP_SCALE - MINIMAP_MARGIN
            );
            
            // obstacles
            R.fillStyle = '#bebebe';
            R.globalAlpha = 1;
            // 4ms
            let row, r, col, x;
            for (row = 0; row < W.matrix.length; row++) {
                r = W.matrix[row];
                for (col = 0; col < r.length; col++) {
                  x = r[col];
                  if(x){
                        fr(
                            round(col * GRID_SIZE * MINIMAP_SCALE),
                            round(row * GRID_SIZE * MINIMAP_SCALE),
                            round(MINIMAP_SCALE * GRID_SIZE),
                            round(MINIMAP_SCALE * GRID_SIZE)
                        );
                      }
                  }
            }
            
            // viewport window on the minimap
            R.lineWidth = 1;
            R.strokeStyle = '#fffbf9';
            R.globalAlpha = 0.2;

            R.globalAlpha = 1;
            strokeRect(
                ~~(V.x * MINIMAP_SCALE) + 0.5,
                ~~(V.y * MINIMAP_SCALE) + 0.5,
                ~~(CANVAS_WIDTH * MINIMAP_SCALE),
                ~~(CANVAS_HEIGHT * MINIMAP_SCALE)
            );

            R.globalAlpha = 1;
            W.units.forEach(unit => {
                    R.beginPath();
                    R.strokeStyle = R.fillStyle = unit.controller.body;
                    let x = unit.x * MINIMAP_SCALE - 2;
                    let y = unit.y * MINIMAP_SCALE - 2;
                        R.arc(x, y, 1, 0, 2 * PI);
                        R.stroke()
                });
    
            W.beacons
                .forEach(beacon => {
                    R.fillStyle = beacon.controller ? beacon.controller.beacon : '#fff' ;;
                    wrap(() => {
                        translate(beacon.x * MINIMAP_SCALE, beacon.y * MINIMAP_SCALE);
                        squareFocus(8, 4,0.5);
                    });
                });
        });
    }

    // TODO: Create a separate class Gauge
    gauge (x, y, value, width, sign, color) {
        const w = (5 + width) * sign;
        let centerY = HUD_SCORE_CELL_SIZE / 2;

        R.fillStyle = '#000';
        fr(x + 2, y + 2 + centerY, w, HUD_SCORE_CELL_SIZE * 3);

        R.fillStyle = color;
        fr(x, y + centerY, w, HUD_SCORE_CELL_SIZE * 3);

        drawCenteredText('' + value, x + w + sign * 15, y, HUD_SCORE_CELL_SIZE, color, true);
    }
    
    // TODO: Create a separate class HUD
    renderHUD(e) {
        wrap(() => {
            translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT - HUD_HEIGHT);

            if(this.enableHUDBack){
                R.fillStyle = G.hudGradient;
                fr(-CANVAS_WIDTH / 2, 0, CANVAS_WIDTH, HUD_HEIGHT);
    
                R.fillStyle = this.hudBg;
                R.strokeStyle = '#000';
                beginPath();
                moveTo(-220, HUD_HEIGHT);
                lineTo(-170, 0.5);
                lineTo(170, 0.5);
                lineTo(220, HUD_HEIGHT);
                fill();
                stroke();
            }
            let human = this.human;
            let enemy = this.ai;
            // TODO: Move these to the Controllers' viewport
            drawCenteredText('beacons', 0, 3, HUD_SCORE_CELL_SIZE, '#fff', true);
            this.gauge(-HUD_GAUGE_GAP / 2, 3, G.beaconsScore(human), G.beaconsScore(human) / W.beacons.length * 100, -1, '#0f0');
            this.gauge(HUD_GAUGE_GAP /  2, 3, G.beaconsScore(enemy) , G.beaconsScore(enemy) / W.beacons.length * 100, 1  , '#f00');
            
            drawCenteredText('units', 0, 18, HUD_SCORE_CELL_SIZE, '#fff', true);
            let playerUnits = G.unitsScore(human);
            let enemyUnits = G.unitsScore(enemy);
            let maxUnits = max(playerUnits, enemyUnits);

            this.gauge(-HUD_GAUGE_GAP / 2, 18, G.unitsScore(human), G.unitsScore(human) / maxUnits * 100, -1, '#0f0');
            this.gauge(HUD_GAUGE_GAP / 2 , 18, G.unitsScore(enemy), G.unitsScore(enemy) / maxUnits * 100, 1, '#f00');
            
            drawCenteredText('available', 0, 33, HUD_SCORE_CELL_SIZE, '#fff', true);
            let availableUnitsPlayer = W.beacons.filter(b => b.controller === human ).readyToSpawn.length;
            let availableUnitsEnemy  = W.beacons.filter(b => b.controller === enemy ).readyToSpawn.length;
                if(availableUnitsPlayer > 999) { availableUnitsPlayer = 999 }
                if(availableUnitsEnemy  > 999) { availableUnitsEnemy  = 999 }
                
            this.gauge(-HUD_GAUGE_GAP / 2, 33, availableUnitsPlayer, availableUnitsPlayer / maxUnits * 100 , -1, '#0f0');
            this.gauge( HUD_GAUGE_GAP / 2 ,33, availableUnitsEnemy,  availableUnitsEnemy  / maxUnits * 100,   1, '#f00');
        });
    }
    
    render(t,ctx,canvas) {
        wrap(() => {
            // move the canvas by the camera
            translate(-~~V.x, -~~V.y);

            // Grid on the floor
            R.fillStyle = W.floorPattern;
            fr(V.x, V.y, CANVAS_WIDTH, CANVAS_HEIGHT);
          
            // Renderables (units, particles...) that are in camera scope
            W.renderables
            .forEach(r => {
                if(r.render){
                    // TODO: BUG  Indicator won't render cause it is attached to the beacon
                    if(r instanceof Unit && r.behaviour instanceof Reach) { return wrap(() => r.render(t,ctx,canvas)) } // render path
                    if((r.x || r.y) && V.contains(r.x,r.y,10)){ wrap(() => r.render(t,ctx,canvas)) }
                    else { wrap(() => r.render(t,ctx,canvas)) }
                }
            });
            // Polygons (obstacles)
            W.polygons
            .forEach(function(p) {
                if((p.x || p.y) && V.contains(p.x,p.y) && p.renderCondition(V.center)){ p.render(t,ctx,canvas) }
            })
            
            if(W.beacons.filter(beacon => beacon.inMouseOverButton(G.cursor)).length){
                G.cursor.style('pointer')
            } else { G.cursor.style() }
            wrap(()=> { G.cursor.postRender(t,ctx,canvas) })
            
            W.renderables.forEach(r => {
                if(r.postRender){
                    if (r.x || r.y) { V.contains(r.x,r.y,10) && wrap(() => r.postRender(t,ctx,canvas)) }
                    else { wrap(() => r.postRender(t,ctx,canvas)) }
                }
            });
            
        });

        if (W.flashAlpha) {
            wrap(() => {
                R.globalAlpha = W.flashAlpha;
                R.fillStyle = '#fff';
                fr(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            });
        }
      

        R.fillStyle = 'rgba(255,255,255,.15)';
        
        fr(0, ~~(G.t * 50) % CANVAS_HEIGHT * 1.5, CANVAS_WIDTH, 0.5);
        
        R.fillStyle = 'rgba(255,255,255,.02)';
        fr(0, ~~(G.t * 60) % CANVAS_HEIGHT * 1.5 - 50, CANVAS_WIDTH, 1);
        
        fr(0, ~~(G.t * 80) % CANVAS_HEIGHT * 1.5, CANVAS_WIDTH, 100)


        R.fillStyle = this.gridPattern;
        fr(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
    }

    get width() {
        return W.matrix[0].length * GRID_SIZE;
    }

    get height() {
        return W.matrix.length * GRID_SIZE;
    }
    
    get center() {
        return new Object_({x: (this.width / 2).clip()  , y: (this.height / 2).clip() })
    }

    add(instance, types) {
        let method = types & FIRST ? 'unshift' : 'push'
        
        switch (true) {
          case instance instanceof Beacon:
          
            this.beacons.unshift(instance);
            this.cyclables.unshift(instance);
            this.renderables.unshift(instance);
            
          break;
          case instance instanceof Unit:
            this.units.push(instance);
            this.cyclables.push(instance);
            this.renderables.push(instance);
          break;
          case !!instance.render:
          case !!instance.postRender:
            this.cyclables[method](instance);
            this.renderables[method](instance);
          break;
          default:
            this.cyclables[method](instance);
          break;
        }
      
    }

    remove(element) {
        if(element.cycle){ W.cyclables.remove(element); }
        if(element.render || element.postRender){ W.renderables.remove(element) };
        if(element instanceof Unit){ W.units.remove(element) };
        if(element instanceof Beacon){ W.beacons.remove(element) };
    }

    cycle(e) {
        W.t += e;
        V.cycle(e);
        // Removes dead units
        this.units = this.units.alive;
        this.cyclables = this.cyclables.filter(cyclable => {
            if(cyclable instanceof Unit){ return !cyclable.isDead }
            return true
        });
        this.renderables = this.renderables.filter(cyclable => {
            if(cyclable instanceof Unit){ return !cyclable.isDead }
            return true
        });
        
        W.cyclables.forEach(x => x.cycle && x.cycle(e));

    }

    isOut(x, y) {
        return x < 0 || x > W.width || y < 0 || y > W.height;
    }

    hasObstacle(x, y, radius = 0) {
        if (!radius) {
            return W.pointInObstacle({x,y});
        }

        return [
            {'x': x - radius, 'y': y + radius},
            {'x': x - radius, 'y': y - radius},
            {'x': x + radius, 'y': y - radius},
            {'x': x + radius, 'y': y + radius}
        ].filter(pt => {
            return W.pointInObstacle(pt); // TODO don't really need the function here, leaving for clarity
        }).length;
    }

    pointInObstacle(pt) {
        let row = W.matrix[~~(pt.y / GRID_SIZE)];
        if(!row) { return 1 } // if no map row consider it as obstacle
        return W.isOut(pt.x, pt.y) || row[~~(pt.x / GRID_SIZE)];
    }

    hasObstacleAtCell(cell) {
        return W.matrix[cell.row] && W.matrix[cell.row][cell.col];
    }

    /**
     * @param startPosition: Start position (x, y)
     * @param endPosition: End position (x, y)
     * @param endCondition: Function that should return true if the position is considered final
     */
    constructPath(start,endpoint,endCondition) {
        // start position is half of a grid cell size
        let solution = W.aStar({
            'row': ~~(start.y / GRID_SIZE),
            'col': ~~(start.x / GRID_SIZE)
        }, {
            'row': ~~(endpoint.y / GRID_SIZE),
            'col': ~~(endpoint.x / GRID_SIZE)
        }, cell => endCondition({
            'x': (cell.col + 0.5) * GRID_SIZE,
            'y': (cell.row + 0.5) * GRID_SIZE
        }));
        // iterate unless latest parent is reached
        // meaning point is the endpoint of the path
        if (solution) {
            const path = [];
            while (solution) {
                path.unshift({
                    'x': (solution.col + 0.5) * GRID_SIZE,
                    'y': (solution.row + 0.5) * GRID_SIZE
                });
                solution = solution.parent;
            }

            path[path.length - 1] = {'x': endpoint.x, 'y': endpoint.y};
            if (path.length > 1) {
                path.shift(); // kinda risky, but the first step is very often a step back
            }

            return path;
        }
    }

    /**
     * @param start: Start position (row, col)
     * @param end: End position (row, col)
     * @param endCondition: Function that should return true if the position is considered final
     */
    aStar(start, end, endCondition) {
        const map = W.matrix;

        const expandable = [start];
        const expandedMap = copyMap(map);

        start.distance = 0;

        while (expandable.length) {
            // Picking the cell that is the closest to the target and has the least distance from the start
            let expandIndex,
                expandDist = Number.MAX_VALUE;
            expandable.forEach((x, i) => {
                
                const dist = x.distance +  new Object_({x: x.row, y: x.col}).distanceTo(new Object_({x: end.row, y: end.col}));
                if (dist < expandDist) {
                    expandDist = dist;
                    expandIndex = i;
                }
            });

            let expandedCell = expandable[expandIndex];
            expandable.splice(expandIndex, 1);

            // Check if destination
            if (endCondition(expandedCell)) { // are we within shooting radius?
                return expandedCell; // TODO use raycasting instead
            }
            
            expandedMap[expandedCell.row][expandedCell.col] = 1;
  
            const top = {'row': expandedCell.row - 1, 'col': expandedCell.col};
            const bottom = {'row': expandedCell.row + 1, 'col': expandedCell.col};
            const left = {'row': expandedCell.row, 'col': expandedCell.col - 1};
            const right = {'row': expandedCell.row, 'col': expandedCell.col + 1};

            const obstacleTop = W.hasObstacleAtCell(top);
            const obstacleBottom = W.hasObstacleAtCell(bottom);
            const obstacleLeft = W.hasObstacleAtCell(left);
            const obstacleRight = W.hasObstacleAtCell(right);

            const neighbors = [top, bottom, left, right];

            if (!obstacleTop && !obstacleLeft) {
                neighbors.unshift({'row': top.row, 'col': left.col});
            }

            if (!obstacleTop && !obstacleRight) {
                neighbors.unshift({'row': top.row, 'col': right.col});
            }

            if (!obstacleBottom && !obstacleLeft) {
                neighbors.unshift({'row': bottom.row, 'col': left.col});
            }

            if (!obstacleBottom && !obstacleRight) {
                neighbors.unshift({'row': bottom.row, 'col': right.col});
            }

            // Not target, let's expanded from that cell!
            neighbors.forEach(x => {
                if (
                    x.row < 0 ||
                    x.col < 0 ||
                    x.row >= map.length ||
                    x.col >= map[0].length ||
                    expandedMap[x.row][x.col]
                ) {
                    return;
                }

                x.parent = expandedCell;
                x.distance = expandedCell.distance + new Object_({ x: x.row, y: x.col}).distanceTo({x: expandedCell.row, y: expandedCell.col});

                const existing = expandedMap[x.row][x.col];
                if (isNaN(existing)) {
                    if (existing.distance > x.distance) {
                        existing.distance = x.distance;
                        existing.parent = x.parent;
                        // In a perfect world we would also update its children since we found a shorter path but fuck it this seems to work
                    }

                    return;
                }

                expandedMap[x.row][x.col] = expandedCell;
                expandable.push(x);
            });
        }
    }

    /**
     * Casts a ray and returns the collision or null
     * @param start The position at which the ray should be fired from
     * @param angle The angle at which the ray should be fired
     * @param maxDistance The maximum distance the ray should be cast to
     * @return The point at which the ray hit an obstacle, or null if none or too far
     */
    castRay(start, angle, maxDistance) {
        const castHorizontal = W.castAgainstHorizontal(start.x, start.y, angle);
        const castVertical = W.castAgainstVertical(start.x, start.y, angle);

        let cast;
        if (!castHorizontal) {
            cast = castVertical;
            
        } else if (!castVertical) {
            cast = castHorizontal;
        } else {
            const dHorizontal = start.distanceTo(castHorizontal);
            const dVertical = start.distanceTo(castVertical);
            cast = dHorizontal < dVertical ? castHorizontal : castVertical;
        }

        return maxDistance && (!cast || start.distanceTo(cast)) > maxDistance
            ? {
                'x': start.x + cos(angle) * maxDistance,
                'y': start.y + sin(angle) * maxDistance
            }
            : cast;
    }

    castAgainstHorizontal(startX, startY, angle) {
        const pointingDown = sin(angle) > 0;

        const y = ~~(startY / GRID_SIZE) * GRID_SIZE + (pointingDown ? GRID_SIZE : -0.0001);
        const x = startX + (y - startY) / tan(angle);

        const yStep = pointingDown ? GRID_SIZE : -GRID_SIZE;
        const xStep = yStep / tan(angle);

        return W.doCast(x, y, xStep, yStep);
    }

    castAgainstVertical(startX, startY, angle) {
        const pointingRight = cos(angle) > 0;

        const x = ~~(startX / GRID_SIZE) * GRID_SIZE + (pointingRight ? GRID_SIZE : -0.0001);
        const y = startY + (x - startX) * tan(angle);

        const xStep = pointingRight ? GRID_SIZE : -GRID_SIZE;
        const yStep = xStep * tan(angle);

        return W.doCast(x, y, xStep, yStep);
    }

    doCast(startX, startY, xStep, yStep) {
        let x = startX,
            y = startY;

        for (var i = 0 ; i < 100 ; i++) {
            if (W.isOut(x, y)) {
                // Out of bounds
                return null;
            }

            if (W.hasObstacle(x, y)) {
                // Hit an obstacle!
                return { 'x': x, 'y': y };
            }

            x += xStep;
            y += yStep;
        }
    }

    hasObstacleBetween(a, b) {
        const d = a.distanceTo(b);
        const cast = W.castRay(a, a.angleTo(b), d);
        // if cast is null it means target b is out of map
        return cast && a.distanceTo(cast) < d;
    }

    animatePolygons(from, to) {
        W.volumes.forEach(volume => {
            const duration = random() * 0.5 + 0.5;
            volume.forEach(polygon => {
                interp(polygon, 'perspective', polygon.perspective * (from ? 1 : 10), polygon.perspective * (to ? 1 : 10), duration);
                interp(polygon, 'alpha', from, to, duration);
            });
        });
    }
  
    initialize() {
        // implement in subclasses
    }
}
