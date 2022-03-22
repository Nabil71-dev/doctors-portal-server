//dependencies
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const req = require('express/lib/request');

const app = express();
const port = 8080;
//body parser and cors add on express using use() function
app.use(bodyParser.json())
app.use(cors())
//file upload and save in a folder
app.use(express.static('doctors'));
app.use(fileUpload());


//MonfoDB url connector
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.uskxg.mongodb.net/${process.env.DB_Name}?retryWrites=true&w=majority`;


//MongoDB database conncetion & use
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
    const appoinmentsCollection = client.db(`${process.env.DB_Name}`).collection("appoinments");
    const doctorsCollection = client.db(`${process.env.DB_Name}`).collection("doctors");
    //Insert appoinment for user
    app.post('/addAppoinment', (req, res) => {
        let appoinment = req.body;
        appoinment.appoinment_date = appoinment.appoinment_date.slice(0, 10)
        appoinmentsCollection.insertOne(appoinment)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    });

    //Search appoinments for specific date for dashboard
    app.post('/appoinmentsByDate', (req, res) => {
        let date = req.body;
        date = date.selected_date.slice(0, 10);
        const email = req.body.email;
        //Looking for email match for user data load 
        doctorsCollection.find({ email: email })
            .toArray((err, result) => {
                const filter = { appoinment_date: date };
                if (result.length === 0) {
                    filter.email = email
                }
                appoinmentsCollection.find(filter)
                    .toArray((err, documents) => {
                        res.send(documents);
                    })
            })
    });

    //get all appoinments
    app.get('/allpatients', (req, res) => {
        appoinmentsCollection.find({})
            .toArray((err, result) => {
                res.send(result);
            })
    })

    //add doctor on data base
    app.post('/addadoctor', (req, res) => {

        let file = req.files.file;
        //const filepath = `${__dirname}/doctors/${file.name}`;
        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone;

        //file.mv(filepath, err => {
        // if (err) {
        //     console.log(err)
        //     res.send(500, { msg: 'Failed to upload image' })
        // }

        const newImg = file.data;
        const encodedImg = newImg.toString('base64');

        let image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encodedImg, 'base64')
        }
        doctorsCollection.insertOne({ name, email, phone, image })
            .then(result => {
                // fs.remove(filepath,error=>{
                //     if(error){
                //         console.log(error)
                //     }
                res.send(result.insertedCount > 0)
                //})   
            })
        //})
    })

    //fetch doctor from data base
    app.get('/getdoctors', (req, res) => {
        doctorsCollection.find({})
            .toArray((err, result) => {
                res.send(result);
            })
    })

    //Private route Auth for admin check
    app.post('/isdoctor', (req, res) => {
        const email = req.body.email;
        doctorsCollection.find({ email: email })
            .toArray((err, result) => {
                res.send(result.length > 0);
            })
    })
})

//Conect with local server
app.listen(process.env.port || port, () => {
    console.log('sever is running');
})