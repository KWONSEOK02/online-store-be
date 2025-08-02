const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const indexRouter = require('./routes/index');

require("dotenv").config();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // req.body가 객체로 인식이 됨

app.use('/api', indexRouter);

const mongoURI = process.env.LOCAL_DB_ADDRESS

mongoose.connect(mongoURI, { useNewUrlParser: true})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("DB Connection fail : ", err));


app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
});