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
app.use(express.static('public'));

function isValidDate(dateString) {
    if (dateString.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/) && new Date(dateString).toString() !== 'Invalid Date') {
        return true;
    }
    return false;
}
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});




const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
app.post('/api/users', (req, res) => {
    
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

app.post("/api/users/:_id/exercises", (req, res) => {
    const _id = req.params._id
    const { description, duration, username } = req.body;

if(!description){
  res.send(' Path `description` is required.');
 
}
if(!duration){
  res.send(' Path `duration` is required.');
 
}
 
    // validate date 
    if (req.body.date !== undefined && req.body.date.length>0  && !isValidDate(req.body.date)) {
        res.send("Invalid date provided");
    }
    const date = req.body.date !== undefined && req.body.date.length>0 ? new Date(req.body.date):new Date();
    // create a log out of the description, duration and date fields
    const log = {
        description,
        duration:Number(duration),
        date
    };



    const options = { new: true };
    const update = {
        $push: {
            log
        }
    };


    // look for a document with a matching _id value
    ExerciseTrackerUser.findOneAndUpdate({
        _id
    },
        update,
        options, (err, dbUser) => {
            if (err) {
                console.error(err);
            }

            if (dbUser) {            
                const { username } = dbUser;         
                res.json({
                    _id,
                    username,
                     date: date.toDateString(),
                    duration :Number(duration),
                    description,
                  
                    
                });
            } else {
                res.send('unknown _id');
            }
        });
});

app.get('/api/users/:_id/logs', (req, res) => {


    const _id = req.params._id
    const { from, to, limit } = req.query;


    ExerciseTrackerUser.findById({
        _id
    }, (err, dbUser) => {
        if (err) {
            console.log(err);
        }

        if (dbUser) {
           
            const { _id , username, log ,
                    description,
                    duration} = dbUser;
            let tmpLog = [...log];
            if (from) {
                if (!isValidDate(from)) {
                    res.json({ error: "'from' date is INVALID" });
                    return;
                }
                const dateFrom = new Date(from);
                tmpLog = tmpLog.filter(exercise => exercise.date >= dateFrom);
            }




            if (to) {
                if (!isValidDate(to)) {
                    res.json({
                        error: "'to' date is INVALID"
                    });
                    return;
                }
                const dateTo = new Date(to);
                tmpLog = tmpLog.filter(exercise => exercise.date <= dateTo);
            }
            if (limit) {
                tmpLog = tmpLog.slice(0, parseInt(limit));
            }


                res.json({
                    _id,
                    username,
                    count:tmpLog.length,
                    log:tmpLog
                });

        }
    });

});

// API array of users
app.get("/api/users", (req, res) => {
  ExerciseTrackerUser.find({}, "username _id").then((response) => {
    res.json(response);
  });
});