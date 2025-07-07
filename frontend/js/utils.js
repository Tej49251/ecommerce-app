function getToken() {
  return localStorage.getItem('jwtToken');
}

function authHeader() {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}
