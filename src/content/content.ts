// content.js
let port = null;

function setupConnection() {
  port = chrome.runtime.connect({ name: "tiktokConnection" });

  port.onMessage.addListener((message: IMessage) => {
    switch (message.action) {
      case "urlChanged":
        
        history.pushState({}, "", message.url);
        console.log("URL changed:", message.url);
        break;
    }
  });
}

setupConnection();
