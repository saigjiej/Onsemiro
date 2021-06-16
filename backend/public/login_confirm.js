function getCookie(name){
  var nameOfCookie = name + "="; 
  var x = 0;
  while (x <= document.cookie.length) {
    var y = (x + nameOfCookie.length);
    if (document.cookie.substring(x, y) == nameOfCookie) {
      if ((endOfCookie = document.cookie.indexOf(";", y)) == -1) {
        endOfCookie = document.cookie.length; 
      }
      return unescape(document.cookie.substring(y, endOfCookie)); 
    }
    x = document.cookie.indexOf(" ", x) + 1; 
    if (x == 0) {
      break; 
    }
  }
  return ""; 
}

const current_user_email = getCookie('email');

const login_li = document.querySelector("#login_li");
const signup_li = document.querySelector("#signup_li");

if (current_user_email != "") {
  login_li.innerHTML = '';
  signup_li.innerHTML = '<a href="/mypage">마이페이지</a>';
}