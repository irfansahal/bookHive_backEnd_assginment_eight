import dotEnv from "dotenv";
dotEnv.config();
import { MongoClient , ObjectId } from "mongodb"
import  cors from "cors"
import { createRemoteJWKSet, jwtVerify } from "jose"
import express from "express"
import multer from "multer";

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
const categoriesCallections = await dataBase.collection("categories");


app.use(cors());
app.use(express.json())


const validation =async (req , res , next ) => {
   const authHeader = req.headers.authorization
     if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
    const token = authHeader.split(" ")[1]
     if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }

   const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
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

//  const upload = multer({ storage : multer.memoryStorage(), limits: {
// //     fileSize: 5 * 1024 * 1024
// //   },
// //   fileFilter: (req, file, cb) => {
// //     if (file.mimetype.startsWith("image/")) {
// //       cb(null, true);
// //     } else {
// //       cb(new Error("Only image files are allowed"));
// //     }
//   } })

app.post('/add-book', validation ,async (req , res )=>{
    const requestBody = req.body;
    console.log("body",requestBody);
    console.log("file",req.file);
    
    
     const currentDate = new Date().toLocaleDateString("en-US", {
         day : "numeric",
         month : "long",
        year : "numeric"
     });
     const newBook = await booksCollections.insertOne({...requestBody,createdAt :currentDate , createdAtAsUTC : new Date()});

    res.status(200).send({
        message : "Success",
         newBook
    })
})

app.get('/get-all-books' ,async ( req , res )=>{
   const allBooks = await booksCollections.find({}).toArray();
   res.status(200).send({message : "Success" , allBooks})
})

app.get('/get-new-arrivals', async (req , res)=>{
    const sixNewArrivalsBooks = await booksCollections.find({}).limit(6).sort({createdAtAsUTC : -1}).toArray()
    res.status(200).json({
        message : "success",
        sixNewArrivalsBooks
    })
});

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

app.patch('/update-book/:id', validation , async( req , res )=>{
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

app.delete('/delete-book/:id', validation , async (req , res)=>{
    const bookId = req.params.id;

    const deletedBook = await booksCollections.deleteOne({
        _id : new ObjectId(bookId)
    });
    
    res.status(200).json({
        message : "success",
        deletedBook
    })
})

app.post('/create-brrow', validation,  async(req , res)=>{
    const borrowBody = req.body
    
    const isBorrowExists = await borrowsCallections.findOne({
            book_Id : borrowBody.book_Id ,
            userEmail :  borrowBody.userEmail 
    })
    
    if(isBorrowExists){
        return res.status(400).json({
            message : "You already browed the same item"
        })
    }

   const exactBook = await booksCollections.findOne({
     _id : new ObjectId(borrowBody.book_Id)
   })

    if(exactBook.copy <= 0 || !exactBook.copy ){
       return res.status(400).json({
        message : "Current Book Copy Have finished"
       })
    }

    booksCollections.updateOne(
        { _id : new ObjectId(borrowBody.book_Id)},
        { $set : { ...exactBook, copy : exactBook.copy - 1}} 
    ) 

    const newBrrowed = await borrowsCallections.insertOne({...borrowBody, copy : 1});
    res.status(200).json({
        message : "Success",
        newBrrowed
    }) 
})

app.get('/borrows/:email', async (req , res ) =>{
    const CurrentUserEmail = req.params.email
     const myBoorows = await borrowsCallections.find({ 
        userEmail : { $eq : CurrentUserEmail}
     }).toArray();
     res.status(200).send({
        message : "Success",
        myBoorows
     })
})

app.delete("/borrow/:id" , async (req , res)=>{
   const borrowId = req.params.id
    
   const currentBorrow = await borrowsCallections.findOne({
    _id : new ObjectId(borrowId)
   });
     
    const exactBook = await booksCollections.findOne({
        _id : new ObjectId(currentBorrow.book_Id)
    })
    
    await booksCollections.updateOne(
        { _id : new ObjectId(exactBook._id)},
        {
            $set : { ...exactBook , copy : exactBook.copy + 1 }
        }
    )

    const deletedBorrow = await borrowsCallections.deleteOne({
        _id : new ObjectId(borrowId)
    });
    res.status(200).json({
        message : "success",
        deletedBorrow
    }) 
})

// categories

 app.get("/category", async (req , res)=>{
        const categories = await categoriesCallections.find({}).toArray();

        res.status(200).json({ message : "success",
             categories
        })
 })

  app.get('/books-by-category/:category', async (req , res)=>{
    
    const category = req.params.category

    const currentCategory = await categoriesCallections.findOne({
        title : { $eq : category  }
    });

    const currentCategoryBooks = await booksCollections.find({
        category : { $eq : category}
    }).toArray()

    res.status(200).json({
        message : "success",
        currentCategory,
        currentCategoryBooks
    })

  })

app.listen(port, ()=>{
    console.log(`The server is running on port ${port}`);
    
})
