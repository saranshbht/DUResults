// var a = document.getElementById('hello');
var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", "inspirational_quotes.csv");
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
}
console.log(result);
Papa.parse(a, {
    // delimiter: ",",
    complete: function(results) {
        console.log(results.data);
    }
});