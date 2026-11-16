<template>
  <div class="page-container">
    <PageHeader
      title="热搜榜单"
      description="热搜榜单条目由爬虫抓取后直接入库，后台只做查询 / 编辑 / 删除，不提供发布入口。"
    />

    <el-card shadow="never" class="app-card">
      <!-- 筛选栏 -->
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="标题 / 渠道 / 热度 / 排名"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select
            v-model="query.source"
            placeholder="全部渠道"
            clearable
            filterable
            style="width: 190px"
            @change="handleSearch"
          >
            <el-option
              v-for="item in sourceOptions"
              :key="item.source"
              :label="`${item.source}（${item.count}）`"
              :value="item.source"
            />
          </el-select>

          <el-button type="primary" plain @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon> 重置
          </el-button>
        </div>

        <span class="toolbar__hint">当前筛选共 {{ total }} 条</span>
      </div>

      <!-- 数据表：全部字段 -->
      <el-table
        v-loading="loading"
        :data="rows"
        stripe
        row-key="id"
        empty-text="暂无热搜榜单条目（数据由爬虫写入）"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column
          prop="source"
          label="渠道"
          width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="name"
          label="热搜标题"
          min-width="280"
          show-overflow-tooltip
        />
        <el-table-column label="热度" width="120">
          <template #default="{ row }">
            <span>{{ row.heat || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="160">
          <template #default="{ row }">
            <div v-if="row.tabs?.length" class="tag-list">
              <el-tag
                v-for="tag in row.tabs"
                :key="tag"
                size="small"
                effect="plain"
                type="danger"
              >
                {{ tag }}
              </el-tag>
            </div>
            <span v-else class="tag-list__empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="排名" width="100">
          <template #default="{ row }">
            <span :class="{ 'rank-number': isNumericRank(row.rank) }">
              {{ row.rank ?? '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="busyRows.has(row.id)"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              :disabled="busyRows.has(row.id)"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 编辑弹窗（没有「新增」） -->
    <el-dialog
      v-model="dialog.visible"
      title="编辑热搜榜单条目"
      width="580px"
      destroy-on-close
      :close-on-click-modal="!submitting"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="渠道" prop="source">
          <el-select
            v-model="form.source"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入渠道，如 baidu"
            style="width: 100%"
          >
            <el-option
              v-for="item in sourceOptions"
              :key="item.source"
              :label="item.source"
              :value="item.source"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="name">
          <el-input v-model="form.name" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="热度" prop="heat">
          <el-input
            v-model="form.heat"
            maxlength="50"
            clearable
            placeholder="原始文本，如 128.6万；留空表示无热度"
          />
        </el-form-item>

        <el-form-item label="标签" prop="tabs">
          <el-select
            v-model="form.tabs"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入后回车创建，如 热 / 新"
            style="width: 100%"
          >
            <el-option
              v-for="tag in HOT_TAG_SUGGESTIONS"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
          <div class="form-tip">最多 20 个标签，单个不超过 20 字</div>
        </el-form-item>

        <el-form-item label="排名" prop="rank">
          <el-input
            v-model="form.rank"
            maxlength="20"
            clearable
            placeholder="原样保存，可为「置顶」等非数字；留空表示不展示"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button :disabled="submitting" @click="dialog.visible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  deleteHotListItem,
  fetchHotListItem,
  fetchHotListItems,
  fetchHotListSources,
  updateHotListItem,
} from '@/api/hot-list'
import PageHeader from '@/components/PageHeader.vue'
import { HOT_TAG_SUGGESTIONS } from '@/constants'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)
/** 正在编辑 / 删除的行 id，避免同一行重复提交 */
const busyRows = reactive(new Set())

const rows = ref([])
const total = ref(0)
/** 渠道下拉：来自公开接口 /hot-lists/sources（带各渠道条数） */
const sourceOptions = ref([])

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  source: '',
})

const formRef = ref(null)
const dialog = reactive({ visible: false })

const defaultForm = () => ({
  id: null,
  source: '',
  name: '',
  heat: '',
  tabs: [],
  rank: '',
})
const form = reactive(defaultForm())

