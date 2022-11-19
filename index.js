const express = require ('express')
const app  = express()
const cors = require ('cors')
const port = process.env.PORT || 5000 ;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()

// midleware
app.use(cors())
app.use(express.json())

// server running root file 
app.get('/', (req, res) => {
    res.send("Doctors portal server running ")
})

// mongodb 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rhjlmgh.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async() => {
    try {
     // all option collection 
     const appointmentOptionCollection = client.db('doctors_portal').collection('appointment_option') 
     const bookingsCollection = client.db('doctors_portal').collection('bookings')
     
     // get all appointment option from db 
    app.get('/appointment_option', async(req,res) =>  {
        // find date using date format whice req from client 
        const date = req.query.date ;
        const query = {}
        const options = await appointmentOptionCollection.find(query).toArray()

        // find all booking by a specific date and all treatement 
        const bookingQuery = {appointment_date:date}
        const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray()
        options.forEach(option => {
        const  optionBooked = alreadyBooked.filter(book => book.appointmentName === option.name)
        const bookedSlots = optionBooked.map(book =>  book.slots)

        // get remaining slots whice are not booking 
        const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot) )
        option.slots = remainingSlots ;
     
        });
        res.send(options);
    })
    

    // insert bookings data in db
    app.post('/bookings', async(req, res)=> {
        const booking = req.body ;
        // limit booking , if a user booking a service , he cannot able to again booking same treatment, same date 
        console.log(booking)
        const query = {
            appointment_date: booking.appointment_date,
            appointmentName : booking.appointmentName ,
       
        }
        const alreadyBooked = await bookingsCollection.find(query).toArray();
        // // only length means that length = 1 or equal
         console.log(alreadyBooked)
        if(alreadyBooked.length){
        const message = `You already have  booking on  ${booking.appointment_date} `
        return res.send({acknowledged: false , message})
        }
        const result = await bookingsCollection.insertOne(booking)
        res.send(result)
    })

    }
    finally {

    }
}
run().catch(console.dir)




// 
app.listen(port, ()=> {
    console.log("Doctors portal server running on ", port)
})