const getToken = document.getElementById("getToken");
const getResource = document.getElementById("getResource");

const postInfo = () => {
    axios.post("http://localhost:9001/login",{
        clientId: "client",
        clientSecret: "123"
    }).then(response => {alert("Token " + response.data.token + "\n Refresh Token " + response.data.refreshToken)});

};

const postToken = () => {

};
getToken.addEventListener('click',postInfo);
getResource.addEventListener('click',postToken);