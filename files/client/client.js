/*function encodeForAjax(data) {
    return Object.keys(data).map(function(k){
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
    }).join('&')
    }*/
function getTokenListener(){
    alert("test");
}
document.getElementById("getToken").addEventListener("click", function(){
    let ajax = new XMLHttpRequest();

    ajax.open("POST","http://localhost:9001/login", true);
    ajax.onload = getTokenListener;

    ajax.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    ajax.send({clientId: "client", clientSecret: 'client123'});

});

document.getElementById("getResource").addEventListener("click", function(){
    alert("resource");
    });


