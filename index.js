const express = require ('express')
const app  = express()
const cors = require ('cors')
const port = process.env.PORT || 5000 ;
const { MongoClient, ServerApiVersion } = require('mongodb');


// midleware
app.use(cors())
app.use(express.json())

// server running root file 
app.get('/', (req, res) => {
    res.send("Doctors portal server running ")
})

// mongodb 
/*
username:DB_USER
pass:DB_PASSWORD

*/

const uri = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.rhjlmgh.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});


// 
app.listen(port, ()=> {
    console.log("Doctors portal server running on ", port)
})