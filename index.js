import dotEnv from "dotenv";
dotEnv.config();
import { MongoClient } from "mongodb"
import  cors from "cors"

import express from "express"

const app = express();

const port = 8000

const mongoDBClient = new MongoClient(process.env.MONOGDB_URL);

const connectToMongoDB =async () => {
    try {
        await mongoDBClient.connect();
        console.log("You successfully connected to MongoDB!");
        return mongoDBClient
    } catch (error) {
       console.log(error);
       
    }
}

const client = await connectToMongoDB();

const dataBase = await client.db("bookHive_assginment_eight");

const userCollections = await dataBase.collection("users");
const booksCollections = await dataBase.collection("books");

app.use(cors());
app.use(express.json())

app.get('/', (req ,res)=>{
    res.send("The server is running on port 800")
})

// app.post("/user-create", async(req, res)=>{
//     const userBody =  req.body;
//     console.log(userBody);
    
//     const newUser = await userCollections.insertOne(userBody);

//     res.status(200).send({
//         message : "Success",
//         newUser
//     })
// })

// adding books collection
app.post('/add-book', async (req , res )=>{
    const requestBody = req.body;

     const currentDate = new Date().toLocaleDateString("en-US", {
         day : "numeric",
         month : "long",
        year : "numeric"
     });
    const newBook = await booksCollections.insertOne({...requestBody,createdAt :currentDate});

    res.status(200).send({
        message : "Success",
        newBook
    })
})

app.get('/get-all-books', async ( req , res )=>{
   const allBooks = await booksCollections.find({}).toArray();
   res.status(200).send({message : "Success" , allBooks})
})

app.listen(port, ()=>{
    console.log(`The server is running on port ${port}`);
  
})
