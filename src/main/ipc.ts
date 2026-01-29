import { ipcMain, shell } from 'electron';
import fs from 'fs';
import {
  addMap,
  createNade,
  deleteNade,
  exportJson,
  getNade,
  importJson,
  listMaps,
  listNades,
  updateNade
} from './db';
import type { NadeFilters, NadeInput } from './db';

export function registerIpcHandlers() {
  ipcMain.handle('maps:list', async () => listMaps());
  ipcMain.handle('maps:add', async (_event, name: string) => {
    addMap(name);
    return listMaps();
  });

  ipcMain.handle('nades:list', async (_event, filters: NadeFilters) => listNades(filters));
  ipcMain.handle('nades:get', async (_event, id: number) => getNade(id));
  ipcMain.handle('nades:create', async (_event, input: NadeInput) => createNade(input));
  ipcMain.handle('nades:update', async (_event, id: number, input: NadeInput) => {
    updateNade(id, input);
    return true;
  });
  ipcMain.handle('nades:delete', async (_event, id: number) => {
    deleteNade(id);
    return true;
  });

  ipcMain.handle('nades:export', async () => exportJson());
  ipcMain.handle('nades:import', async (_event, payload: { maps: string[]; nades: any[] }) => {
    importJson(payload as any);
    return true;
  });

  ipcMain.handle('video:open', async (_event, url: string) => {
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('file:exists', async (_event, filePath: string) => {
    return fs.existsSync(filePath);
  });
}
