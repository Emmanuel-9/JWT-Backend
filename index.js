const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');

app.use(express.json());
app.use(cors())
const users = [
    { 
        id: "1",
        username: "admin",
        password: "Doe1234",
        isAdmin: true,
    },
    { 
        id: "2",
        username: "Jennifer",
        password: "Lopez1234",
        isAdmin: false,
    },
    { 
        id: "3",
        username: "You",
        password: "You1234",
        isAdmin: false,
    },
];

let refreshTokens = []

app.post('/api/refresh', (req, res) => {
    //take the refresh token from the user 
    const refreshToken = req.body.token

    // send error if there is no token or it is invalid
    if(!refreshToken) {return res.status(401).json({ err : "You are not authenticated!"});}

    if(!refreshTokens.includes(refreshToken)){
        console.log(refreshTokens)
        return res.status(403).json("Refresh token is invalid!");
    }
    jwt.verify(refreshToken, "myRefreshSecretKey1234", (err,user) => {
        err && console.log(err);
        refreshTokens = refreshTokens.filter((token) => token  !== refreshToken); // 

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.push(newRefreshToken);
        console.log(refreshToken)
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        })
    })
    //If everything is ok, create new access token, refresh token and send to user
})
    const generateAccessToken = user => {
        return jwt.sign({ id: user.id, isAdmin: user.isAdmin}, "mySecretKey", { expiresIn: '10s'})
    }
    const generateRefreshToken = user => {
        return jwt.sign({ id: user.id, isAdmin: user.isAdmin}, "myRefreshSecretKey");
    }


app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => {
        return u.username === username && u.password === password;
    });
    if(user){
        //Generate an access token
        const accessToken = generateAccessToken(user);
        //Generate a refresh token
        const refreshToken = generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken,
            refreshToken
        }).then
    }else {
        res.status(400).json({err : "Username or password incorrect!"})
    }
});


const verify = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ");
        let revisedToken = token[1];

        jwt.verify(revisedToken, "mySecretKey", (err, user) => {
            if(err) {
                console.log(token)
                return res.status(403).json({err : "Token is not valid!"});
               
            }
            req.user = user;
            next();
        })
    }else {
        res.status(401).json({ err : "You are not authenticated!"});
    }
}

app.delete("/api/users/:userId", verify, (req, res) => {
    if(req.user.id === req.params.userId || req.user.isAdmin){
        res.status(200).json("User has been deleted");
    }else{
        res.status(403).json("You are not allowed to delete this user!");
    }

})

app.post("/api/logout", verify, (req, res) => {
    const refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken)
    res.status(200).json("You logged out successfully!");
})

app.listen(5000, () =>{
    console.log('listening on port 5000')
})