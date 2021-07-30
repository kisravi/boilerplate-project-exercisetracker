const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

var bodyParser = require("body-parser");
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log('error connecting mongoose');
  console.log(e);
}
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI);
const exerciseTrackerUserSchema = new Schema({
 username: {
    type: String,
    required: true
  },
  log: [{
    description: {
      type: String
    },
    duration: {
      type: Number
    },
    date: {
      type: Date
    }
  }]
});
const ExerciseTrackerUser = mongoose.model("ExerciseTrackerUser", exerciseTrackerUserSchema);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
app.post('/api/users', (req, res) => {
  console.log(req.body);

  ExerciseTrackerUser.findOne({
    username: req.body.username
  }, (err, userFound) => {
    if (err) {
      console.error(err);
    }
    //found User
    if (userFound) {

      res.send('username already taken');
    } else {
      // create new document 
      const userToPersist = new ExerciseTrackerUser({
        username: req.body.username,
        log: []
      });

      userToPersist.save((err, savedUser) => {
        if (err) {
          console.error(err);
        }
        
        const { _id, username } = savedUser;
        res.json({
          username,
          _id
        });
      });
    }
  });
});