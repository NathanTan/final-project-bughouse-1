
var filterInput = document.getElementById("session-filter-input");

filterInput.onkeyup = function(){
  if(filterInput.value === ""){
     var allSessions = document.querySelectorAll("li.session-names");
     for(var i = 0; i < allSessions.length; i++ ){
       allSessions[i].style.display = "block";
     }
    
     return;
  }
  
  
  var allSessions = document.querySelectorAll("li.session-names");
  for(var i = 0; i < allSessions.length; i++ ){
     var name = allSessions[i].getElementsByClassName("name")[0].textContent;
         
    if(name.indexOf(filterInput.value) >= 0){
      allSessions[i].style.display = "block";
    }
    if(name.indexOf(filterInput.value) < 0){
      allSessions[i].style.display = "none";
    }
  }
}