//  There was some authentication code here, but it was removed to keep things simple
//  This is just a placeholder to keep the code working

//console.log("No authentication provided, using default permissions for all users");

function getAuthDetails(username) {
    // default behavior here
    return {
        uname:username,
        apps:[],
        roles: [],
        active: true
      };
  };
  module.exports = {getAuthDetails};