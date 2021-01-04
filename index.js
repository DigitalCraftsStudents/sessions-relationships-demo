require('dotenv').config();    // don't forget to require dotenv

const http = require('http');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const es6Renderer = require('express-es6-template-engine');

const session = require('express-session');  // keeps track of unique users visiting the site
const FileStore = require('session-file-store')(session); // keep the session info in files on the server

const {
    userRouter,
    todoRouter,
    homeRouter
} = require('./routers');

const { requireLogin } = require('./auth')

const app = express();
const server = http.createServer(app);

const PORT = 3000;
const HOST = '0.0.0.0';

const logger = morgan('tiny');

app.engine('html', es6Renderer);
app.set('views', 'templates');
app.set('view engine', 'html');

app.use(session({
    store: new FileStore(),             // store in files on the server
    secret: process.env.SESSION_SECRET, // the secret is like a 2-way encryption key 
    saveUninitialized: false,           // Chris does not know what this does. Or the next two
    resave: true,
    rolling: true,
    cookie: {                           // "magic band"
        maxAge: 1000 * 60 * 60 * 24 * 7 // how miliseconds until it expires, 1 week
    }
}));


app.use(express.static('public'));

app.use(logger);
// Disabling for local development
// app.use(helmet());

// Parse any form data from POST requests
app.use(express.urlencoded({extended: true}));

// Match `/` exactly
app.use('/', homeRouter);

app.get('/unauthorized', (req, res) => {
    console.log('----- so sad...not logged in ----')
    res.send(`You shall not pass!`);
});

app.use('/users', userRouter);

app.use(requireLogin); // this middleware is protecting the rest
                       // of the routes that come after/below
                       // in index.js


const { layout } = require('./utils');
const { Todo } = require('./models');
app.get('/todos/:id', async (req, res) => {
    console.log(`The id of the todo to show is: ${req.params.id}`);
    //res.send(req.params.id);
    // get the specific todo
    // from the database!
    // .findByPk() will retrieve by the id ("primary key")
    const todo = await Todo.findByPk(req.params.id);
    console.log(todo.title);
    res.render('todos/form', {
        locals: {
            title: 'Edit Todo',
            todoTitle: todo.title,
            isComplete: todo.isComplete
        },
        ...layout
    })
}); 
app.post('/todos/:id', async (req, res) => {
    const { title, isComplete } = req.body;
    const { id } = req.params;

    console.log('is it done yet??????');
    console.log(isComplete);

    let newIsComplete = false;
    if (isComplete) {
        newIsComplete = true;
    }

    // Pass .update() two arguments:
    // 1. what attributes to change
    // 2. which Todo to change
    const updatedTodo = await Todo.update({
        // key/value pairs to change
        title,
        isComplete: newIsComplete
    }, {
        // a where-clause that says *which* Todo to update
        where: {
            id
        }
    });

    //res.send(`new info: ${title}`);
    res.redirect('/todos')
});
app.use('/todos', todoRouter);

/* 
in order to edit a todo:

- show the user a form with the title of a specific todo
    - what URL should they go to?
        /todos/7
        /todos/9
        /todos/:id
    - create a route
    - create a controller function
- when the user submits the form, change what's in the database for that specific todo
*/


// requireLogin() is a mini-middleware function
// that runs before our (req, res) => {} handler
// app.get('/members-only', requireLogin,(req, res) => {
app.get('/members-only', (req, res) => {
    console.log('------ in members only area -------')
    console.log(req.session.user);
    const { username } = req.session.user;
    res.send(`

<h1>Hi ${username}!</h1>
<a href="/todos">View Todo list</a>
<br>
<a href="/users/logout">Log out</a>
    `);
});



server.listen(PORT, HOST, () => {
    console.log(`Listening at http://${HOST}:${PORT}`);
});
