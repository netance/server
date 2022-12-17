let urlString = location.href
let paramString = urlString.split("?")[1]
let queryString = new URLSearchParams(paramString)
let address

let hash
let lt

function eescape(string) {
  var htmlEscapes = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }

  return string.replace(/[&<>"']/g, function (match) {
    return htmlEscapes[match]
  })
}
function utf8_to_b64(str) {
  return window.btoa(unescape(encodeURIComponent(str)))
}
function b64_to_utf8(str) {
  return decodeURIComponent(escape(window.atob(str)))
}

for (let pair of queryString.entries()) {
  if (pair[0] == "address") {
    if (pair[1] == "" || pair[1].length < 48 || pair[1].length > 48) {
      $("#error-title").text("Address not found")
      $("#error-desc").text("Check address and try again.")
      $("#error").show()
      address = "err"
    } else {
      address = pair[1]
    }
  } else if (pair[0] == "hash") {
    hash = pair[1]
  } else if (pair[0] == "lt") {
    lt = pair[1]
  } else if (pair[0] == "first") {
    if (pair[1] == "true") {
      $("#reminder").show()
    }
  }
}
for (let pair of queryString.entries()) {
  if (pair[0] == "first") {
    if (pair[1] == "true") {
      $("#first").show()
    }
  }
}
if (address != "err") {
  $.ajax({
    type: "GET",
    url: `/gettransaction?address=${address}&lt=${lt}&hash=${encodeURIComponent(
      hash
    )}`,
    success: function (response) {
      if (response.status == "success") {
        let post = response.data[0]
        if (
          post.in_msg.value == 0 &&
          post.out_msgs[0].value != 0 &&
          post.out_msgs[0].message != "" &&
          post.out_msgs[0].message.startsWith("post")
        ) {
          try {
            let time = new Date(parseInt(post.utime + "000")).toLocaleString()
            let message_object = JSON.parse(
              post.out_msgs[0].message.replace("post", "")
            )

            if (
              message_object.msg == "" ||
              eescape(b64_to_utf8(message_object.msg)).length > 200
            ) {
              return
            }

            // if is post
            if (message_object.type == "post") {
              console.log(message_object)
              $("#post").append(
                `<div class="post" id="${encodeURIComponent(
                  post.transaction_id.hash
                )}"><p id="posttext">${eescape(
                  b64_to_utf8(message_object.msg)
                )}</p><p>${time}</p><p><a href="/b?address=${address}">${address}</a></p></div>`
              )
              $("#post").show()
              $("#write-div").show()
            }
          } catch {
            return
          }
        }
      }
    },
    error: function (e) {
      $("#error-title").text(e.responseJSON.title)
      $("#error-desc").text(e.responseJSON.description)
      $("#error").show()
    },
  })
  $.ajax({
    type: "GET",
    url: `/getposts?address=${address}`,
    success: function (response) {
      if (response.status == "error") {
        console.error("err")
        $("#error-title").text(response.title)
        $("#error-desc").text(response.description)
        $("#error").show()
      } else if (response.status == "success") {
        render(response.data)
      }
    },
    error: function (e) {
      console.log(e.responseJSON)
      $("#error-title").text(e.responseJSON.title)
      $("#error-desc").text(e.responseJSON.description)
      $("#error").show()
    },
  })
}

function render(transactions) {
  for (let post of transactions) {
    // console.log(post.in_msg)
    console.log(0)
    if (
      post.out_msgs.length == 0 &&
      post.in_msg.message.startsWith("post_answer")
    ) {
      console.log(1)
      try {
        let time = new Date(parseInt(post.utime + "000")).toLocaleString()
        let message_object = JSON.parse(
          post.in_msg.message.replace("post_answer", "")
        )
        console.log(2)

        if (
          message_object.msg == "" ||
          message_object.msg.length > 200 ||
          message_object.reply_to.lt != lt ||
          message_object.reply_to.hash.split(" ").join("+") != hash
        ) {
          continue
        }
        console.log(3)

        // if is post
        if (message_object.type == "post") {
          $("#posts").append(
            `<div class="post" id="${eescape(
              post.transaction_id.hash
            )}"><p>${eescape(
              b64_to_utf8(message_object.msg)
            )}</p><p>${time}</p><p><a href="/b?address=${eescape(
              post.in_msg.source
            )}">${eescape(post.in_msg.source)}</a></p></div>`
          )
        }
      } catch {
        continue
      }
    }
  }
}

$("#answer-send").click(function () {
  $.ajax({
    type: "GET",
    url: `/instanceinfo`,
    success: function (response) {
      console.log(response)
      let comment = utf8_to_b64($("#answer-text").val())
      location.href = `ton://transfer/${address}?amount=${response.amount}&text=post_answer{"type":"post","msg":"${comment}","reply_to":{"lt":"${lt}","hash":"${hash}"}}`
    },
  })
})
