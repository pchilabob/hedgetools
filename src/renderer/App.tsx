import React, { useEffect, useMemo, useState } from 'react';
import type { NadeFilters, NadeInput, NadeRecord } from './types';

const emptyNade: NadeInput = {
  title: '',
  map: '',
  side: 'T',
  startPosition: '',
  targetPosition: '',
  nadeType: 'smoke',
  description: '',
  tags: '',
  localVideoPath: null,
  videoUrl: null,
  thumbnailUrl: null
};

type View = 'library' | 'add' | 'details';

type MapOption = { name: string };

const sortOptions = [
  { value: 'new', label: 'Новые' },
  { value: 'map', label: 'По карте' },
  { value: 'title', label: 'По названию' }
] as const;

export default function App() {

  const [view, setView] = useState<View>('library');
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [nades, setNades] = useState<NadeRecord[]>([]);
  const [filters, setFilters] = useState<NadeFilters>({ sort: 'new' });
  const [selected, setSelected] = useState<NadeRecord | null>(null);
  const [form, setForm] = useState<NadeInput>(emptyNade);
  const [mapInput, setMapInput] = useState('');
  const [fileStatus, setFileStatus] = useState<string>('');
  const videoSrc = selected?.localVideoPath
    ? encodeURI(`file://${selected.localVideoPath}`)
    : null;

  useEffect(() => {


  const filteredMaps = useMemo(() => maps.map((m) => m.name), [maps]);

  const refreshNades = () => {

    window.cs2.listNades(filters).then(setNades);
  };

  const openAddForm = () => {
    setForm(emptyNade);
    setSelected(null);
    setView('add');
  };

  const openEditForm = (nade: NadeRecord) => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = nade;
    setForm(rest);
    setSelected(nade);
    setView('add');
  };

  const openDetails = (nade: NadeRecord) => {
    setSelected(nade);
    setView('details');
  };

  const handleSave = async () => {
    if (!form.title || !form.map || !form.startPosition || !form.targetPosition) {
      alert('Заполните обязательные поля.');
      return;
    }
    if (!form.localVideoPath && !form.videoUrl) {
      alert('Нужно указать локальный файл или ссылку на видео.');
      return;
    }
    if (selected) {
      await window.cs2.updateNade(selected.id, form);
    } else {
      await window.cs2.createNade(form);
    }
    setView('library');
    refreshNades();
  };

  const handleDelete = async (nade: NadeRecord) => {
    if (!confirm('Удалить эту раскидку?')) return;
    await window.cs2.deleteNade(nade.id);
    refreshNades();
    setView('library');
  };

  const addMap = async () => {
    if (!mapInput.trim()) return;

    const updated = await window.cs2.addMap(mapInput.trim());
    setMaps(updated);
    setMapInput('');
  };

  const handleExport = async () => {

    const data = await window.cs2.exportJson();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cs2-nade-guide.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {

    const text = await file.text();
    const data = JSON.parse(text);
    await window.cs2.importJson(data);
    refreshNades();
    window.cs2.listMaps().then(setMaps);
  };

  const checkFile = async (path: string | null) => {
    if (!path) {
      setFileStatus('');
      return;
    }

    const exists = await window.cs2.fileExists(path);
    setFileStatus(exists ? 'Файл найден' : 'Файл не найден');
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>CS2 Nade Guide</h1>
          <p>Быстрый офлайн-справочник раскидок</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setView('library')}>Библиотека</button>
          <button onClick={openAddForm}>Добавить</button>
        </div>
      </header>


      {view === 'library' && (
        <section className="grid">
          <aside className="panel">
            <h2>Фильтры</h2>
            <label>
              Поиск
              <input
                value={filters.search ?? ''}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="Название, теги, описание"
              />
            </label>
            <label>
              Карта
              <select
                value={filters.map ?? ''}
                onChange={(event) =>
                  setFilters({ ...filters, map: event.target.value || undefined })
                }
              >
                <option value="">Все</option>
                {filteredMaps.map((map) => (
                  <option key={map} value={map}>
                    {map}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Сторона
              <select
                value={filters.side ?? ''}
                onChange={(event) =>
                  setFilters({ ...filters, side: event.target.value || undefined })
                }
              >
                <option value="">Любая</option>
                <option value="T">T</option>
                <option value="CT">CT</option>
              </select>
            </label>
            <label>
              Стартовая позиция
              <input
                value={filters.startPosition ?? ''}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    startPosition: event.target.value || undefined
                  })
                }
                placeholder="Например: Top Mid"
              />
            </label>
            <label>
              Тип гранаты
              <select
                value={filters.nadeType ?? ''}
                onChange={(event) =>
                  setFilters({ ...filters, nadeType: event.target.value || undefined })
                }
              >
                <option value="">Любой</option>
                <option value="smoke">Smoke</option>
                <option value="flash">Flash</option>
                <option value="molotov">Molotov</option>
                <option value="he">HE</option>
              </select>
            </label>
            <label>
              Сортировка
              <select
                value={filters.sort ?? 'new'}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    sort: event.target.value as NadeFilters['sort']
                  })
                }
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="divider" />
            <h3>Импорт/экспорт</h3>
            <button onClick={handleExport}>Экспорт JSON</button>
            <label className="file-input">
              Импорт JSON
              <input
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleImport(file);
                    event.target.value = '';
                  }
                }}
              />
            </label>
          </aside>

          <main>
            <div className="list-header">
              <h2>Раскидки</h2>
              <span>Всего: {nades.length}</span>
            </div>
            <div className="cards">
              {nades.map((nade) => (
                <article key={nade.id} className="card">
                  <div className="card-header">
                    <h3>{nade.title}</h3>
                    <span className="badge">{nade.nadeType}</span>
                  </div>
                  <p className="muted">
                    {nade.map} • {nade.side} • {nade.startPosition} → {nade.targetPosition}
                  </p>
                  <p className="tags">{nade.tags}</p>
                  <div className="card-actions">
                    <button onClick={() => openDetails(nade)}>Подробнее</button>
                    <button onClick={() => openEditForm(nade)}>Редактировать</button>
                  </div>
                </article>
              ))}
              {nades.length === 0 && <p>Нет раскидок по заданным фильтрам.</p>}
            </div>
          </main>
        </section>
      )}

      {view === 'add' && (
        <section className="panel form">
          <h2>{selected ? 'Редактирование' : 'Добавление'} раскидки</h2>
          <div className="form-grid">
            <label>
              Название
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </label>
            <label>
              Карта
              <select
                value={form.map}
                onChange={(event) => setForm({ ...form, map: event.target.value })}
              >
                <option value="">Выберите</option>
                {filteredMaps.map((map) => (
                  <option key={map} value={map}>
                    {map}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Сторона
              <select
                value={form.side}
                onChange={(event) => setForm({ ...form, side: event.target.value })}
              >
                <option value="T">T</option>
                <option value="CT">CT</option>
              </select>
            </label>
            <label>
              Стартовая позиция
              <input
                value={form.startPosition}
                onChange={(event) => setForm({ ...form, startPosition: event.target.value })}
              />
            </label>
            <label>
              Позиция цели
              <input
                value={form.targetPosition}
                onChange={(event) => setForm({ ...form, targetPosition: event.target.value })}
              />
            </label>
            <label>
              Тип гранаты
              <select
                value={form.nadeType}
                onChange={(event) => setForm({ ...form, nadeType: event.target.value })}
              >
                <option value="smoke">Smoke</option>
                <option value="flash">Flash</option>
                <option value="molotov">Molotov</option>
                <option value="he">HE</option>
              </select>
            </label>
            <label className="span-2">
              Описание
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <label className="span-2">
              Теги (через запятую)
              <input
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
              />
            </label>
            <label className="span-2">
              Локальный видеофайл
              <input
                value={form.localVideoPath ?? ''}
                onChange={(event) => {
                  const value = event.target.value || null;
                  setForm({ ...form, localVideoPath: value });
                  checkFile(value);
                }}
                placeholder="C:\\videos\\smoke.mp4"
              />
              {fileStatus && <span className="muted">{fileStatus}</span>}
            </label>
            <label className="span-2">
              Ссылка на видео
              <input
                value={form.videoUrl ?? ''}
                onChange={(event) =>
                  setForm({ ...form, videoUrl: event.target.value || null })
                }
                placeholder="https://youtube.com/..."
              />
            </label>
          </div>

          <div className="divider" />
          <h3>Добавить карту</h3>
          <div className="inline">
            <input
              value={mapInput}
              onChange={(event) => setMapInput(event.target.value)}
              placeholder="Новая карта"
            />
            <button onClick={addMap}>Добавить карту</button>
          </div>

          <div className="actions">
            <button onClick={() => setView('library')}>Отмена</button>
            <button className="primary" onClick={handleSave}>
              Сохранить
            </button>
          </div>
        </section>
      )}

      {view === 'details' && selected && (
        <section className="panel details">
          <h2>{selected.title}</h2>
          <p className="muted">
            {selected.map} • {selected.side} • {selected.startPosition} →{' '}
            {selected.targetPosition}
          </p>
          <div className="detail-grid">
            <div>
              <h4>Тип гранаты</h4>
              <p>{selected.nadeType}</p>
            </div>
            <div>
              <h4>Теги</h4>
              <p>{selected.tags}</p>
            </div>
            <div className="span-2">
              <h4>Описание</h4>
              <p>{selected.description}</p>
            </div>
          </div>

          {videoSrc && (
            <div className="video">
              <video src={videoSrc} controls />
            </div>
          )}

          {selected.videoUrl && (
            <button
              className="primary"
              onClick={() => window.cs2.openVideo(selected.videoUrl!)}
            >
              Открыть в браузере
            </button>
          )}

          <div className="actions">
            <button onClick={() => setView('library')}>Назад</button>
            <button onClick={() => openEditForm(selected)}>Редактировать</button>
            <button className="danger" onClick={() => handleDelete(selected)}>
              Удалить
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
