const http = require('http')
const fs = require('fs')
const express = require('express')
const app = express()
const port = 3000
const filePath = './assets/data.json'

app.use(express.json()) // Middleware para parsear el cuerpo de la solicitud como JSON
const writeFile = (filePath, text) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, text, err => {
      if (err) {
        reject(err)
      } else {
        resolve('archivo escrito correctamente')
      }
    })
  })
}

const verifyExistFile = (filePath, text) => {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, err => {
      if (err) {
        writeFile(filePath, text)
          .then(message => resolve(message))
          .catch(err => reject(err))
      } else {
        resolve('archivo creado ya previamente')
      }
    })
  })
}

const readContentFile = filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

verifyExistFile(filePath, '[]').then(message => console.log(message))

app.get('/user', async (req, res) => {
  let users = await readContentFile(filePath)
  console.log(users)
  res.send(JSON.parse(users))
})

app.post('/user', async (req, res) => {
  const { name, lastname } = req.body

  let users = await readContentFile(filePath)
  users = JSON.parse(users)
  users.push({ name, lastname })
  await writeFile(filePath, JSON.stringify(users))
  res.send(users)
})

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`)
})
