const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')

const LIFETIME = 60 * 60 * 1000

const {
  PORT = 3000,
  NODE_ENV = 'development',

  SESS_NAME = 'sid',
  SESS_SECRET = 'secret',
  SESS_LIFETIME = LIFETIME,
} = process.env

const IN_PROD = NODE_ENV === 'production'

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))

app.use(
  session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
      maxAge: SESS_LIFETIME,
      sameSite: true,
      secure: IN_PROD,
    },
  })
)

const users = [
  { id: 1, name: 'Alex', email: 'alex@gmail.com', password: 'pass' },
  { id: 2, name: 'Sasha', email: 'sasha@gmail.com', password: 'pass' },
  { id: 3, name: 'Pasha', email: 'pasha@gmail.com', password: 'pass' },
]

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect('/login')
  } else {
    next()
  }
}

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    res.redirect('/home')
  } else {
    next()
  }
}

app.use((req, res, next) => {
  const { userId } = req.session
  if (userId) {
    res.locals.user = users.find(user => user.id == userId)
  }
  next()
})

app.get('/', (req, res) => {
  const { userId } = req.session
  res.send(`
    <h1>Welcome!</h1>
    ${
      !userId
        ? `<a href="/login">Login</a>
    <a href="/register">Register</a>`
        : `<a href="/home">Home</a>
    <form method='post' action='/logout'>
      <button>Logout</button>
    </form>`
    }
  `)
})

app.get('/home', redirectLogin, (req, res) => {
  const { user } = res.locals
  res.send(`
  <h1>Home</h1>
  <a href="/">Main</a>
  <ul>Name: ${user.name}</ul>
  <ul>Email: ${user.email}</ul>
  `)
})

app.get('/login', redirectHome, (req, res) => {
  res.send(`
  <h1>Login</h1>
  <form method='post' action='/login'>
    <input type='email' name='email' placeholder='Email' required/>
    <input type='password' name='password' placeholder='Password' required/>
    <button>Login</button>
  </form>
  <a href="/register">Register</a>
  `)
})

app.get('/register', redirectHome, (req, res) => {
  res.send(`
  <h1>Register</h1>
  <form method='post' action='/register'>
    <input name='name' placeholder='Name' required/>
    <input type='email' name='email' placeholder='Email' required/>
    <input type='password' name='password' placeholder='Password' required/>
    <button>Register</button>
  </form>
  <a href="/login">Login</a>
  `)
})

app.post('/login', redirectHome, (req, res) => {
  const { email, password } = req.body

  if (email && password) {
    const user = users.find(
      user => user.email == email && user.password == password
    )

    if (user) {
      req.session.userId = user.id
      return res.redirect('/home')
    }
  }

  res.redirect('/login')
})

app.post('/register', redirectHome, (req, res) => {
  const { name, email, password } = req.body

  if (name && email && password) {
    const exist = users.some(
      user => user.email == email || user.password == password
    )

    if (!exist) {
      const user = {
        id: users.length + 1,
        name,
        email,
        password,
      }

      users.push(user)

      req.session.userId = user.id

      res.redirect('/home')
    }
  }

  res.redirect('/register')
})

app.post('/logout', redirectLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/home')
    }
    res.clearCookie(SESS_NAME)
    res.redirect('/login')
  })
})

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} is working!`)
})
