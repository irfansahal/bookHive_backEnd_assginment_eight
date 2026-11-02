import dotEnv from "dotenv";
dotEnv.config();
import { MongoClient , ObjectId } from "mongodb"
import  cors from "cors"
import { createRemoteJWKSet, jwtVerify } from "jose"
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
const borrowsCallections = await dataBase.collection("borrows");

app.use(cors());
app.use(express.json())


const validation =async (req , res , next ) => {
   const authHeader = req.headers.authorization

   const token = authHeader.split(" ")[1]

   const JWKS = createRemoteJWKSet(
    new URL('http://localhost:3000/api/auth/jwks')
   );

   try {
    const {  payload } = await jwtVerify(token, JWKS);
   console.log("from server", token);
   next()
   } catch (error) {
    return res.status(500).send({ message : "Server Error!"})
   }
}


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
app.post('/add-book', validation ,async (req , res )=>{
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

app.get('/get-all-books' ,async ( req , res )=>{
   const allBooks = await booksCollections.find({}).toArray();
   res.status(200).send({message : "Success" , allBooks})
})

app.get('/get-book/:id', async (req , res)=>{
   const bookId = req.params.id;

   const book = await booksCollections.findOne({_id : new  ObjectId(bookId)});
   res.status(200).send({message : "success", book})
})

app.get('/get-my-books/:email', async (req , res)=>{
   const userEmail = req.params.email;
   const myBooks = await booksCollections.find({
    email : { $eq : userEmail }
   }).toArray();
   
   res.status(200).send({
    message : "success",
    myBooks
   })
})

app.patch('/update-book/:id', async( req , res )=>{
      const bookId = req.params.id;
      const updateBody = req.body;

      const updatedBook = await booksCollections.updateOne(
         { _id : new ObjectId(bookId)},
         { $set : updateBody }
    );
    
    res.status(200).json({
        message : "success",
        updatedBook
    })
})

app.delete('/delete-book/:id', async (req , res)=>{
    const bookId = req.params.id;

    const deletedBook = await booksCollections.deleteOne({
        _id : new ObjectId(bookId)
    });
    
    res.status(200).json({
        message : "success",
        deletedBook
    })
})

app.post('/create-brrow', async(req , res)=>{
    const borrowBody = req.body
    const newBrrowed = await borrowsCallections.insertOne(borrowBody);
    res.status(200).json({
        message : "Success",
        newBrrowed
    }) 
})

app.get('/borrows', async (req , res ) =>{
     const myBoorows = await borrowsCallections.find({}).toArray();
     res.status(200).send({
        message : "Success",
        myBoorows
     })
})

app.delete("/borrow/:id" , async (req , res)=>{
   const borrowId = req.params.id
    const deletedBorrow = await borrowsCallections.deleteOne({
        _id : new ObjectId(borrowId)
    });
    res.status(200).json({
        message : "success",
        deletedBorrow
    }) 
})

app.listen(port, ()=>{
    console.log(`The server is running on port ${port}`);
    
})
