
export interface StreamInfo {
  name: string;
  ready: boolean;
  tracks?: string[];
  readers?: any[];
  bytesReceived?: number;
  bytesSent?: number;
  source?: {
    type: string;
    id: string;
  } | null;
}

export interface StreamsResponse {
  itemCount: number;
  pageCount: number;
  items: StreamInfo[];
}

export interface LiveStream {
  nickname: string;
  isLive: boolean;
  streamUrl?: string;
  viewers: number;
}

export interface Recording {
  id: string;
  nickname: string;
  filename: string;
  url: string;
  date: Date;
  size: number;
}

export interface RecordingsApiResponse {
  recordings: {
    nickname: string;
    filename: string;
    url: string;
    date: number;
    size: number;
  }[];
}
