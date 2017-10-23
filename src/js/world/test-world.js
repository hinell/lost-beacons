class TestWorld extends World {
  animatePolygons(){}
  initialize(){
    this.matrix = this.map = generate(50,60,false);
    
    let bcn1                    = new Beacon();
    bcn1.previousController = true;
    bcn1.control            = 1;
    bcn1.controller         = PLAYER_TEAM;
    bcn1.Unit               = Destructor;
    bcn1.spawnInterval      = 10;
    bcn1.x = W.center.x - 600 - 50;
    bcn1.y = W.center.y + 100;
    
let bcn2                    = new Beacon();
    bcn2.previousController = true;
    bcn2.control            = 0;
    bcn2.controller         = ENEMY_TEAM;
    bcn2.Unit               = Unit
    bcn2.spawnInterval      = 10;
    bcn2.x = W.center.x + 600;
    bcn2.y = W.center.y + 100;
    
    bcn1.readyUnits = 5..range().map(n => new Unit({controller: PLAYER_TEAM}) );
    bcn2.readyUnits = new Units([new Unit({controller: ENEMY_TEAM})]);
    this.add(bcn1);
    this.add(bcn2);
  }
  
  render(t){
      super.render.apply(this,arguments);
      this.renderHUD(t);
      this.renderMinimap(t);
  }
    
}