<template>
  <div class="page-container">
    <PageHeader title="官号文章" description="发布与管理官号文章。新建及每次编辑后均进入待审核；审核结果不可更改，访问量仅供查看。" />
    <el-card shadow="never" class="app-card">
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input v-model="query.keyword" placeholder="文章ID / 标题 / 正文 / 发布人" clearable style="width: 240px" @keyup.enter="handleSearch" @clear="handleSearch" />
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 130px">
            <el-option v-for="item in POST_STATUS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="query.member_id" filterable remote clearable :remote-method="searchFilterMembers" :loading="filterMembersLoading" placeholder="搜索发布人" style="width: 220px" @visible-change="(visible) => visible && searchFilterMembers('')">
            <el-option v-for="member in filterMembers" :key="member.id" :label="memberLabel(member)" :value="member.id" />
          </el-select>
          <el-input v-model="query.source" placeholder="来源" clearable maxlength="100" style="width: 140px" @keyup.enter="handleSearch" />
          <el-button type="primary" plain @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
        <el-button type="primary" :disabled="editor.visible" @click="openCreate">发布文章</el-button>
      </div>
      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无官号文章">
        <el-table-column prop="article_no" label="文章ID" width="150" />
        <el-table-column prop="publisher" label="发布人" width="140" show-overflow-tooltip />
        <el-table-column prop="member_id" label="会员ID" width="90" />
        <el-table-column prop="title" label="标题" width="230" show-overflow-tooltip />
        <el-table-column prop="content" label="正文" width="260" show-overflow-tooltip />
        <el-table-column label="图片" width="150">
          <template #default="{ row }">
            <div v-if="row.image_urls?.length" class="image-list">
              <el-image v-for="(url, index) in row.image_urls.slice(0, 3)" :key="index" :src="url" :preview-src-list="row.image_urls" :initial-index="index" preview-teleported fit="cover" class="thumbnail" />
              <span v-if="row.image_urls.length > 3">+{{ row.image_urls.length - 3 }}</span>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="原文链接" width="210" show-overflow-tooltip>
          <template #default="{ row }"><a v-if="isHttpUrl(row.url)" :href="row.url" target="_blank" rel="noopener noreferrer">{{ row.url }}</a><span v-else>{{ row.url || '-' }}</span></template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="130" show-overflow-tooltip />
        <el-table-column prop="board" label="榜单" width="130" show-overflow-tooltip />
        <el-table-column prop="rank" label="排名" width="80" />
        <el-table-column v-for="field in timeFields" :key="field.key" :label="field.label" width="175">
          <template #default="{ row }">{{ formatDateTime(row[field.key]) }}</template>
        </el-table-column>
        <el-table-column label="访问量" width="100" align="right"><template #default="{ row }">{{ row.view_count ?? 0 }}</template></el-table-column>
        <el-table-column label="审核状态" width="110"><template #default="{ row }"><el-tag :type="postStatusTagType(row.status)" size="small">{{ postStatusLabel(row.status) }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="detail.loading" @click="openDetail(row)">详情</el-button>
            <el-button link type="primary" :disabled="editor.visible || busyRows.has(row.id)" @click="openEdit(row)">编辑</el-button>
            <el-button link type="success" :disabled="row.status !== 'pending' || busyRows.has(row.id)" :title="row.status !== 'pending' ? '已审核，结果不可更改' : '通过审核'" @click="handleAudit(row, 'approved')">通过</el-button>
            <el-button link type="warning" :disabled="row.status !== 'pending' || busyRows.has(row.id)" :title="row.status !== 'pending' ? '已审核，结果不可更改' : '拒绝文章'" @click="handleAudit(row, 'rejected')">拒绝</el-button>
            <el-button link type="danger" :disabled="busyRows.has(row.id) || editor.visible" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-bar">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.page_size" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="handleSearch" @current-change="loadData" />
      </div>
    </el-card>

    <el-dialog v-model="detail.visible" title="官号文章详情" width="min(900px, 94vw)">
      <div v-loading="detail.loading">
        <template v-if="detail.data">
          <h2 class="detail-title">{{ detail.data.title }}</h2>
          <el-descriptions :column="2" border class="metadata">
            <el-descriptions-item label="文章ID">{{ detail.data.article_no }}</el-descriptions-item>
            <el-descriptions-item label="内部ID">{{ detail.data.id }}</el-descriptions-item>
            <el-descriptions-item label="发布人">{{ detail.data.publisher }}</el-descriptions-item>
            <el-descriptions-item label="会员ID">{{ detail.data.member_id ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="审核状态"><el-tag :type="postStatusTagType(detail.data.status)">{{ postStatusLabel(detail.data.status) }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="访问量">{{ detail.data.view_count ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="来源">{{ detail.data.source }}</el-descriptions-item>
            <el-descriptions-item label="榜单 / 排名">{{ detail.data.board || '-' }} / {{ detail.data.rank ?? '-' }}</el-descriptions-item>
            <el-descriptions-item v-for="field in timeFields" :key="field.key" :label="field.label">{{ formatDateTime(detail.data[field.key]) }}</el-descriptions-item>
            <el-descriptions-item label="原文链接" :span="2"><a v-if="isHttpUrl(detail.data.url)" :href="detail.data.url" target="_blank" rel="noopener noreferrer">{{ detail.data.url }}</a><span v-else>{{ detail.data.url }}</span></el-descriptions-item>
          </el-descriptions>
          <h3>正文</h3>
          <div class="article-content">{{ detail.data.content }}</div>
          <h3>图片（{{ detail.data.image_urls?.length || 0 }}）</h3>
          <div class="image-list detail-images">
            <el-image v-for="(url, index) in detail.data.image_urls || []" :key="index" :src="url" :preview-src-list="detail.data.image_urls" :initial-index="index" preview-teleported fit="cover" class="detail-image" />
          </div>
        </template>
      </div>
    </el-dialog>

    <el-drawer v-model="editor.visible" :title="editor.id ? '编辑官号文章' : '发布官号文章'" size="min(760px, 100vw)" :before-close="beforeEditorClose" :close-on-click-modal="false" :close-on-press-escape="!saving">
      <div v-loading="editor.loading">
        <el-alert title="保存后进入待审核，原审核结果将重置。时间按当前设备时区选择，提交时转为带 UTC 时区的 ISO 时间。" type="info" :closable="false" show-icon class="form-alert" />
        <el-alert v-if="publisherWarning" :title="publisherWarning" type="warning" :closable="false" show-icon class="form-alert" />
        <el-form label-position="top" :disabled="saving || editor.loading" @submit.prevent="saveArticle">
          <el-form-item label="发布人（已启用会员）" required>
            <el-select v-model="form.member_id" filterable remote clearable :remote-method="searchEditorMembers" :loading="editorMembersLoading" placeholder="搜索会员昵称 / 邮箱 / ID" style="width: 100%" @visible-change="(visible) => visible && searchEditorMembers('')" @change="publisherWarning = ''">
              <el-option v-for="member in editorMembers" :key="member.id" :label="memberLabel(member)" :value="member.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="原文链接（HTTP / HTTPS）" required><el-input v-model="form.url" placeholder="https://..." /></el-form-item>
          <el-form-item label="标题" required><el-input v-model="form.title" maxlength="200" show-word-limit /></el-form-item>
          <el-form-item label="正文（纯文本）" required><el-input v-model="form.content" type="textarea" :rows="10" maxlength="200000" show-word-limit /></el-form-item>
          <el-form-item label="图片链接（每行一个 HTTP / HTTPS 地址，最多 50 张）"><el-input v-model="form.imagesText" type="textarea" :rows="4" placeholder="https://..." /></el-form-item>
          <el-form-item label="来源" required><el-input v-model="form.source" maxlength="100" show-word-limit /></el-form-item>
          <div class="form-grid">
            <el-form-item label="发布时间" required><el-date-picker v-model="form.published_at" type="datetime" placeholder="选择发布时间" style="width: 100%" /></el-form-item>
            <el-form-item label="抓取时间" required><el-date-picker v-model="form.crawled_at" type="datetime" placeholder="选择抓取时间" style="width: 100%" /></el-form-item>
            <el-form-item label="榜单（可选）"><el-input v-model="form.board" maxlength="100" show-word-limit /></el-form-item>
            <el-form-item label="排名（可选，正整数）"><el-input v-model="form.rank" inputmode="numeric" clearable placeholder="留空表示无排名" /></el-form-item>
          </div>
        </el-form>
      </div>
      <template #footer>
        <el-button :disabled="saving" @click="closeEditor">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="editor.loading" @click="saveArticle">{{ editor.id ? '保存并重新送审' : '发布并送审' }}</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { POST_STATUS, postStatusLabel, postStatusTagType } from '@/constants'
import { formatDateTime } from '@/utils/format'
import { fetchMember, fetchMembers } from '@/api/member'
import {
  fetchOfficialArticles, fetchOfficialArticle, createOfficialArticle,
  updateOfficialArticle, auditOfficialArticle, deleteOfficialArticle,
} from '@/api/official-article'

const timeFields = [
  { key: 'published_at', label: '发布时间' },
  { key: 'crawled_at', label: '抓取时间' },
  { key: 'created_at', label: '创建时间' },
  { key: 'updated_at', label: '更新时间' },
]
const query = reactive({ keyword: '', status: '', member_id: null, source: '', page: 1, page_size: 10 })
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const busyRows = reactive(new Set())
const detail = reactive({ visible: false, loading: false, data: null })
const editor = reactive({ visible: false, loading: false, id: null })
const saving = ref(false)
const publisherWarning = ref('')
const filterMembers = ref([])
const editorMembers = ref([])
const filterMembersLoading = ref(false)
const editorMembersLoading = ref(false)
const blankForm = () => ({ member_id: null, url: '', title: '', content: '', imagesText: '', source: '', published_at: null, crawled_at: null, board: '', rank: '' })
const form = reactive(blankForm())
let listRequest = 0
let editorRequest = 0
let detailRequest = 0
let filterSearchRequest = 0
let editorSearchRequest = 0

function memberLabel(member) {
  return `${member.display_name || member.nickname || member.email || '会员'} · ${member.member_no || member.id}${member.email ? ` · ${member.email}` : ''}`
}
function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname)
  } catch { return false }
}
async function loadData() {
  const request = ++listRequest
  loading.value = true
  const params = { page: query.page, page_size: query.page_size }
  for (const key of ['keyword', 'status', 'source']) {
    if (query[key]?.trim()) params[key] = query[key].trim()
  }
  if (query.member_id) params.member_id = query.member_id
  try {
    const data = await fetchOfficialArticles(params)
    if (request !== listRequest) return
    rows.value = data.items
    total.value = data.total
  } catch { /* Shared interceptor reports errors. */ }
  finally { if (request === listRequest) loading.value = false }
}
function handleSearch() { query.page = 1; loadData() }
function handleReset() {
  Object.assign(query, { keyword: '', status: '', member_id: null, source: '', page: 1 })
  loadData()
}
async function searchFilterMembers(keyword) {
  const request = ++filterSearchRequest
  filterMembersLoading.value = true
  try {
    const data = await fetchMembers({ is_active: true, keyword, page_size: 50 })
    if (request !== filterSearchRequest) return
    const selected = filterMembers.value.find((member) => member.id === query.member_id)
    filterMembers.value = data.items.filter((member) => member.is_active)
    if (selected && !filterMembers.value.some((member) => member.id === selected.id)) filterMembers.value.unshift(selected)
  } catch { /* Shared interceptor reports errors. */ }
  finally { if (request === filterSearchRequest) filterMembersLoading.value = false }
}
async function searchEditorMembers(keyword) {
  const request = ++editorSearchRequest
  editorMembersLoading.value = true
  try {
    const data = await fetchMembers({ is_active: true, keyword, page_size: 50 })
    if (request !== editorSearchRequest || !editor.visible) return
    const selected = editorMembers.value.find((member) => member.id === form.member_id && member.is_active)
    editorMembers.value = data.items.filter((member) => member.is_active)
    if (selected && !editorMembers.value.some((member) => member.id === selected.id)) editorMembers.value.unshift(selected)
  } catch { /* Shared interceptor reports errors. */ }
  finally { if (request === editorSearchRequest) editorMembersLoading.value = false }
}
async function openDetail(row) {
  const request = ++detailRequest
  detail.visible = true
  detail.loading = true
  detail.data = null
  try {
    const data = await fetchOfficialArticle(row.id)
    if (request === detailRequest) detail.data = data
  } catch { if (request === detailRequest) detail.visible = false }
  finally { if (request === detailRequest) detail.loading = false }
}
function openCreate() {
  ++editorRequest
  ++editorSearchRequest
  editorMembers.value = []
  editorMembersLoading.value = false
  Object.assign(form, blankForm())
  Object.assign(editor, { visible: true, loading: false, id: null })
  publisherWarning.value = ''
  searchEditorMembers('')
}
async function verifyPublisher(id) {
  if (!id) return null
  try {
    const member = await fetchMember(id)
    return member.is_active ? member : null
  } catch (error) {
    if (error.response?.status === 404) return null
    throw error
  }
}
async function openEdit(row) {
  const request = ++editorRequest
  ++editorSearchRequest
  editorMembers.value = []
  publisherWarning.value = ''
  Object.assign(form, blankForm())
  Object.assign(editor, { visible: true, loading: true, id: row.id })
  try {
    const data = await fetchOfficialArticle(row.id)
    if (request !== editorRequest) return
    Object.assign(form, {
      member_id: null, url: data.url, title: data.title, content: data.content,
      imagesText: (data.image_urls || []).join('\n'), source: data.source,
      published_at: data.published_at ? new Date(data.published_at) : null,
      crawled_at: data.crawled_at ? new Date(data.crawled_at) : null,
      board: data.board || '', rank: data.rank ?? '',
    })
    const member = await verifyPublisher(data.member_id)
    if (request !== editorRequest) return
    if (member) {
      editorMembers.value = [member]
      form.member_id = member.id
    } else publisherWarning.value = '原发布人已删除或停用，请重新选择已启用会员后保存。'
  } catch {
    if (request === editorRequest) {
      ElMessage.warning('无法载入文章或核验发布人，请稍后重试')
      closeEditor()
    }
  } finally { if (request === editorRequest) editor.loading = false }
}
function closeEditor() {
  if (saving.value) return
  ++editorRequest
  ++editorSearchRequest
  editor.visible = false
  editor.loading = false
  editorMembersLoading.value = false
}
function beforeEditorClose(done) {
  if (saving.value) return
  closeEditor()
  done()
}
function makePayload() {
  if (!form.member_id) throw new Error('请选择已启用的发布人')
  if (!isHttpUrl(form.url.trim())) throw new Error('原文链接必须是有效的 HTTP / HTTPS 地址')
  if (!form.title.trim() || form.title.trim().length > 200) throw new Error('标题必填且最多 200 字')
  if (!form.content.trim() || form.content.length > 200000) throw new Error('正文必填且最多 200000 字')
  if (!form.source.trim() || form.source.trim().length > 100) throw new Error('来源必填且最多 100 字')
  if (form.board.trim().length > 100) throw new Error('榜单最多 100 字')
  const image_urls = form.imagesText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean)
  if (image_urls.length > 50 || image_urls.some((url) => !isHttpUrl(url))) throw new Error('图片最多 50 张，每行须为有效的 HTTP / HTTPS 地址')
  const rank = String(form.rank).trim() === '' ? null : Number(form.rank)
  if (rank !== null && (!Number.isSafeInteger(rank) || rank < 1)) throw new Error('排名必须是大于等于 1 的整数，或留空')
  const times = {}
  for (const key of ['published_at', 'crawled_at']) {
    const date = form[key] ? new Date(form[key]) : null
    if (!date || Number.isNaN(date.getTime())) throw new Error(key === 'published_at' ? '请选择有效的发布时间' : '请选择有效的抓取时间')
    times[key] = date.toISOString()
  }
  return { member_id: form.member_id, url: form.url.trim(), title: form.title.trim(), content: form.content, image_urls, source: form.source.trim(), ...times, board: form.board.trim() || null, rank }
}
async function saveArticle() {
  if (saving.value || editor.loading || !editor.visible) return
  let payload
  try { payload = makePayload() }
  catch (error) { ElMessage.warning(error.message); return }
  saving.value = true
  try {
    const member = await verifyPublisher(payload.member_id)
    if (!member) {
      publisherWarning.value = '所选发布人已删除或停用，请重新选择已启用会员。'
      form.member_id = null
      editorMembers.value = []
      return
    }
    const updated = editor.id ? await updateOfficialArticle(editor.id, payload) : await createOfficialArticle(payload)
    ElMessage.success(editor.id ? '已保存，文章已重新进入待审核' : '发布成功，文章待审核')
    if (detail.data?.id === updated.id) detail.data = updated
    editor.visible = false
    ++editorRequest
    ++editorSearchRequest
    handleSearch()
  } catch { /* Shared interceptor reports errors; keep the form for retry. */ }
  finally { saving.value = false }
}
async function handleAudit(row, status) {
  if (row.status !== 'pending' || busyRows.has(row.id)) return
  busyRows.add(row.id)
  try {
    try {
      await ElMessageBox.confirm(`确定${status === 'approved' ? '通过' : '拒绝'}文章「${row.title}」？审核结果不可更改。`, '审核确认', { type: status === 'approved' ? 'info' : 'warning' })
    } catch { return }
    const updated = await auditOfficialArticle(row.id, status)
    Object.assign(row, updated)
    if (detail.data?.id === row.id) Object.assign(detail.data, updated)
    ElMessage.success(postStatusLabel(status))
    loadData()
  } catch { /* Shared interceptor reports errors. */ }
  finally { busyRows.delete(row.id) }
}
async function handleDelete(row) {
  if (busyRows.has(row.id)) return
  busyRows.add(row.id)
  try {
    try { await ElMessageBox.confirm(`确定删除文章「${row.title}」？该操作不可恢复。`, '删除确认', { type: 'warning' }) }
    catch { return }
    await deleteOfficialArticle(row.id)
    if (detail.data?.id === row.id) detail.visible = false
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    ElMessage.success('删除成功')
    loadData()
  } catch { /* Shared interceptor reports errors. */ }
  finally { busyRows.delete(row.id) }
}
onMounted(loadData)
</script>

<style scoped>
.image-list { display: flex; gap: 6px; align-items: center; }
.thumbnail { width: 32px; height: 32px; border-radius: 5px; flex-shrink: 0; }
.detail-images { flex-wrap: wrap; }
.detail-image { width: 120px; height: 120px; border-radius: 6px; }
.detail-title, .metadata { overflow-wrap: anywhere; }
.article-content { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.8; padding: 16px; background: var(--app-bg); border-radius: 8px; }
.form-alert { margin-bottom: 18px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
a { color: var(--el-color-primary); overflow-wrap: anywhere; }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
</style>
