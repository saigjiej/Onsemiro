const express = require("express");
const app = express();
const port = 7000;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { User } = require("./models/User");
const { auth } = require("./middleware/auth");
const cors = require("cors");
const querystring = require('querystring');
const url = require('url');
const session = require('express-session');
const path = require('path');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());

app.use(session({ 
  secret: 'keyboard cat', 
  resave: false, 
  saveUninitialized: false, 
  cookie: { secure: false } 
}));

app.use(
  cors({
    origin: true,
    credentials: true, //도메인이 다른경우 서로 쿠키등을 주고받을때 허용해준다고 한다
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
//이곳에 mongodb 사이트에서 카피한 주소를 이곳에 넣으면 된다.
const dbAddress = "mongodb+srv://Nigerian:Nigerian@cluster0.yihsg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose
  .connect(dbAddress, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname, 'public')));

// index (메인화면) 라우터
// const indexRouter = require('./router/index'); 
// app.use('/', indexRouter); 

// 메인화면 라우터
app.get('/', function(req, res) {
  res.render('index', {
  	title: 'index'
  });
});

// signup_process (회원가입) 라우터
app.post('/signup_process', function(req, res){
  //회원가입을 할때 필요한것
  //post로 넘어온 데이터를 받아서 DB에 저장해준다
  const user = new User(req.body);
  console.log(user)
  user.save((err, userInfo) => {
    // if (err) return res.json({ success: false, err });
    // return res.status(200).json({ success: true });
  });
  console.log(req.session);
  const query = querystring.stringify({
    "name": user.name,
    "email": user.email,
  });
  res.redirect('/practice?' + query);
});

// 회원가입 버튼 클릭 시 라우터
app.get('/signup', function(req, res) {
  res.render('signup_process', {
  	title: 'REGISTER'
  });
});

app.post('/signup_success', function(req, res){
  var queryData = url.parse(req.url, true).query;
  return res.render('signup_success',{
    
  });
});

// 로그인 버튼 클릭 시 라우터
app.get('/login', function(req, res) {
  res.render('login_process', {
  	title: 'login'
  });
});

// login (로그인) 라우터
app.post('/login_process', function(req, res) {
  //로그인을할때 아이디와 비밀번호를 받는다
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) {
      return res.json({
        loginSuccess: false,
        message: "존재하지 않는 아이디입니다.",
      });
    }
    user
      .comparePassword(req.body.password)
      .then((isMatch) => {
        if (!isMatch) {
          return res.json({
            loginSuccess: false,
            message: "비밀번호가 일치하지 않습니다",
          });
        }
      //비밀번호가 일치하면 토큰을 생성한다
      //jwt 토큰 생성하는 메소드 작성
      user
        .generateToken()
        .then((user) => {
          res
            .cookie("x_auth", user.token)
            .status(200)
            .json({ loginSuccess: true, userId: user._id });
        })
        .catch((err) => {
          // res.status(400).send(err);
        });
    })
    .catch((err) => res.json({ loginSuccess: false, err }));

    req.session.user = {
			email: req.body.email,
		};
  });
  const query = querystring.stringify({
    "email": req.body.email
  });
  res.redirect('/login_success?' + query);
});

app.get('/login_success', function(req, res){
  var queryData = url.parse(req.url, true).query;
  // cookie생성
  res.cookie("email", queryData.email);
  res.cookie("name", queryData.name);
  // cookie 읽기
  console.log(req.cookies);
  return res.render('login_success',{
    name: String(queryData.name),
    email: String(queryData.email)
  });
});

// 마이페이지
app.get('/mypage', function(req, res) {
  let user_name = "";
  let user_email = req.cookies['email'];
  let user_point = 0;
  // 현재 로그인한 유저의 이름 정보 가져오기
  User.findOne({email: user_email}, (err, data) => {
    user_name = data.name;
    user_point = data.point;
    res.render('my_page', {
      name: user_name,
      email: user_email,
      point: user_point
    });
  });
});

// 비밀번호 변경 페이지
app.get('/change-password', function(req, res) {
  return res.render('change_password', {
  });
});

