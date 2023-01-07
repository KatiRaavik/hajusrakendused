const express = require('express')
const fs = require('fs');
const argon2 = require('argon2');
const crypto = require('crypto');
const { parse } = require('path');
const app = express()
const port = 3000

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

/**
 * JSDOC PHPDOC
 * @typedef Task
 * @property {string} name
 * @property {bool} completed True means task is done
 */
/**
 * @typedef User
 * @property {ind} id
 * @property {string} name
 * @property {string} email
 * @property {string} password
 */
/**
 * @typedef Session
 * @property {ind} userId
 * @property {string} token
 * @property {string} createdAt
 * @property {string} name
 */
/** @type {Task[]}*/
let tasks = readJsonFile('tasks.json', []);
/** @type {User[]}*/
let users = readJsonFile('users.json', []);
/** @type {Session[]}*/
let sessions = readJsonFile('sessions.json', []);
let lastIDs = readJsonFile('lastIDs.json', {
    lastTaskId: 0,
    lastUserId: 0,
});

const publicPages = [
    {path: "/"},
    {path: "/users", method: "POST"},
    {path: "/sessions", method: "POST"},
]

function isPublicPage(obj, path, method) {
    if (obj.path != path)
        return false;
    if (!obj.method)
        return true;
    if (obj.method != method)
        return false;
    return true;
}

app.use((req, res, next) => {
    // Allow public pages for session
    if (publicPages.find(page => isPublicPage(page, req.path, req.method))) {
        return next()
    }

    // Remove expired sessions
    sessions = sessions.filter(s => Date.parse(s.createdAt) + 1000 * 60 * 60 * 24 > Date.now())
    writeJsonFile("sessions.json", sessions);

    // Is valid session token?
    let sessionToken = (req.header('authorization') ?? "").substring(7); 
    let session = sessions.find(s => s.token == sessionToken)
    if (!session) {
        return res.status(401).send({error: "Unauthorized"})
    }
    req.currentSession = session;
    next()
})

app.get('/', (req, res) => {
  res.send('API doc!')
})

app.post('/users', async (req, res) => {
    req.body.id = ++lastIDs.lastUserId;
    
    try {
        req.body.password = await argon2.hash(req.body.password);
    } catch (err) {
        res.status(500).send({error: "Failed to create user", err})
    }
    
    users.push(req.body)
    res.send( req.body )
    writeJsonFile('users.json', users);
    writeJsonFile('lastIDs.json', lastIDs);
})

app.post('/sessions', async (req, res) => {
    let user = users.find(user => user.email == req.body.email);
    
    if (!await argon2.verify(user?.password, req.body.password)) {
        // password did not match
        res.status(400).send({error: "Credentials did not match"});
        return;          
    }
    // Create new session
    const session = {
        userId: user.id,
        token: crypto.randomBytes(64).toString('hex'),
        createdAt: Date().toString(),
        name: "",
    }
    sessions.push(session);
    res.send(sessions);
    writeJsonFile("sessions.json", sessions);
})

app.get('/tasks', (req, res) => {
    res.send(tasks.filter(t => t.userId == req.currentSession.userId))
})

app.post('/tasks', (req, res) => {
    req.body.id = ++lastIDs.lastTaskId;  // või uuid() -- on vaja importida/installida
    req.body.userId = req.currentSession.userId;
    tasks.push(req.body)
    res.send( req.body )
    writeJsonFile('tasks.json', tasks);
    writeJsonFile('lastIDs.json', lastIDs);
})

app.put('/tasks/:id', (req, res) => {
    // Check if user owns this task
    if (!tasks.find(t => t.id == req.params.id && t.userId == req.currentSession.userId))
        return res.status(403).send({error: "Task not found"})
    let task = tasks.find(task => task.id == req.params.id)
    // when task don't exist
    // if (!task){
    //     res.status(404).send({error: "Task no found"})
    //     return;
    // }
    // Remove forbidden values
    delete req.body.id
    delete req.body.createdAt
    //Update task
    for (const key in req.body) {
        // if (!['id', 'createdAt'].includes(key))
        task[key] = req.body[key]
    }
    res.send(task)
    writeJsonFile('tasks.json', tasks);
})

app.delete('/tasks/:id', (req, res) => {
    // Check if user owns this task
    if (!tasks.find(t => t.id == req.params.id && t.userId == req.currentSession.userId))
        return res.status(404).send({error: "Task not found"})
    
    // db.command("DELETE tast WHERE id = ':id'", {id: req.params.id})
    let pos = tasks.findIndex(task => task.id == req.params.id)
    if (pos != -1)
        tasks.splice(pos, 1);
    res.send(204).send()
    writeJsonFile('tasks.json', tasks);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

function readJsonFile(fileName, deafultValue){
    try {
        let data = fs.readFileSync('./data/'+fileName, 'utf8');
        return JSON.parse(data);
      } catch (err) {
        console.error(err);
        return deafultValue;
      }
}

function writeJsonFile(fileName, data){
    try {
        fs.writeFileSync('./data/'+fileName, JSON.stringify(data));
      } catch (err) {
        console.error(err, data);
      }
}