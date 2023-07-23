const uuid = require("uuid");

let connectedPorts = [];

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "tiktokConnection") {
    // Add the port to the list of connected ports
    connectedPorts.push(port);
    console.log(connectedPorts);

    // Remove the port from the list when it disconnects
    port.onDisconnect.addListener(() => {
      console.log("Port disconnected");
      const index = connectedPorts.indexOf(port);
      if (index !== -1) {
        connectedPorts.splice(index, 1);
      }
    });
  }
});

function broadcastMessageToContentScripts(message: any) {
  for (const port of connectedPorts) {
    port.postMessage({
      ...message,
      videoId: VideoManager.getInstance().getRecentVideo()?.videoId,
    });
  }
}

function handleUrlChange(details: DetailsT) {
  if (
    details.url &&
    details.url.startsWith("https://www.tiktok.com/") &&
    VideoManager.getInstance().getRecentVideo()?.url !== details.url
  ) {
    const videoUrl = new URL(details.url);
    const videoId = videoUrl.pathname.split("/video/")[1];

    const videoManager = VideoManager.getInstance();

    // Check if the current video URL is the same as the previous one
    // and also the same as the recent video in the VideoManager
    if (
      videoManager.getRecentVideo()?.url === videoManager.getPreviousVideoURL()
    ) {
      // Remove the recent video from the VideoManager to avoid duplication
      videoManager.removeRecentVideo();
    }

    videoManager.addVideo({
      url: details.url,
    });

    broadcastMessageToContentScripts({
      action: "urlChanged",
      videoID: videoId,
      url: details.url,
    });

    console.log("Video ID:", videoId);
  }
}

class VideoManager {
  private videos: Video[];
  static instance: VideoManager;
  private previousVideoURL: string | null;

  constructor() {
    this.videos = [];
    this.previousVideoURL = null;
  }

  static getInstance() {
    if (!VideoManager.instance) {
      VideoManager.instance = new VideoManager();
    }
    return VideoManager.instance;
  }

  private generateID(videoID?: VideoIDs) {
    switch (videoID) {
      case "UUID": {
        return uuid.v4();
      }
      case "numbers": {
        return Math.floor(Math.random() * 1000000000000000000).toString();
      }
    }
  }

  public addVideo(video: Video) {
    video.id = this.generateID("UUID");
    video.videoId = this.extractVideoId(video.url);
    this.videos.push(video);

    // Update the previous video URL
    this.previousVideoURL = video.url;

    console.log(this.getVideos());
  }

  private extractVideoId(url: string) {
    const videoUrl = new URL(url);
    return videoUrl.pathname.split("/video/")[1];
  }

  public getVideos() {
    return this.videos;
  }

  public getVideoById(id: string) {
    return this.videos.find((video) => video.id === id);
  }

  public removeVideoById(id: string) {
    this.videos = this.videos.filter((video) => video.id !== id);
  }

  public clearVideos() {
    this.videos = [];
  }

  public getPreviousVideoURL() {
    return this.previousVideoURL;
  }

  public removeRecentVideo() {
    this.videos.pop(); // Remove the most recent video
    this.updatePreviousVideoURL();
  }

  public getRecentVideo() {
    return this.videos[this.videos.length - 1];
  }

  private updatePreviousVideoURL() {
    if (this.videos.length === 0) {
      this.previousVideoURL = null;
    } else {
      this.previousVideoURL = this.videos[this.videos.length - 1].url;
    }
  }
}

//when extension loaded into the correct site, then

chrome.webNavigation.onHistoryStateUpdated.addListener(handleUrlChange);