// 비밀번호 변경 페이지
app.post('/change-password-process', function(req, res) {
  let current_login_user = req.cookie['email']
  User.findOne({email: current_login_user}, (err, data) => {
    if(data.password == req.body.previous_pw){
      User.update({email: current_login_user}, {password: req.body.new_pw}, (err, data) => {
        if(err){
          console.log(err);
        }else{
          alert("비밀번호 변경을 실패했습니다.");
        }
      });
    }else{
      alert("현재 비밀번호가 틀렸습니다. ");
    }
  })
  return res.render('change_password', {
  });
});

//app.get('/point-plastic', function(req, res) {
//  return res.render('plastic', {
//  });
//});

// 로그인 버튼 클릭 시 라우터
app.get('/point', function(req, res) {
  let current_login_user = req.cookies['email'];
  console.log("현재 쿠키에 저장된 유저 : " + current_login_user);

  // 포인트 증가시키는 구문
  // User.update({email: current_login_user}, {$inc: {"point": 1}}, (err, data) => {
  //   if(err){
  //     console.log(err);
  //   }else{
  //     console.log(data);
  //   }
  // });

  // 현재 로그인한 유저의 DB 정보 가져오기
  User.findOne({email: current_login_user}, (err, data) => {
    if(err){
      console.log(err)
    }else{
      // console.log(data);
      console.log(data.point)
    }
  })

  res.render('point', {
  	// point: data.point
  });
});

app.get('/point_up', function(req, res){
  let current_login_user = req.cookies['email'];
  User.update({email: current_login_user}, {$inc: {"point": 1}}, (err, data) => {
    if(err){
      console.log(err);
    }else{
      console.log(data);
    }
  });
  res.redirect('/point');
});

//auth 미들웨어를 가져온다
//auth 미들웨어에서 필요한것 : Token을 찾아서 검증하기
app.get("/auth", auth, (req, res) => {
  //auth 미들웨어를 통과한 상태 이므로
  //req.user에 user값을 넣어줬으므로
  res.status(200).json({
    _id: req._id,
    isAdmin: req.user.role === 09 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
  });
});

//user_id를 찾아서(auth를 통해 user의 정보에 들어있다) db에있는 토큰값을 비워준다
app.get("/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ success: false, err });
    res.clearCookie("x_auth");
    return res.status(200).send({
      success: true,
    });
  });
});

app.listen(port, () => console.log(`listening on port ${port}`));

app.get('/swc_way', function(req, res) {
  res.render('swc_way', {
  });
});

app.get('/swc_reason', function(req, res) {
  res.render('swc_reason', {
  });
});

app.get('/swc_battery', function(req, res) {
  res.render('swc_battery', {
  });
});

app.get('/swc_can', function(req, res) {
  res.render('swc_can', {
  });
});

app.get('/swc_electronic', function(req, res) {
  res.render('swc_electronic', {
  });
});

app.get('/swc_etc', function(req, res) {
  res.render('swc_etc', {
  });
});

app.get('/swc_fiber', function(req, res) {
  res.render('swc_fiber', {
  });
});

app.get('/swc_glass', function(req, res) {
  res.render('swc_glass', {
  });
});

app.get('/swc_lamp', function(req, res) {
  res.render('swc_lamp', {
  });
});

app.get('/swc_oil', function(req, res) {
  res.render('swc_oil', {
  });
});

app.get('/swc_paper', function(req, res) {
  res.render('swc_paper', {
  });
});

app.get('/swc_plastic', function(req, res) {
  res.render('swc_plastic', {
  });
});

app.get('/swc_styrofoam', function(req, res) {
  res.render('swc_styrofoam', {
  });
});

app.get('/swc_vinyl', function(req, res) {
  res.render('swc_vinyl', {
  });
});


// 새싹 포인트 쌓기
app.get("/point-plastic", function(req, res){
  res.render('point_plastic');
})

app.get("/point-box", function(req, res){
  res.render('point_box');
})

app.get("/point-can", function(req, res){
  res.render('point_can');
})
