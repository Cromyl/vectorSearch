import express from "express";
import connect from "./database/conn.js";
// import Post from "./model/post.js";
import { model1 as Post, model2 as unMatched } from "./model/post.js";
import fs from "fs";
import multer from "multer";
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(express.json());
const port = 5000;

app.get('/', (req, res) => {
    try {
        res.status(200).json("Home route")
    } catch (error) {
        res.status(400).json({ error })
    }
})

app.post('/api/upload', async (req, res) => {


    try {
        //console.log(req.body)
        const { file, embeddings } = req.body;
        //console.log("file",file," embeddings ",embeddings);
        //if(file===undefined) return res.status(400).send("file undefined");
        const obj = {
            file: file,
            embeddings: embeddings
        }
        const data = await Post.create(obj);
        data.save();
        res.status(200).json({ message: "New data uploaded !!" })
    } catch (error) {
        return res.status(400).json(error);
    }
})

app.post('/api/checkSimilarity', async (req, res) => {
    try {
        const { file, embeddings } = req.body;
        const documents = await Post.aggregate([
            {
                $vectorSearch: {
                    queryVector: embeddings,
                    path: "embeddings",
                    numCandidates: 100,
                    limit: 1,
                    index: "default",

                }
            }, {
                '$project': {
                    '_id': 0,
                    'file': 1,
                    'score': {
                        '$meta': 'vectorSearchScore'
                    }
                }
            }
        ])
        var score=0;
        documents.forEach(document => {
            score=document.score;
        });
        console.log("score = ",score);
        if (score > 0.9) {
            return res.status(200).send(documents);
        }
        const obj = {
            file: file,
            embeddings: embeddings
        }
        const data = await unMatched.create(obj);
        data.save();
        return res.status(200).send("No match found");
    } catch (err) {
        return res.status(400).json(err);
    }
})

app.post('/api/checkImage',async (req,res)=>{
    const {id,option}=req.body;
    const doc = await unMatched.findOneAndDelete({_id:id});
    if(!doc) return res.status(400).send("Object not found ");
    if(object===1){
        const newDoc=await Post.create(doc.toObject());
        await newDoc.save();
    }
    return res.status(200).send("Done successfully")
})

app.get('/api/getUnMatched',async (req,res)=>{
    const doc=await unMatched.find({});
    return res.status(200).json(doc);
})


app.post('/api/query', async (req, res) => {
    const { embeddings } = req.body
    const documents = await Post.aggregate([
        {
            $vectorSearch: {
                queryVector: embeddings,
                path: "embeddings",
                numCandidates: 100,
                limit: 5,
                index: "default",

            }
        }, {
            '$project': {
                '_id': 0,
                'file': 1,
                'score': {
                    '$meta': 'vectorSearchScore'
                }
            }
        }
    ])
    return res.status(200).json(documents);
})

app.post('/api/base64', upload.single('file'), async (req, res) => {
    try {
        const file = req.file.path;
        console.log(file);
        const base64 = await convertToBase64(file);
        fs.unlinkSync(req.file.path);
        return res.status(200).json(base64);
    } catch (error) {
        return res.status(400).json(error);
    }
})

function convertToBase64(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            // Convert the file data to a base64 string
            const base64Data = Buffer.from(data).toString('base64');
            resolve(base64Data);
        });
    });
}

connect().then(() => {
    try {
        app.listen(port, () => {
            console.log(`Server connected to port ${port}`)
        })
    } catch (error) {
        console.log("Cannot connect to the server");
    }
}).catch((error) => {
    console.log("Invalid DB Connection")
})