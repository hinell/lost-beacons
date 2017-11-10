TARGET_MISSING = new Error('Invalid argument: target object or position is missing');
class Object_ {
    constructor (cfg = {}) {
      // first things first
      this.x      = cfg.x || 0;
      this.y      = cfg.y || 0;
      this.radius =
      this.r      =  cfg.r || 0; // radius
    }
    
    angleTo(targetObj) {
      return Math.PI + Math.atan2(this.y - targetObj.y,this.x - targetObj.x)
    }
    
    distanceTo(position){
      if(position instanceof Objects) { position = position.random()  }
      if(!position || position.x === undefined || position.y === undefined ) { throw TARGET_MISSING }
      return Math.hypot(this.y - position.y,this.x - position.x)
    }
    
}

class Objects extends Array {
  constructor(arr){
    super()
    this.initialize(arr);
  }
  
  initialize (arr) {if (arr instanceof Array && arr.length) { arr.forEach(e => this.push(e),this) }}
  
  get coord(){
    // most distant to the left and to the right
   let lx = this.sort((a,b) => a.x - b.x).first.x;
   let rx = this.sort((a,b) => b.x - a.x).first.x;
  
    // most distant to the top and to the bottom
   let by = this.sort((a,b) => b.y - a.y).first.y;
   let ty = this.sort((a,b) => a.y - b.y).first.y;
   
   let x = ((lx+rx)/2).roundp();
   let y = ((ty+by)/2).roundp();
   // let r = Math.abs(Math.max(rx-lx,by-ty))
   let r = (Math.abs(Math.hypot(by-ty,rx-lx))/2).roundp()
   return new Object_({x,y,r})
  }
  
  // Highly efficient version of filter, allows to avoid doubling filtering the same array
  // @param {Function} - function
  // @param - return the rest of objects that aren't fit to the passed
  // @return { Objects | Objects<Objects,Objects>} - if second argument is provided, then return tuple [[],[]] or instance of the Objects otherwise
  filter(cb,returnRest, this_){
    let passed   = new this.constructor();
    if(returnRest){
      let filtered = new this.constructor();
      for (let i = 0; i < this.length; i++) { let obj = this[i]; if(cb.call(this_,obj,i,this)) { passed.push(obj) } else { filtered.push(obj) }  }
      return [passed,filtered]
    }
     for (let i = 0; i < this.length; i++) { let obj = this[i]; if(cb.call(this_,obj,i,this)) { passed.push(obj) }  }
     return passed
  }
  
  // @param target - target position
  // @param precise - Time consumable option.
  // It uses calculation of central between all objects inside
  // current instance by sot that use it very carefully.
  distanceTo(target, precise = false){
    if(!this.length) { return Infinity }
    if(target instanceof Objects){
      if(precise) { target = target.coord }
      else { target = target.random() }
    }
    if(!target.distanceTo) { target = new Object(target) }
    if(precise) {return this.coord.distanceTo(target,precise)}
    return this.random().distanceTo(target,precise)
  }
  
  //@return {Objects}
  sortByClosestTo(target, inclusive = true){
    if(!this.length){ return this }
    if(target instanceof Objects){ target = target.random() }
    if(!target) { return this }
    let objects = this.sort((a,b) => target.distanceTo(a) - target.distanceTo(b));
    if(inclusive) { objects = objects.filter(currentObj => currentObj !== target) }
    return objects
  }

  // @param target {Object} - {x,y}
  // @param radius
  // @param callback - called immediately if target is in radius range
  at(targetPos,radius = GRID_SIZE, cb){
    if(!targetPos){throw TARGET_MISSING}
    if(cb) {
      return this.filter((obj,i,arr) => {
        let cond = targetPos.distanceTo(obj) < radius
          if(cond) { cb(obj,i,arr) }
        return cond
      })
    }
    return this.filter(obj => targetPos.distanceTo(obj) < radius )
  }
  
  // finds available positions around
  freeSingleCirclePositions(startPosition, distBetweenPos = 5, offSetCenter /* distant from center */, startAngle = 0) {
      // if offSetCenter is not provided then only available
      // position is this object itself
      if (!offSetCenter) { return this.some(e => e.x === startPosition.x && e.y === startPosition.y) ? [] : [startPosition] }
      if (distBetweenPos <= 0) { throw new Error('Invalid argument: radius between positions cannot be zero or below!')}
      let perimeter     = Math.PI2 * offSetCenter;
      let offsetLength  = ~~(perimeter / distBetweenPos);
      let angleOffset   = (Math.PI2) / offsetLength; // angle offset to rotate position over
      
      let positions = new Objects();
      let position, angle;
      for (let i = 0 ; i < offsetLength ; i++) {
          angle     = angleOffset * i + startAngle;
          position  = new Object_({
              x : startPosition.x + cos(angle) * offSetCenter,
              y : startPosition.y + sin(angle) * offSetCenter
          });
          // TODO: Extra things, should be outside
          // TODO: Too expensive to use
          !W.hasObstacle(position.x, position.y, distBetweenPos / 2)
          && this.every(reservedPos => { return reservedPos.distanceTo(position) > distBetweenPos; })
          && positions.push(position)
        
      }
      return positions;
  
    }
  
  freeCirclePositions(position,distBetweenPos,maxRadius,requiredPositions, minRadius = 0, startAngle = 0) {
      if(!(position instanceof Object_)){ position = new Object_(position) }

      if(!maxRadius){ maxRadius = distBetweenPos * 3 } // default 3 times of radius between each point
          requiredPositions = requiredPositions || this.length;
          // requiredPositions += ~~(requiredPositions * .10); // available positions + ten percent of possible
      let positions = new Objects();
      let stop = -1;
      for ( let currentRadius = minRadius;
                currentRadius < maxRadius || stop < 350 && positions.length <= requiredPositions ;
                currentRadius += distBetweenPos
      ) {
            ++stop;
            // startAngle = Math.PI2 * 0.61803 * stop; // golden number
        let nextFreePositions   = this.freeSingleCirclePositions(position, distBetweenPos , currentRadius, startAngle);
            positions = positions.concat(nextFreePositions);
            // nextFreePositions.forEach(p => positions.push(p) )
       
      }
      return positions
  }
  
  freeRectanglePositions(position,offset = GRID_SIZE){

    let width   = ~~(Math.sqrt(this.length)) + 2
    let height  = ~~(Math.sqrt(this.length)) + 2
    
    let startX = position.x - ~~((width  * offset * 2)/ 2) - offset
    let startY = position.y - ~~((height * offset * 2)/ 2) - offset
    
    let positions = new this.constructor();
      let currentX = startX, currentY = startY;
      for (let i = 0; i < width; i++) {
        currentY += offset * 2
        currentX = startX
        for (let j = 0; j < height; j++) {
              currentX += (offset * 2);
          let position = { x: currentX, y: currentY};
          if(!W.hasObstacle(position.x, position.y, offset / 2)
            && this.every(reservedPos => { return reservedPos.distanceTo(position) > offset; })){

            positions.push(position)
          }
        }
      }
      return positions
  }
}