// Cache-bust stale localStorage content data (runs before React)
// Bump DATA_V when static JSON files change to force fresh fetch
(function(){
  var DATA_V='4';
  try {
    if(localStorage.getItem('founder-hub:__data_version__')!==DATA_V){
      var keys=Object.keys(localStorage);
      for(var i=0;i<keys.length;i++){
        if(keys[i].indexOf('founder-hub:')===0 && keys[i]!=='founder-hub-theme' && keys[i]!=='founder-hub:__data_version__'){
          localStorage.removeItem(keys[i]);
        }
      }
      localStorage.setItem('founder-hub:__data_version__',DATA_V);
    }
  }catch(e){}
})();
