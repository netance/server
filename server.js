const express = require("express")
const axios = require("axios")
const fs = require("fs")
const sqlite = require("better-sqlite3")

if (!fs.existsSync("banned.db")) {
  fs.openSync("banned.db", "w")
  let banned_db = new sqlite("banned.db")
  banned_db
    .prepare(
      "CREATE TABLE IF NOT EXISTS banned (address TEXT primary key, reason TEXT)"
    )
    .run()
}

const banned_db = new sqlite("banned.db")

async function checkAddress(address) {
  result = await banned_db
    .prepare("SELECT * FROM banned WHERE address = ?")
    .all(address)
  if (result.length > 0) {
    return result[0]
  } else {
    return true
  }
}

const app = express()
const config = JSON.parse(fs.readFileSync(__dirname + "/config.json"))
const ton_provider = config.ton_provider

app.use(express.static(__dirname + "/public"))

app.get("/getposts", async (req, res) => {
  if (
    req.query.address == "" ||
    req.query.address.length < 48 ||
    req.query.address.length > 48
  ) {
    res.status(403).send({
      status: "error",
      title: "Address format is invalid",
      description: "Check address and try again.",
    })
    return
  }
  let checked = await checkAddress(req.query.address)
  if (checked != true) {
    res.status(403).send({
      status: "error",
      title: "The address is banned on this instance",
      description: checked.reason,
    })
    return
  }
  let ok = true
  let results = []
  while (ok) {
    await axios({
      method: "get",
      url: `${ton_provider}/getTransactions?address=${req.query.address}&limit=1500000&to_lt=0&archival=true`,
    })
      .then(function (response) {
        results = response.data.result
        ok = false
      })
      .catch(function (err) {
        if (err.response != undefined) {
          ok = false
          if (
            err.response.data.error ==
              "LITE_SERVER_UNKNOWN: cannot locate transaction in block with specified logical time" ||
            err.response.data.error ==
              "LITE_SERVER_UNKNOWN: cannot compute block with specified transaction: lt not in db" ||
            err.response.data.error ==
              "LITE_SERVER_UNKNOWN: cannot compute block with specified transaction: ltdb: block not found"
          ) {
            res.status(500).send({
              status: "error",
              title: "Transaction not found",
              description: "Check lt and try again.",
            })
          } else if (err.response.data.error == "Invalid hash") {
            res.status(503).send({
              status: "error",
              title: "Transaction not found",
              description: "Check hash and try again.",
            })
          } else if (err.response.data.error == "Incorrect address") {
            res.status(416).send({
              status: "error",
              title: "Transaction not found",
              description: "Check address and try again.",
            })
          }
        }
      })

    if (results != []) {
      for (let transaction of results) {
        try {
          if (transaction.in_msg.message.startsWith("post_answer")) {
            let checked = await checkAddress(transaction.in_msg.source)
            if (checked != true) {
              results.splice(results.indexOf(transaction), 1)
            }
          }
        } catch {
          continue
        }
      }
      res.status(200).send({ status: "success", data: results })
      ok = false
    }
  }
})
app.get("/gettransaction", async (req, res) => {
  if (
    req.query.address == "" ||
    req.query.address.length < 48 ||
    req.query.address.length > 48
  ) {
    res.status(403).send({
      status: "error",
      title: "Address format is invalid",
      description: "Check address and try again.",
    })
    return
  }
  let checked = await checkAddress(req.query.address)
  if (checked != true) {
    res.status(403).send({
      status: "error",
      title: "The address is banned on this instance",
      description: checked.reason,
    })
    return
  }
  let ok = true
  while (ok) {
    try {
      await axios({
        method: "get",
        url: `${ton_provider}/getTransactions?address=${
          req.query.address
        }&limit=1&lt=${req.query.lt}&hash=${encodeURIComponent(
          req.query.hash
        )}&to_lt=0&archival=true`,
      })
        .then(function (response) {
          ok = false
          res.send({ status: "success", data: response.data.result })
        })
        .catch(function (err) {
          ok = false
          if (
            err.response.data.error ==
              "LITE_SERVER_UNKNOWN: cannot locate transaction in block with specified logical time" ||
            err.response.data.error ==
              "LITE_SERVER_UNKNOWN: cannot compute block with specified transaction: lt not in db" ||
            err.response.data.error ==
              "LITE_SERVER_UNKNOWN: cannot compute block with specified transaction: ltdb: block not found"
          ) {
            res.status(500).send({
              status: "error",
              title: "Transaction not found",
              description: "Check lt and try again.",
            })
          } else if (err.response.data.error == "Invalid hash") {
            res.status(503).send({
              status: "error",
              title: "Transaction not found",
              description: "Check hash and try again.",
            })
          } else if (err.response.data.error == "Incorrect address") {
            res.status(416).send({
              status: "error",
              title: "Transaction not found",
              description: "Check address and try again.",
            })
          }
        })
    } catch (err) {
      continue
    }
  }
})
app.get("/banned_users_list", async (req, res) => {
  result = await banned_db.prepare("SELECT * FROM banned").all()
  res.status(200).send({ status: "success", data: result })
})

app.get("/b", async (req, res) => {
  res.sendFile(__dirname + "/templates/b.html")
})
app.get("/p", async (req, res) => {
  res.sendFile(__dirname + "/templates/p.html")
})
app.get("/create", async (req, res) => {
  res.sendFile(__dirname + "/templates/create.html")
})
app.get("/instanceinfo", async (req, res) => {
  res.send({
    name: config.name,
    address: config.address,
    amount: config.amount,
  })
})
app.get("/privacy", async (req, res) => {
  res.redirect(config.privacy)
})
app.get("/terms", async (req, res) => {
  res.redirect(config.terms)
})

app.listen(3001)
