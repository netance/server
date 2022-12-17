let urlString = location.href
let paramString = urlString.split("?")[1]
let queryString = new URLSearchParams(paramString)
let address

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
      $("#address").text(address)
    }
  }
}
console.log(address)
if (address != "err") {
  $.ajax({
    type: "GET",
    url: `/getposts?address=${address}`,
    success: function (response) {
      console.log(response)
      if (response.status == "error") {
        console.error("err")
        $("#error-title").text(response.title)
        $("#error-desc").text(response.description)
        $("#error").show()
      } else if (response.status == "success") {
        $("#addresslink").attr("href", `https://tonscan.org/address/${address}`)
        $("#address-info").show()
        render(response.data)
      }
    },
    error: function (e) {
      $("#error-title").text(e.responseJSON.title)
      $("#error-desc").text(e.responseJSON.description)
      $("#error").show()
    },
  })
}

function render(transactions) {
  for (let post of transactions) {
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
          continue
        }

        // if is post
        if (message_object.type == "post") {
          console.log(message_object)
          $("#posts").append(
            `<a href="/p?address=${post.out_msgs[0].source}&lt=${
              post.transaction_id.lt
            }&hash=${encodeURIComponent(
              post.transaction_id.hash
            )}"><div class="post" id="${encodeURIComponent(
              post.transaction_id.hash
            )}"><p>${eescape(
              b64_to_utf8(message_object.msg)
            )}</p><p>${time}</p></div></a>`
          )
        }
      } catch {
        continue
      }
    }
  }
}
