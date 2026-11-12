/// <reference lib="webworker" />
import { execute, type RunRequest } from './core';

self.onmessage = (event: MessageEvent<RunRequest>) => {
	self.postMessage(execute(event.data));
};
