$ = document.getElementById.bind(document);

var postingFormNode = $('posting-form');
var noteNode = $('note');
var shareContainerNode = $('share-container');
var shareCheckboxNode = $('share-checkbox');
var shareLinkNode = $('share-link');
var statusMessageNode = $('status-message');
var statusSubMessageNode = $('status-sub-message');
var shareData;

var closingElements = document.querySelectorAll('.close');
for (var i = 0, closingEl; closingEl = closingElements[i]; i++) {
  closingEl.addEventListener('click', closePopup);
}

if (window.devicePixelRatio >= 1.5) {
  document.body.className = 'retina';
}

getSignature(function(signature) {
  postingFormNode.onsubmit = handleFormSubmit.bind(this, signature);
});

getShareData(function(loadedShareData) {
  if (!loadedShareData || !loadedShareData.url) {
    shareContainerNode.style.display = 'none';
    return;
  }
  shareData = loadedShareData;
  shareCheckboxNode.checked = true;
  shareLinkNode.href = shareData.url;
  if (shareData.title.length > 30) {
    shareLinkNode.innerText = shareData.title.substring(0, 30) + '…';
  } else {
    shareLinkNode.innerText = shareData.title;
  }
});

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
