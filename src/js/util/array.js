// Highly optimized forEach loop
Array.prototype.forEach =
Array.prototype.each    = function (fn ,this_) {
  if(this.length <=0 || fn === undefined) {return};
  if (this_) fn = fn.bind(this_);
  for (let i = 0; i < this.length; i++) {
    fn(this[i],i,this)
  }
  
};

Array.prototype.remove = function(item) {
    const index = this.indexOf(item);
    if (index >= 0) {
        this.splice(index, 1);
        return true;
    }
};

class Iterable {
  constructor (interable){
      this.interable = interable
  }
  toArray(){
  let a = [], kv;
  while(!(kv = this.interable.next()).done) { a.push(kv.value) }
  return a
  }
}

Map.prototype._keys = Map.prototype.keys;
Map.prototype.keys = function (array){
  if (!array) { return this._keys() }
  return new Iterable(this._keys()).toArray()
}

Map.prototype._values = Map.prototype.values;
Map.prototype.values = function (array){
  if (!array) { return this._values() }
  return new Iterable(this._values()).toArray()
}