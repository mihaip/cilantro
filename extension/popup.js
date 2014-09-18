$ = document.getElementById.bind(document);

var postingFormNode = $('posting-form');
var noteNode = $('note');
var noteMirrorNode = document.querySelector('#note-container span');
var shareContainerNode = $('share-container');
var shareCheckboxNode = $('share-checkbox');
var shareLinkNode = $('share-link');
var statusMessageNode = $('status-message');
var statusSubMessageNode = $('status-sub-message');
var sendKissNode = document.querySelector('.kiss');
var sendHugNode = document.querySelector('.hug');
var shareData;

var closingElements = document.querySelectorAll('.close');
for (var i = 0, closingEl; closingEl = closingElements[i]; i++) {
  closingEl.addEventListener('click', closePopup);
}

// Mirror the contents of the text area so that the container node is as big
// as the text's height, which in turn makes the textarea's height be as big as
// its contents. For more details, see
// http://www.alistapart.com/articles/expanding-text-areas-made-elegant/
noteNode.addEventListener('input', function() {
 noteMirrorNode.textContent = noteNode.value;
});
noteMirrorNode.textContent = noteNode.value;

if (window.devicePixelRatio >= 1.5) {
  document.body.classList.add('retina');
}

getSignature(function(signature) {
  postingFormNode.onsubmit = handleFormSubmit.bind(this, signature);
  sendHugNode.onclick = handleSendHug.bind(this, signature);
  sendKissNode.onclick = handleSendKiss.bind(this, signature);
});

getShareData(function(loadedShareData) {
  if (!loadedShareData || !loadedShareData.url) {
    shareContainerNode.style.display = 'none';
    return;
  }
  shareData = loadedShareData;
  shareCheckboxNode.checked = true;
  shareLinkNode.href = shareData.url;
  if (shareData.title.length > 35) {
    shareLinkNode.innerText = shareData.title.substring(0, 35) + '…';
  } else {
    shareLinkNode.innerText = shareData.title;
  }
});

function handleSendHug(signature, event){
  event.preventDefault();

  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    setStatus('Hooray! Sent a hug!');
    setTimeout(function() {window.close()}, 1000);
  };
  xhr.onerror = function() {
    setStatus('Failure: ' + xhr.responseText);
  };
  xhr.open(
      'POST',
      'https://avocado.io/api/conversation/hug?avosig=' + encodeURIComponent(signature),
      true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send();
}

function handleSendKiss(signature, event){
  event.preventDefault();

  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    setStatus('Hooray! Kissed!');
    setTimeout(function() {window.close()}, 1000);
  };
  xhr.onerror = function() {
    setStatus('Failure: ' + xhr.responseText);
  };
  xhr.open(
      'POST',
      'https://avocado.io/api/conversation/kiss?avosig=' + encodeURIComponent(signature),
      true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send('x=0.5&y=0.5&rotation=0.2');
}

function handleFormSubmit(signature, event) {
  event.preventDefault();

  var note = noteNode.value;

  if (shareCheckboxNode.checked) {
    note += '\n' + shareData.title + ' - ' + shareData.url;
  }

  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    setStatus('Hooray! Sent to Avocado!');
    setTimeout(function() {window.close()}, 1000);
  };
  xhr.onerror = function() {
    setStatus('Failure: ' + xhr.responseText);
  };

  xhr.open(
      'POST',
      'https://avocado.io/api/conversation?avosig=' + encodeURIComponent(signature),
      true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send('message=' + encodeURIComponent(note));
}

function getShareData(callback) {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    var tab = tabs[0];
    // During development, the popup is in its own tab, so we use the first
    // tab in the window instead.
    if (tab.url == location.href) {
      chrome.tabs.query({currentWindow: true}, function (tabs) {
        continueWithTab(tabs[0]);
      });
    } else {
      continueWithTab(tab);
    }
  });

  function continueWithTab(tab) {
    if (tab.url.indexOf('http://www.google.com/reader/') == 0 ||
        tab.url.indexOf('https://www.google.com/reader/') == 0) {
      getReaderShareData(tab, callback);
    } else {
      callback({url: tab.url, title: tab.title});
    }
  }
}

function getReaderShareData(tab, callback) {
  chrome.extension.onMessage.addListener(
      function readerMessageListener(request, sender, sendResponse) {
        // Titles from Google Reader are HTML encoded.
        var tempNode = document.createElement('div');
        tempNode.innerHTML = request.title;
        request.title = tempNode.textContent;
        callback(request);
        chrome.extension.onMessage.removeListener(readerMessageListener);
      });
  chrome.tabs.executeScript(
      tab.id, {runAt: 'document_start', file: 'reader-share-data.js'});
}

var SIGNATURE_RE = /var\s+apiSignature\s+=\s+"(.+)";/m;

function closePopup() {
  window.close();
}

function getSignature(callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var match = SIGNATURE_RE.exec(xhr.responseText);
    if (!match) {
      setStatus('Not logged into Avocado',
        'Oopsie, looks like you need to be logged into Avocado before you can send links with Cilantro.');
      var closeButton = document.querySelector('#status .close');
      closeButton.textContent = 'Login';
      closeButton.removeEventListener('click', closePopup);
      closeButton.addEventListener('click', function() {
        window.open('https://avocado.io/login');
      });
      return;
    }

    callback(match[1]);
  };
  xhr.onerror = function() {
    setStatus('Avocado signature XHR error.' + xhr.responseText);
  };
  xhr.open('GET', 'https://avocado.io/=/', true);
  xhr.send();
}

function setStatus(message, opt_subMessage) {
  statusMessageNode.textContent = message;
  if (opt_subMessage) statusSubMessageNode.textContent = opt_subMessage;
  document.body.className = 'has-status';
}
