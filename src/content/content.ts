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
class TiktokAutoScroller {
  private video: HTMLVideoElement | null;
  private videosWithListeners: HTMLVideoElement[];
  private nextButton: HTMLButtonElement | null;
  private observer: MutationObserver | null;
  static instance: TiktokAutoScroller;

  constructor() {
    this.video = document.querySelector("video") as HTMLVideoElement;
    this.videosWithListeners = [];
    console.log("Video found", this.video);
    this.nextButton = null;
    this.observer = null;
  }

  public static getInstance(): TiktokAutoScroller {
    if (!TiktokAutoScroller.instance) {
      TiktokAutoScroller.instance = new TiktokAutoScroller();
    }
    return TiktokAutoScroller.instance;
  }

  private findNextButton(): void {
    const nextButtonSelector = "button[data-e2e='arrow-right']";
    this.nextButton = document.querySelector(nextButtonSelector);
  }

  private scrollToNextComponent(currentVideoPlayer: HTMLVideoElement): void {
    const nextComponents = document.querySelectorAll(
      "div[data-e2e='recommend-list-item-container']"
    );

    let nextComponentToScroll: HTMLElement | null = null;

    for (const component of nextComponents) {
      const position = component.getBoundingClientRect().top;
      if (position > currentVideoPlayer.getBoundingClientRect().bottom) {
        nextComponentToScroll = component as HTMLElement;
        break;
      }
    }

    if (nextComponentToScroll) {
      const targetY =
        nextComponentToScroll.getBoundingClientRect().top + window.scrollY;
      window.scroll({
        top: targetY,
        behavior: "smooth",
      });
    }
  }

  private handleVideoListener(): void {
    console.log("Adding video listener");
    if (this.video) {
      if (this.videosWithListeners.includes(this.video)) {
        console.log("Video already has a listener");
        return;
      }
      this.videosWithListeners.push(this.video);
      console.log(this.videosWithListeners);
      this.video.addEventListener("ended", this.handleVideoEnded.bind(this));
    }
  }

  private handleVideoEnded(): void {
    if (this.nextButton && this.nextButton.disabled) {
      console.log("No more videos to watch");
      return;
    } else if (this.nextButton && !this.nextButton.disabled) {
      this.nextButton.click();
      console.log("Next video clicked");
    } else {
      this.scrollToNextComponent(this.video as HTMLVideoElement);
      console.log("Scrolling to the next canvas component");
    }
  }

  private handleDOMChanges(mutationsList: MutationRecord[] | any): void {
    /*for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        const newVideoPlayer = mutation.addedNodes[0] as HTMLVideoElement;
        console.log("New video player added", newVideoPlayer.classList);
        if (newVideoPlayer.classList.contains("DivBasicPlayerWrapper")) {
          newVideoPlayer.addEventListener(
            "ended",
            this.handleVideoEnded.bind(this)
          );
          break;
        }
      }
    }*/
    if (document.querySelector("video") === this.video) {
      return;
    }
    this.video = document.querySelector("video") as HTMLVideoElement;
    this.findNextButton();
    this.handleVideoListener();
  }

  private observeDOMChanges(): void {
    if (!this.observer) {
      this.observer = new MutationObserver(this.handleDOMChanges.bind(this));
    }

    const targetNode = document.getElementById("app") as HTMLElement;
    const config = { childList: true, subtree: true };
    this.observer.observe(targetNode, config);
  }

  public start(): void {
    this.findNextButton();
    this.observeDOMChanges();
    this.handleVideoListener();
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observer = null;

    for (const video of this.videosWithListeners) {
      video.removeEventListener("ended", this.handleVideoEnded.bind(this));
    }
    this.videosWithListeners = [];
  }

  public toggle(): void {
    if (this.observer) {
      this.stop();
    } else {
      this.start();
    }
  }
}

class AppendDOMElements {
  private observer: MutationObserver;

  constructor() {
    this.appendStyles();
    //this.observer = new MutationObserver(this.appendElements.bind(this));
  }

