// Prevent FOUC — apply stored theme before first paint
(function(){
  var d=document.documentElement;
  try {
    var t=JSON.parse(localStorage.getItem('founder-hub-theme')||'null');
    if(t==='light'){d.setAttribute('data-appearance','light');}
    else{d.classList.add('dark');d.setAttribute('data-appearance','dark');}
  }catch(e){d.classList.add('dark');d.setAttribute('data-appearance','dark');}
  d.classList.add('extra-contrast');
})();
