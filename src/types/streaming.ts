
export interface StreamInfo {
  name: string;
  ready: boolean;
  tracks?: {
    type: string;
    codec: string;
  }[];
  readers?: number;
}

export interface StreamsResponse {
  items: Record<string, StreamInfo>;
}

export interface LiveStream {
  nickname: string;
  isLive: boolean;
  streamUrl?: string;
  viewers?: number;
}
