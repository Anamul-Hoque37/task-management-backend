const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mslut.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const taskCollection = client.db('task-management').collection('tasks');

        // Add a new task
        app.post('/tasks', async (req, res) => {
            const task = req.body;
            if (!task.title || !task.category) {
                return res.status(400).send({ error: 'Title and Category are required.' });
            }
            task.timestamp = new Date().toISOString();
            const result = await taskCollection.insertOne(task);
            res.send(result);
        });

        // Get all tasks grouped by category
        app.get('/tasks', async (req, res) => {
            const tasks = await taskCollection.find().toArray();
            const groupedTasks = {
                'To-Do': tasks.filter(task => task.category === 'To-Do'),
                'In Progress': tasks.filter(task => task.category === 'In Progress'),
                'Done': tasks.filter(task => task.category === 'Done'),
            };
            res.send(groupedTasks);
        });

        // Update a task
        app.patch('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const { title, description, category } = req.body;
            if (!title && !description && !category) {
                return res.status(400).send({ error: 'At least one field (title, description, or category) is required.' });
            }
            const updateFields = {};
            if (title) updateFields.title = title;
            if (description) updateFields.description = description;
            if (category) updateFields.category = category;

            const result = await taskCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateFields }
            );
            res.send(result);
        });

        // Delete a task
        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Task Management Platform server is running');
});

app.listen(port, () => {
    console.log(`Task Management server is running on port: ${port}`);
});