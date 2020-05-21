const getToken = document.getElementById("getToken");
const getResource = document.getElementById("getResource");
const operationBtn = document.getElementById("postOperation");


let client_id = "client";
let client_secret = "123";
let redirect_uris = "http://localhost:9000";
let scope = "read";

const postInfo = () => {
   window.location.replace(`http://localhost:9001/authorize?client_id=${client_id}&client_secret=${client_secret}&scope=${scope}&redirect_uris=${redirect_uris}`);
};

const postToken = () => {

};
const postOperation = (event) => {
   let acessToken = document.getElementById("token").value;
   const resourceServer = axios.create({
      baseURL: 'http://localhost:9002',
      timeout: 5000
   });

   word = document.getElementById('resource').value;
   resourceServer.interceptors.request.use((config) => {
      if(acessToken)
         config.headers['Authorization'] = `Bearer ${acessToken}`;
      return config;;
   })
   if (document.getElementById('read').checked) {
      acessToken.get('/' + word);
      return;
    }
    
    if (document.getElementById('delete').checked) {
      acessToken.delete('/' + word);
      return;
    }

    if (document.getElementById('delete').checked) {
      acessToken.post('/' + word);
      return;
    }

};
getToken.addEventListener('click',postInfo);
getResource.addEventListener('click',postToken);
operationBtn.addEventListener('click',postOperation);