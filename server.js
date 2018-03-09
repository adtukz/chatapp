// adding all the libraries for the app to work properly
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')

//makes the app asynchronis
app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

//mongoose to set up the data that will be entered into the database
mongoose.Promise = Promise

//the url to connect to the database
var dbUrl = 'mongodb://user:user@ds259268.mlab.com:59268/messaging'

//declares the model of a standard message // all the parts of a message for the database.
var Message = mongoose.model('Message', {
    name: String,
    message: String,
    colour: String,
    size: String,
    date: String
})

//gets messages from the server
app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages)
    })
})

//Sends the message the user has entered to the server, first checking for "badword" if it is successful it posts status 200, if it fails status 500 is posted
app.post('/messages', async (req, res) => {

    try {
        var message = new Message(req.body)

        var savedMessage = await message.save()

        console.log('saved')

        var censored = await Message.findOne({ message: 'badword' })

        if (censored)
            await Message.remove({ _id: censored.id })
        else
            io.emit('message', req.body)

        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
        return console.error(error)
    } finally {
        console.log('message post called')
    }
})


// everytime a user connects "a user connected" is logged to the terminal of the server
io.on('connection', (socket) => {
    console.log('a user connected')
})

//tells us that mongoose has connected properly
mongoose.connect(dbUrl, { useMongoClient: true }, (err) => {
    console.log('mongo db connection', err)
})

// picks the port the server will be listening to for connections.
var server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
})