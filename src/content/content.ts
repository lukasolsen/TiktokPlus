let port = null;
import axios from "axios";
import cheerio from "cheerio";
import qs from "qs";

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
  static instance: TiktokAutoScroller;
  private enabled: boolean;

  constructor() {
    this.enabled = false;
    this.video = document.querySelector("video") as HTMLVideoElement;
    this.videosWithListeners = [];
    console.log("Video found", this.video);
    this.nextButton = null;
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
      if (!this.enabled) {
        console.log("Auto scroller is not enabled");
        return;
      }
      this.videosWithListeners.push(this.video);
      console.log(this.videosWithListeners);
      this.video.addEventListener("ended", this.handleVideoEnded.bind(this));
    }
  }

  private handleVideoEnded(): void {
    if (!this.enabled) {
      return;
    }
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

  private handleDOMChanges(
    mutationList: MutationRecord[],
    autoScroller: TiktokAutoScroller
  ): void {
    console.log("DOM changed");
    if (document.querySelector("video") === autoScroller.video) {
      return;
    }
    autoScroller.video = document.querySelector("video") as HTMLVideoElement;
    autoScroller.findNextButton();
    autoScroller.handleVideoListener();
  }

  public start(): void {
    if (this.enabled) {
      return;
    }
    this.enabled = true;

    DocumentHandler.getInstance().addFunctionForListening(
      "autoScroller",
      this.handleDOMChanges,
      [this] // Pass TiktokAutoScroller instance as an additional argument
    );

    this.findNextButton();
    this.handleVideoListener();
  }

  public stop(): void {
    if (this.enabled) {
      this.enabled = false;

      for (const video of this.videosWithListeners) {
        if (video) {
          video.removeEventListener("ended", this.handleVideoEnded.bind(this));
        }
      }
      this.videosWithListeners = [];

      DocumentHandler.getInstance().removeFunctionForListening("autoScroller");
    }
  }

  public toggle(): void {
    if (this.enabled) {
      this.stop();
    } else {
      this.start();
    }
  }
}

class HideComments {
  static instance: HideComments;

  private enabled: boolean;
  private commentDivClass: string[];

  constructor() {
    this.enabled = false;
    this.commentDivClass = [
      ".tiktok-1r61p2t-DivContentContainer",
      ".tiktok-x4xlc7-DivCommentContainer",
    ];
  }

  public static getInstance(): HideComments {
    if (!this.instance) {
      this.instance = new HideComments();
    }
    return this.instance;
  }

  private handleDOMChanges(
    mutationList: MutationRecord[],
    hideComments: HideComments
  ): void {
    hideComments.commentDivClass.forEach((commentDivClass) => {
      hideComments.toggleVisibility(commentDivClass);
    });
  }

  public start(): void {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    DocumentHandler.getInstance().addFunctionForListening(
      "hideComments",
      this.handleDOMChanges,
      [this]
    );

    this.commentDivClass.forEach((commentDivClass) => {
      this.toggleVisibility(commentDivClass);
    });
  }

  private toggleVisibility(commentDivClass): void {
    const comments = document.querySelector(commentDivClass) as HTMLElement;
    if (comments && comments.style.display !== "none" && this.enabled) {
      comments.style.display = "none";
    } else if (comments && comments.style.display === "none" && !this.enabled) {
      comments.style.display = "block";
    }
  }

  public stop(): void {
    if (this.enabled) {
      this.enabled = false;

      DocumentHandler.getInstance().removeFunctionForListening("hideComments");
      this.commentDivClass.forEach((commentDivClass) => {
        this.toggleVisibility(commentDivClass);
      });
    }
  }

  public toggle(): void {
    if (this.enabled) {
      this.stop();
    } else {
      this.start();
    }
  }
}

class TikTokDownload {
  static instance: TikTokDownload;

  constructor() {}

  public static getInstance(): TikTokDownload {
    if (!this.instance) {
      this.instance = new TikTokDownload();
    }
    return this.instance;
  }

  public download(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      axios
        .get("https://ttdownloader.com/")
        .then((data) => {
          const $ = cheerio.load(data.data);
          const cookie = data.headers["set-cookie"].join("");
          const dataPost = {
            url: url,
            format: "",
            token: $("#token").attr("value"),
          };
          // return console.log(cookie);
          axios({
            method: "POST",
            url: "https://ttdownloader.com/req/",
            headers: {
              "content-type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              origin: "https://ttdownloader.com",
              referer: "https://ttdownloader.com/",
              cookie: cookie,
            },
            data: qs.stringify(dataPost),
          })
            .then(({ data }) => {
              const $ = cheerio.load(data);
              const result = {
                nowm: $(
                  "#results-list > div:nth-child(2) > div.download > a"
                )?.attr("href"),
                wm: $(
                  "#results-list > div:nth-child(3) > div.download > a"
                )?.attr("href"),
                audio: $(
                  "#results-list > div:nth-child(4) > div.download > a"
                ).attr("href"),
              };
              resolve(result);
            })
            .catch((e) => {
              reject({
                status: false,
                message: "error fetch data",
                e: e.message,
              });
            });
        })
        .catch((e) => {
          reject({ status: false, message: "error fetch data", e: e.message });
        });
    });
  }
}

