class TestWorld extends World {
  animatePolygons(){}
  initialize(){
    this.matrix = this.map = 40..range().map(row => 50..range().map(n => 0) )
    this.controllers = [
     this.human = new Human()
    ,this.ai    = new AI()
    ];
    this.controllers.forEach(ca => {
      this.controllers.forEach(cb => {
        if(ca !== cb){ ca.addEnemy(cb) }
      })
    });
    
let bcn1        = new Beacon();
    bcn1.Unit   = Beast;
    bcn1.x = W.center.x - 500 - 50;
    bcn1.y = W.center.y;
    bcn1.changeController(this.human);

let bcn2        = new Beacon();
    bcn2.Unit   = Unit;
    bcn2.x =  W.center.x + 500;
    bcn2.y =  W.center.y;
    bcn2.changeController(this.ai);
    
    bcn1.readyUnits = new Units(10..range().map(u => (new Killer())));
    bcn2.readyUnits = new Units(10..range().map(u => (new Unit()  )));
    bcn2.spawnUnits();
    
    this.add(bcn1);
    this.add(bcn2);
    
    let positions = this.beacons.freeCirclePositions(W.center,new Beacon().unitsDetectionRadius);
    10..range().map((b,i) =>{
      let position = positions[i];
      if(!position){ return }
      b = new Beacon();
      b.changeController([this.ai,this.human,void 0].random())
      b.x = position.x;
      b.y = position.y;
      b.readyUnits = new Units((0..random(10)).range().map(u => (new Unit())));
      this.add(b);
    });
    
    // center the viewport
    V.x = W.center.x - (CANVAS_WIDTH  / 2);
    V.y = W.center.y - (CANVAS_HEIGHT / 2);
    
  }
  
  cycle(t) {
    super.cycle(t)
    this.controllers.forEach(c => c.cycle(t));
  }
  
  render(t,ctx,c){
    super.render(t,ctx,c);
    this.renderHUD(t);
    this.renderMinimap(t);
  }
    
}