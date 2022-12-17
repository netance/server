let urlString = location.href
let paramString = urlString.split("?")[1]
let queryString = new URLSearchParams(paramString)

for (let pair of queryString.entries()) {
  if (pair[0] == "first") {
    if (pair[1] == "true") {
      $("#first").show()
    }
  }
}
function utf8_to_b64(str) {
  return window.btoa(unescape(encodeURIComponent(str)))
}
function b64_to_utf8(str) {
  return decodeURIComponent(escape(window.atob(str)))
}

$("#post-button").click(function () {
  $.ajax({
    type: "GET",
    url: `/instanceinfo`,
    success: function (response) {
      console.log(response)
      let comment = utf8_to_b64($("#post-text").val())
      location.href = `ton://transfer/${response.address}?amount=${response.amount}&text=post{"type":"post","msg":"${comment}"}`
    },
  })
})
$("#letters-count").text($("#post-text").val().length)
if ($("#post-text").val().length > 200) {
  $("#post-button").prop("disabled", true)
  $("#post-button").css("background-color", "#202020")
} else {
  $("#post-button").prop("disabled", false)
  $("#post-button").css("background-color", "white")
}
$("#post-text").on("input", function () {
  $("#letters-count").text($(this).val().length)
  if ($(this).val().length > 200) {
    $("#post-button").prop("disabled", true)
    $("#post-button").css("background-color", "#202020")
  } else {
    $("#post-button").prop("disabled", false)
    $("#post-button").css("background-color", "white")
  }
})