/**
 * Acts like a helper class which helps other classes checking for changes in the DOM
 */
class DocumentHandler {
  static instance: DocumentHandler;
  private observer: MutationObserver;
  private functionsForListening: {
    name: string;
    func: Function;
    args?: any[];
  }[];

  constructor() {
    this.functionsForListening = [];
    this.observer = new MutationObserver(this.handleDOMChanges.bind(this));
  }

  public static getInstance(): DocumentHandler {
    if (!DocumentHandler.instance) {
      DocumentHandler.instance = new DocumentHandler();
    }
    return DocumentHandler.instance;
  }

  public handleDOMChanges(mutationList: MutationRecord[]): void {
    console.log("DOM changed", this.functionsForListening);
    // for each function we have in functionsForListening, call it
    for (const funcObj of this.functionsForListening) {
      funcObj.func(mutationList, ...(funcObj.args || []));
    }
  }

  public listenForDocumentChanges(): void {
    const targetNode = document.getElementById("app") as HTMLElement;
    const config = { childList: true, subtree: true };
    this.observer.observe(targetNode, config);
  }

  public addFunctionForListening(
    name: string,
    func: Function,
    args?: any[]
  ): void {
    this.functionsForListening.push({ name, func, args });
  }

  public removeFunctionForListening(name: string): void {
    const index = this.functionsForListening.findIndex((f) => f.name === name);
    if (index !== -1) {
      this.functionsForListening.splice(index, 1);
    }
  }

  public start(): void {
    this.listenForDocumentChanges();
  }

  public stop(): void {
    this.observer.disconnect();
    this.observer = null;
  }
}

class AppendDOMElements {
  private observer: MutationObserver;

  constructor() {
    //this.observer = new MutationObserver(this.appendElements.bind(this));
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

      <li class="listItemWrapper-TIKTOKPLUS">
        <div class="divItem-TIKTOKPLUS">
          <svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 256 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:var(--color-primary-100)}</style><path d="M145.6 7.7C141 2.8 134.7 0 128 0s-13 2.8-17.6 7.7l-104 112c-6.5 7-8.2 17.2-4.4 25.9S14.5 160 24 160H80V352H24c-9.5 0-18.2 5.7-22 14.4s-2.1 18.9 4.4 25.9l104 112c4.5 4.9 10.9 7.7 17.6 7.7s13-2.8 17.6-7.7l104-112c6.5-7 8.2-17.2 4.4-25.9s-12.5-14.4-22-14.4H176V160h56c9.5 0 18.2-5.7 22-14.4s2.1-18.9-4.4-25.9l-104-112z"/></svg>
          <span>Hide Comments</span>
        </div>
        <button type="button" role="switch" aria-checked="false" id="view-comments" aria-label="Hide Comments" class="ButtonSwitchContainer">
          <div width="44px" height="24px" class="ButtonSwitchDiv">
            <span width="20px" height="20px" class="ButtonSwitchIcon"></span>
          </div>
        </button>
      </li>

      <li class="listItemWrapper-TIKTOKPLUS">
      
        <button class="buttonItem-TIKTOKPLUS" type="button" role="button" id="download-tiktokplus" aria-label="Download">
        <svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>
          <span>Download</span>
        </div>
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

    const viewCommentsEl = document.getElementById("view-comments");
    viewCommentsEl.addEventListener("click", () => {
      this.runSwitchAnimation(viewCommentsEl);
      //TODO: add functionality
      HideComments.getInstance().toggle();

      //ex class: tiktok-1r61p2t-DivContentContainer e1mecfx00
    });

    const downloadEl = document.getElementById("download-tiktokplus");
    downloadEl.addEventListener("click", () => {
      const videoUrl = new URL(window.location.href);
      const videoId = videoUrl.pathname.split("/video/")[1];
      if (!videoId) {
        return;
      }
      TikTokDownload.getInstance()
        .download(videoUrl.href)
        .then((data) => {
          console.log(data);
          window.open(data.nowm, "_blank");
        })
        .catch((e) => {
          console.log(e);
        });
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
  DocumentHandler.getInstance().start();

  const appendDOMElements = new AppendDOMElements();
  appendDOMElements.start();
});

setupConnection();
