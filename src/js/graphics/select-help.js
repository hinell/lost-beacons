class SelectHelp extends SelectionCursor {

    move(){}
    
    constructor(getStartXY, pause) {
        super()
        this.cursor = new FakeCursor();
        this.selectionSize =  350;
        this.pause    = pause || (() => false);
        this.selectionAlpha = 1;
        this.alpha = 0;
        
        this.downPosition = {x: 0, y: 0};
        this.x = this.y = 0; // start position
        this.getStartXY = getStartXY;
        this.reset();
        this.timers = new Sequence(true,[
              new Timer(6)
            , new Interp(4,0,1,this,'alpha')
            , new Timer(3,(timer) => {
                this.x = timer.counter.linear(this.downPosition.x,this.downPosition.x+this.selectionSize);
                this.y = timer.counter.linear(this.downPosition.y,this.downPosition.y+this.selectionSize);
              })
            , new Interp(2,1,0,this,'alpha', (timer) => {
                  if(timer.done) {this.reset()}
              })
        ]);

    }
    
    reset(){
        this.alpha = 0;
        let coord = this.getStartXY();
        this.downPosition.x = this.x = coord.x - this.selectionSize / 2;
        this.downPosition.y = this.y = coord.y - this.selectionSize / 2;
    }
    postRender(t,ctx,c) {
        if(this.pause()) {
            this.reset();
            this.timers.reset();
            return
        }
        this.timers.cycle(t);
        //
        R.globalAlpha = this.alpha;
        this.cursor.x = this.x;
        this.cursor.y = this.y;
        
        wrap(() => this.cursor.postRender(t,ctx,c));

        R.globalAlpha *= this.selectionAlpha;
        super.postRender(t,ctx,c)
        
    }

}
