const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const redis = require('redis')
const session = require('express-session')
let RedisStore = require('connect-redis')(session)

const {
    MONGO_USER,
    MONGO_PASSWORD,
    MONGO_IP,
    MONGO_PORT,
    REDIS_URL,
    REDIS_PORT,
    SESSION_SECRET } = require('./config/config')

let redisClient = redis.createClient({
    host: REDIS_URL,
    port: REDIS_PORT
})

const app = express()
const postRouter = require('./routes/postRoutes')
const userRouter = require('./routes/userRoutes')

const mongoUrl = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectWithRetry = () => {
    mongoose
        .connect(mongoUrl, { useUnifiedTopology: true, useNewUrlParser: true })
        .then(() => {
            console.log("successfully connected")
        }).catch(error => {
            console.log(error)
            setTimeout(connectWithRetry, 5000)
        })
}

connectWithRetry()

app.enable("trust proxy");
app.use(express.json())
app.use(cors({}))
app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: SESSION_SECRET,
        cookie: {
            secure: false,
            saveUninitialized: false,
            resave: false,
            httpOnly: true,
            maxAge: 60000
        }
    })
)

app.get("/api/v1", (req, res) => {
    console.log("yeah it worked");
    res.send("<h2>App ready, hi there again!!!</h2>");
});
app.use("/api/v1/post", postRouter)
app.use("/api/v1/users", userRouter)

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("App started on ", port)
});
