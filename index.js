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
        // await client.connect();
        const taskCollection = client.db('task-management').collection('tasks');
        const userCollection = client.db('task-management').collection('users');


        // User data API
        app.post('/users', async (req, res) => {
          const user = req.body;
          console.log(user);
          // insert email if user doesnt exists:
          const query = { email: user.email }
          const existingUser = await userCollection.findOne(query);
          if (existingUser) {
              return res.send({ message: 'user already exists', insertedId: null })
          }
          const result = await userCollection.insertOne(user);
          res.send(result);
        });

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
        // app.get('/tasks/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { userEmail: email };
        //     const tasks = await taskCollection.find(query).toArray();
        //     const groupedTasks = {
        //         'To-Do': tasks.filter(task => task.category === 'To-Do'),
        //         'In Progress': tasks.filter(task => task.category === 'In Progress'),
        //         'Done': tasks.filter(task => task.category === 'Done'),
        //     };
        //     res.send(groupedTasks);
        // });

        app.get('/tasks/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            try {
                const tasks = await taskCollection.find(query).toArray();
                const groupedTasks = {
                    'To-Do': tasks.filter(task => task.category === 'To-Do'),
                    'In Progress': tasks.filter(task => task.category === 'In Progress'),
                    'Done': tasks.filter(task => task.category === 'Done'),
                };
                console.log('Grouped Tasks:', groupedTasks); // Debugging
                res.send(groupedTasks);
            } catch (error) {
                console.error('Error fetching tasks:', error); // Debugging
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        // Update a task
        app.patch('/tasks/:id', async (req, res) => {
          const id = req.params.id;
          const { category } = req.body;
      
          if (!category) {
              return res.status(400).send({ error: 'Category is required.' });
          }
      
          const result = await taskCollection.updateOne(
              { _id: new ObjectId(id) },
              { $set: { category } }
          );
      
          res.send(result);
      });

        // Delete a task
        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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