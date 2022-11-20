const express = require ('express')
const app  = express()
const cors = require ('cors')
const port = process.env.PORT || 5000 ;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
// json webtoken 
const jwt = require('jsonwebtoken')

// midleware
app.use(cors())
app.use(express.json())

// server running root file 
app.get('/', (req, res) => {
    res.send("Doctors portal server running ")
})




// mongodb part 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rhjlmgh.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verify user token 
function verifyJWT(req,res,next) {
    const authHeader = req.headers.authorization ;
    if(!authHeader){
         return  res.send(401).send('unauthorized access')

    }
    const token = authHeader.split(' ')[1]
    // jwt verify  call for verify clien req token 
    jwt.verify(token, process.env.ACCESS_TOKEN , function(err , decoded) {
        // if an error occurd , then send the 403 status 
        if(err) {
            return res.status(403).send({message:'forbidden access'})
        }
        //  if not an error occurd doing work 
        req.decoded = decoded ;

        // next must be call for going to next step after verify 
        next();
        
    })
}



const run = async() => {
    try {
     // all option collection 
     const appointmentOptionCollection = client.db('doctors_portal').collection('appointment_option') 
     const bookingsCollection = client.db('doctors_portal').collection('bookings')
     const usersCollection = client.db('doctors_portal').collection('users')
     
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
    
    // get booking data by specific user email  .... call the verifyJWT function 
    app.get('/bookings',verifyJWT, async(req,res) => {
        const email = req.query.email ;
        // find decoded email to match with email 
          const decodedEmail = req.decoded.email ;
          console.log(decodedEmail,'decoded email ')
        // // if decooded email and email are not match 
        // if(decodedEmail !== email){
        //     return res.status(403).send({message:'forbidden access '})
        // }
        // console.log('token check',req.headers.authorization)
        console.log(email)
        const query = {email:email};
        const booking = await bookingsCollection.find(query).toArray()
        res.send(booking)
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

    //    *****  users save data and get data   ******
    // json web token crete  and get token 
    app.get('/jwt', async(req,res) => {
        const email = req.query.email;
        const query = {email:email};
        const user = await usersCollection.findOne(query)
        if(user){
            const token = jwt.sign({email},process.env.ACCESS_TOKEN , {expiresIn:'1h'} )
            return res.send({accessToken:token})
        }
        console.log(user)
        res.status(403  ).send({accessToken:''})
    })
    

    // post data in server to db 
    app.post('/users', async(req,res) => {
        const query = req.body ;
        const userResult = await usersCollection.insertOne(query);
        res.send(userResult)
    })
    
    //  get data from data base 
    


    }
    finally {

    }
}
run().catch(console.dir)




// 
app.listen(port, ()=> {
    console.log("Doctors portal server running on ", port)
})