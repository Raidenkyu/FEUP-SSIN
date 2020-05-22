const getToken = document.getElementById("getToken");
const getResource = document.getElementById("getResource");
const operationBtn = document.getElementById("postOperation");


let response_type = "code";
let scope = "read";
let client_id = "client";
let state = "";


const postInfo = () => {
   window.location.replace(`http://localhost:9001/authorize?response_type=${response_type}&client_id=${client_id}&scope=${scope}&state=${state}`);
};

const postToken = () => {

};

getToken.addEventListener('click',postInfo);
getResource.addEventListener('click',postToken);
