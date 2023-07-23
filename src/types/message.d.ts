type DetailsT = {
  url: string;
};

type ActionType = "urlChanged" | "testChanged";

interface IMessage {
  action: ActionType;
  videoID: string;
  url: string;
}

type Video = {
  id?: string;
  url: string;
  videoId?: string;
};

type VideoIDs = "UUID" | "numbers";