  private getCookieValue(cookieName): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === cookieName) {
        return value;
      }
    }
    return null; // Return null if the cookie is not found
  }

  private appendStyles(): void {
    console.log(this.getCookieValue("tiktok_webapp_theme"));

    //example style, make a new class for the auto scroller button
    const style = document.createElement("style");
    style.setAttribute("data-e2e", "auto-scroller-style");

    style.innerHTML = `
    
    
    .tiktokplus-list {
      margin-top: 8px;
      margin-bottom: 8px;
      padding: 16px 0;
      position: relative;
      leter-spacing: 0.093px;
    }

    .tiktokplus-list::before {
      content: "";
      position: absolute;
      left: 8px;
      right: 8px;
      top: 0;
      height: 1px;
      background: var(--hr-color);
      -webkit-transform: scaleY(0.5);
      -moz-transform: scaleY(0.5);
      -ms-transform: scaleY(0.5);
      transform: scaleY(0.5);
    }

    .listItemWrapper-TIKTOKPLUS {
      display: flex;
      white-space: nowrap;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 10px;
      font-size: 16px;
      font-weight: 700;
    }

    .divItem-TIKTOKPLUS {
      align-items: center;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-content: center;
      width: 60%;
      justify-content: space-between;
    }

    .auto-scroller-div {
      display: flex;
      white-space: nowrap;
      flex-direction: row;
      width: 100%;
      -webkit-box-align: center;
      align-items: center;
      color: rgba(255, 255, 255, 0.9);
    }
    .ButtonSwitchContainer {
      font-size: 16px;
      line-height: 21px;
      letter-spacing: 0.03px;
      border: none;
      background: none;
      outline: none;
      padding: 0px;
      position: relative;
      overflow: visible;
      display: inline-flex;
      -webkit-box-align: center;
      align-items: center;
      color: rgba(255, 255, 255, 0.9);
      font-family: TikTokFont, Arial, Tahoma, PingFangSC, sans-serif;
      cursor: pointer;
    }

    .ButtonSwitchDiv-Active {
      position: relative;
      width: 44px;
      height: 24px;
      left: 0px;
      top: 0px;
      background: rgb(11, 224, 155);
      border-radius: 100px;
      transition: all 0.4s cubic-bezier(0.075, 0.82, 0.165, 1) 0s;
    }

    .ButtonSwitchDiv {
      position: relative;
      width: 44px;
      height: 24px;
      left: 0px;
      top: 0px;
      background: rgba(22, 24, 35, 0.12);
      border-radius: 100px;
      transition: all 0.4s cubic-bezier(0.075, 0.82, 0.165, 1) 0s;
    }

    .ButtonSwitchIcon-Active {
      position: absolute;
      display: flex;
      -webkit-box-pack: center;
      justify-content: center;
      -webkit-box-align: center;
      align-items: center;
      width: 20px;
      height: 20px;
      left: calc(100% - 2px);
      top: 50%;
      transform: translate(-100%, -50%);
      border-radius: 100px;
      background: rgb(255, 255, 255);
      box-shadow: rgba(0, 0, 0, 0.15) 0px 1px 2px;
      transition: all 0.4s cubic-bezier(0.075, 0.82, 0.165, 1) 0s;
    }

    .ButtonSwitchIcon {
      position: absolute;
      display: flex;
      -webkit-box-pack: center;
      justify-content: center;
      -webkit-box-align: center;
      align-items: center;
      width: 20px;
      height: 20px;
      left: 2px;
      top: 50%;
      transform: translateY(-50%);
      border-radius: 100px;
      background: rgb(255, 255, 255);
      box-shadow: rgba(0, 0, 0, 0.15) 0px 1px 2px;
      transition: all 0.4s cubic-bezier(0.075, 0.82, 0.165, 1) 0s;
    }

    .divSettingItem-TIKTOKPLUS {
      display: flex;
      white-space: nowrap;
      flex-direction: row;
      width: 100%;
      -webkit-box-align: center;
      align-items: center;
      color: rgb(22, 24, 35);
    }

      html {
        /** CSS DARK THEME PRIMARY COLORS */
        --color-primary-100: #121212;
        --color-primary-200: #282828;
        --color-primary-300: #3f3f3f;
        --color-primary-400: #575757;
        --color-primary-500: #717171;
        --color-primary-600: #8b8b8b;
        /** CSS DARK THEME SURFACE COLORS */
        --color-surface-100: #c9c9c9;
        --color-surface-200: #cfcfcf;
        --color-surface-300: #d5d5d5;
        --color-surface-400: #dbdbdb;
        --color-surface-500: #e1e1e1;
        --color-surface-600: #e7e7e7;
        /** CSS DARK THEME MIXED SURFACE COLORS */
        --color-surface-mixed-100: #b4b4b4;
        --color-surface-mixed-200: #bcbcbc;
        --color-surface-mixed-300: #c4c4c4;
        --color-surface-mixed-400: #cccccc;
        --color-surface-mixed-500: #d5d5d5;
        --color-surface-mixed-600: #dddddd;

        --hr-color: #e1e1e1;
      }

      html[data-theme='dark'] {
        /** CSS DARK THEME PRIMARY COLORS */
        --color-primary-100: #ffffff;
        --color-primary-200: #dddddd;
        --color-primary-300: #cfcccc;
        --color-primary-400: #d6d6d6;
        --color-primary-500: #c9c9c9;
        --color-primary-600: #c2c2c2;
        /** CSS DARK THEME SURFACE COLORS */
        --color-surface-100: #121212;
        --color-surface-200: #282828;
        --color-surface-300: #3f3f3f;
        --color-surface-400: #575757;
        --color-surface-500: #717171;
        --color-surface-600: #8b8b8b;
        /** CSS DARK THEME MIXED SURFACE COLORS */
        --color-surface-mixed-100: #252525;
        --color-surface-mixed-200: #393939;
        --color-surface-mixed-300: #4f4f4f;
        --color-surface-mixed-400: #666666;
        --color-surface-mixed-500: #7d7d7d;
        --color-surface-mixed-600: #969696;
        
        --hr-color: #3f3f3f;
      }

      span {
        color: var(--color-primary-100) !important;
      }

      h1 {
        color: var(--color-primary-100) !important;
      }

      h2 {
        color: var(--color-primary-300) !important;
      }

      h3 {
        color: var(--color-primary-100) !important;
      }

      h4 {
        color: var(--color-primary-200) !important;
      }
      
    `;

    document.head.appendChild(style);
  }

  private appendElements(): void {
    const elementToAppend = document.querySelector(
      ".tiktok-1a4urrd-DivWrapper"
    );
    if (!elementToAppend) {
      console.log("Does not exist!");
      return;
    }

    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("tiktokplus-list");
    wrapperDiv.innerHTML = `
    <h2 class="tiktok-d9vq6u-H2Title">TikTok Plus</h2>

    <ul class="tiktok-nwhccz-UlMainNav auto-scroller" role="option">
      <li class="listItemWrapper-TIKTOKPLUS">
        <div class="divItem-TIKTOKPLUS">
          <svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 256 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:var(--color-primary-100)}</style><path d="M145.6 7.7C141 2.8 134.7 0 128 0s-13 2.8-17.6 7.7l-104 112c-6.5 7-8.2 17.2-4.4 25.9S14.5 160 24 160H80V352H24c-9.5 0-18.2 5.7-22 14.4s-2.1 18.9 4.4 25.9l104 112c4.5 4.9 10.9 7.7 17.6 7.7s13-2.8 17.6-7.7l104-112c6.5-7 8.2-17.2 4.4-25.9s-12.5-14.4-22-14.4H176V160h56c9.5 0 18.2-5.7 22-14.4s2.1-18.9-4.4-25.9l-104-112z"/></svg>
          <span>Auto Scroller</span>
        </div>
        <button type="button" role="switch" aria-checked="false" id="auto-scroller" aria-label="Auto Scroller" class="ButtonSwitchContainer">
          <div width="44px" height="24px" class="ButtonSwitchDiv">
            <span width="20px" height="20px" class="ButtonSwitchIcon"></span>
          </div>
        </button>
      </li>
    </ul>
    `;

    //make it as the second child

    elementToAppend.insertBefore(
      wrapperDiv,
      elementToAppend.children[1] as HTMLElement
    );
  }

  private listeners(): void {
    const autoScrollerEl = document.getElementById("auto-scroller");
    autoScrollerEl.addEventListener("click", () => {
      TiktokAutoScroller.getInstance().toggle();
      this.runSwitchAnimation(autoScrollerEl);
    });
  }

  private runSwitchAnimation(el: HTMLElement): void {
    if (el.getAttribute("aria-checked") === "true") {
      el.setAttribute("aria-checked", "false");
      el.children[0].classList.remove("ButtonSwitchDiv-Active");
      el.children[0].classList.add("ButtonSwitchDiv");
      el.children[0].children[0].classList.remove("ButtonSwitchIcon-Active");
      el.children[0].children[0].classList.add("ButtonSwitchIcon");
    } else {
      el.setAttribute("aria-checked", "true");
      el.children[0].classList.remove("ButtonSwitchDiv");
      el.children[0].classList.add("ButtonSwitchDiv-Active");

      el.children[0].children[0].classList.remove("ButtonSwitchIcon");

      el.children[0].children[0].classList.add("ButtonSwitchIcon-Active");
    }
  }

  private generateRandomIdentifier(): string {
    const randomIdentifier = Math.random().toString(36).substring(2, 15);
    return randomIdentifier;
  }

  public start(): void {
    this.appendElements();
    this.listeners();
  }
}

window.addEventListener("load", () => {
  console.log("Tiktok Auto Scroller loaded");

  const appendDOMElements = new AppendDOMElements();
  appendDOMElements.start();
});

setupConnection();
