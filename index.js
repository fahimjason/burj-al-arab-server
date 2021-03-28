const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4i8kb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const port = 4200;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const password = 'burj123';

var serviceAccount = require("./configs/burj-al-arab-jisan-firebase-adminsdk-7zwsd-13dcce1f25.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collection = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTION);


    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        collection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    });


    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail === queryEmail) {
                        collection.find({ email: queryEmail })
                            .toArray((err, bookings) => {
                                res.status(200).send(bookings)
                            })
                    }
                    else {
                        res.status(401).send('Un-authorized');
                    }
                })
                .catch((error) => {
                    res.status(401).send('Un-authorized');
                });
        }
        else {
            res.status(401).send('Un-authorized');
        }
    })

});



app.get('/', (req, res) => {
    res.send('Hello, world')
})


app.listen(process.env.DB_HOST)