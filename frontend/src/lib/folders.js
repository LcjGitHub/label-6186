import api from './api.js';

/**
 * @typedef {Object} Category
 * @property {number} id
 * @property {string} name
 * @property {string} color
 * @property {string} created_at
 */

/**
 * @typedef {Object} Folder
 * @property {number} id
 * @property {string} code
 * @property {string} theme
 * @property {string} era
 * @property {string} storage_location
 * @property {number|null} category_id
 * @property {Category|null} category
 * @property {number} slide_count
 */

/**
 * @typedef {Object} Slide
 * @property {number} id
 * @property {number} folder_id
 * @property {number} sequence
 * @property {string} description
 */

/**
 * 获取片夹列表
 * @returns {Promise<Folder[]>}
 */
export async function fetchFolders() {
  const { data } = await api.get('/folders');
  return data;
}

/**
 * 获取片夹详情
 * @param {number|string} id
 * @returns {Promise<Folder & { slides: Slide[] }>}
 */
export async function fetchFolder(id) {
  const { data } = await api.get(`/folders/${id}`);
  return data;
}

/**
 * 创建片夹
 * @param {Omit<Folder, 'id' | 'slide_count' | 'created_at'>} payload
 */
export async function createFolder(payload) {
  const { data } = await api.post('/folders', payload);
  return data;
}

/**
 * 更新片夹
 * @param {number|string} id
 * @param {Omit<Folder, 'id' | 'slide_count' | 'created_at'>} payload
 */
export async function updateFolder(id, payload) {
  const { data } = await api.put(`/folders/${id}`, payload);
  return data;
}

/**
 * 删除片夹
 * @param {number|string} id
 */
export async function deleteFolder(id) {
  await api.delete(`/folders/${id}`);
}

/**
 * 新增单张
 * @param {number|string} folderId
 * @param {{ sequence: number, description: string }} payload
 */
export async function createSlide(folderId, payload) {
  const { data } = await api.post(`/folders/${folderId}/slides`, payload);
  return data;
}

/**
 * 更新单张
 * @param {number|string} id
 * @param {{ sequence: number, description: string }} payload
 */
export async function updateSlide(id, payload) {
  const { data } = await api.put(`/slides/${id}`, payload);
  return data;
}

/**
 * 删除单张
 * @param {number|string} id
 */
export async function deleteSlide(id) {
  await api.delete(`/slides/${id}`);
}

/**
 * 获取分类列表
 * @returns {Promise<Category[]>}
 */
export async function fetchCategories() {
  const { data } = await api.get('/categories');
  return data;
}

/**
 * 创建分类
 * @param {{ name: string, color?: string }} payload
 */
export async function createCategory(payload) {
  const { data } = await api.post('/categories', payload);
  return data;
}

/**
 * 更新分类
 * @param {number|string} id
 * @param {{ name: string, color?: string }} payload
 */
export async function updateCategory(id, payload) {
  const { data } = await api.put(`/categories/${id}`, payload);
  return data;
}

/**
 * 删除分类
 * @param {number|string} id
 */
export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`);
}
