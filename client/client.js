const getToken = document.getElementById("getToken");
const getResource = document.getElementById("getResource");
let client_id = "client";
let client_secret = "123";
let redirect_uris = "http://localhost:9000";
let scope = "read";

const postInfo = () => {
   window.location.replace(`http://localhost:9001/authorize?client_id=${client_id}&client_secret=${client_secret}&scope=${scope}&redirect_uris=${redirect_uris}`);
};

const postToken = () => {

};
getToken.addEventListener('click',postInfo);
getResource.addEventListener('click',postToken);