/** 排名里纯数字的才加粗（「置顶」这类非数字原样显示） */
function isNumericRank(value) {
  return /^\d+$/.test(String(value ?? ''))
}

function validateTabs(rule, value, callback) {
  const tags = Array.isArray(value) ? value : []
  if (tags.length > 20) {
    callback(new Error('最多 20 个标签'))
    return
  }
  if (tags.some((tag) => String(tag).length > 20)) {
    callback(new Error('单个标签最多 20 字'))
    return
  }
  callback()
}

const formRules = {
  source: [
    { required: true, message: '渠道必填', trigger: 'change' },
    { max: 50, message: '渠道最多 50 字', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '标题必填', trigger: 'blur' },
    { max: 200, message: '标题最多 200 字', trigger: 'blur' },
  ],
  heat: [{ max: 50, message: '热度最多 50 字', trigger: 'blur' }],
  tabs: [{ validator: validateTabs, trigger: 'change' }],
  rank: [{ max: 20, message: '排名最多 20 字', trigger: 'blur' }],
}

async function loadSources() {
  try {
    sourceOptions.value = await fetchHotListSources()
  } catch (error) {
    // 拦截器已提示；筛选下拉降级为空（仍可手输关键词）
  }
}

function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword.trim()) params.keyword = query.keyword.trim()
  if (query.source) params.source = query.source
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchHotListItems(buildParams())
    rows.value = data.items
    total.value = data.total
  } catch (error) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.source = ''
  handleSearch()
}

function resetForm() {
  Object.assign(form, defaultForm())
  formRef.value?.clearValidate()
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    source: row.source || '',
    name: row.name || '',
    heat: row.heat ?? '',
    tabs: [...(row.tabs || [])],
    rank: row.rank ?? '',
  })
  dialog.visible = true
  loadSources()
}

/** 只提交表单里这五个内容字段；heat / rank 留空即清空 */
function buildPayload() {
  const tags = []
  for (const raw of form.tabs || []) {
    const tag = String(raw).trim()
    if (tag && !tags.includes(tag)) tags.push(tag)
  }
  const payload = {
    source: String(form.source ?? '').trim(),
    name: String(form.name ?? '').trim(),
    heat: String(form.heat ?? '').trim() || null,
    tabs: tags,
    rank: String(form.rank ?? '').trim() || null,
  }
  if (!payload.source) throw new Error('渠道必填')
  if (!payload.name) throw new Error('标题必填')
  if (tags.length > 20) throw new Error('最多 20 个标签')
  if (tags.some((tag) => tag.length > 20)) throw new Error('单个标签最多 20 字')
  return payload
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }
  if (!form.id) return

  let payload
  try {
    payload = buildPayload()
  } catch (error) {
    ElMessage.warning(error.message)
    return
  }

  submitting.value = true
  busyRows.add(form.id)
  try {
    // 先取一次详情：确认条目还在（爬虫 / 别的管理员可能刚删过）
    const current = await fetchHotListItem(form.id)
    const updated = await updateHotListItem(current.id, payload)
    const index = rows.value.findIndex((row) => row.id === updated.id)
    if (index >= 0) rows.value[index] = updated
    ElMessage.success('已保存')
    dialog.visible = false
    loadSources()
    loadData()
  } catch (error) {
    // 拦截器已提示，保留弹窗方便重试
  } finally {
    busyRows.delete(form.id)
    submitting.value = false
  }
}

async function handleDelete(row) {
  if (busyRows.has(row.id)) return
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.source}」下的「${row.name}」这条热搜吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch (error) {
    return
  }

  busyRows.add(row.id)
  try {
    await deleteHotListItem(row.id)
    ElMessage.success('删除成功')
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    loadSources()
    loadData()
  } catch (error) {
    // 拦截器已提示
  } finally {
    busyRows.delete(row.id)
  }
}

onMounted(() => {
  loadData()
  loadSources()
})
</script>

<style scoped lang="scss">
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-list__empty {
  color: var(--app-text-placeholder);
}

/* 纯数字排名加粗，非数字（置顶 / 广告位）保持普通字重 */
.rank-number {
  font-weight: 650;
}

.toolbar__hint {
  font-size: 12px;
  color: var(--app-text-placeholder);
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--app-text-placeholder);
}
</style>
