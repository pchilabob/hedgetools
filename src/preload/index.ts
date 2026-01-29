import { contextBridge, ipcRenderer } from 'electron';
import type { NadeFilters, NadeInput, NadeRecord } from '../main/db';

type Api = {
  listMaps: () => Promise<{ name: string }[]>;
  addMap: (name: string) => Promise<{ name: string }[]>;
  listNades: (filters: NadeFilters) => Promise<NadeRecord[]>;
  getNade: (id: number) => Promise<NadeRecord | undefined>;
  createNade: (input: NadeInput) => Promise<number>;
  updateNade: (id: number, input: NadeInput) => Promise<boolean>;
  deleteNade: (id: number) => Promise<boolean>;
  exportJson: () => Promise<{ maps: string[]; nades: NadeRecord[] }>;
  importJson: (payload: { maps: string[]; nades: NadeRecord[] }) => Promise<boolean>;
  openVideo: (url: string) => Promise<boolean>;
  fileExists: (path: string) => Promise<boolean>;
};

const api: Api = {
  listMaps: () => ipcRenderer.invoke('maps:list'),
  addMap: (name) => ipcRenderer.invoke('maps:add', name),
  listNades: (filters) => ipcRenderer.invoke('nades:list', filters),
  getNade: (id) => ipcRenderer.invoke('nades:get', id),
  createNade: (input) => ipcRenderer.invoke('nades:create', input),
  updateNade: (id, input) => ipcRenderer.invoke('nades:update', id, input),
  deleteNade: (id) => ipcRenderer.invoke('nades:delete', id),
  exportJson: () => ipcRenderer.invoke('nades:export'),
  importJson: (payload) => ipcRenderer.invoke('nades:import', payload),
  openVideo: (url) => ipcRenderer.invoke('video:open', url),
  fileExists: (path) => ipcRenderer.invoke('file:exists', path)
};

contextBridge.exposeInMainWorld('cs2', api);

export type { Api };
