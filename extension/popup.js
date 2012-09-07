onload = function() {
  document.getElementById('posting-form').onsubmit = handleFormSubmit;
};

function handleFormSubmit(event) {
  event.preventDefault();

  var note = document.getElementById('note').value;

  getSignature(function(signature) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      alert('success: ' + xhr.responseText);
    };
    xhr.onerror = function() {
      alert('failure: ' + xhr.responseText);
    };

    xhr.open(
        'POST',
        'https://avocado.io/api/conversation?avosig=' + encodeURIComponent(signature),
        true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send('message=' + encodeURIComponent(note));
  });
}

var SIGNATURE_RE = /var\s+apiSignature\s+=\s+"(.+)";/m;

function getSignature(callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var match = SIGNATURE_RE.exec(xhr.responseText);
    if (!match) {
      alert('Couldn\'t find signature');
      return;
    }

    callback(match[1]);
  };
  xhr.onerror = function() {
    alert('xhr error');
  };
  xhr.open('GET', 'https://avocado.io/=/', true);
  xhr.send();
}