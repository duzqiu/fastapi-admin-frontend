<template>
  <div class="page-container">
    <PageHeader title="文章管理" description="维护文章内容、状态与标签">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 新建文章
      </el-button>
    </PageHeader>

    <el-card shadow="never" class="app-card">
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="标题 / 摘要 / 标签"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option v-for="item in ARTICLE_STATUS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>

          <el-button type="primary" plain @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon> 重置
          </el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无文章数据">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="标题" min-width="240">
          <template #default="{ row }">
            <el-link type="primary" underline="never" @click="openDetail(row)">{{ row.title }}</el-link>
            <div class="tags">
              <el-tag
                v-for="tag in splitTags(row.tags)"
                :key="tag"
                size="small"
                effect="plain"
                class="tags__item"
              >
                {{ tag }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="light">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author_name" label="作者" width="110" />
        <el-table-column prop="views" label="浏览" width="90" align="right" />
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status !== 'published'"
              link
              type="success"
              @click="handleStatus(row, 'published')"
            >
              发布
            </el-button>
            <el-button v-else link type="warning" @click="handleStatus(row, 'draft')">撤稿</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新建 / 编辑 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑文章' : '新建文章'"
      width="720px"
      top="6vh"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="72px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit placeholder="请输入标题" />
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="16">
            <el-form-item label="标签">
              <el-input v-model="form.tags" placeholder="多个标签用英文逗号分隔，如：FastAPI,教程" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option
                  v-for="item in ARTICLE_STATUS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
            placeholder="一句话概述，列表页展示"
          />
        </el-form-item>

        <el-form-item label="正文" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="10"
            placeholder="支持 Markdown 文本"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情预览 -->
    <el-drawer v-model="detail.visible" title="文章详情" size="46%">
      <template v-if="detail.data">
        <h3 class="detail__title">{{ detail.data.title }}</h3>
        <div class="detail__meta">
          <el-tag :type="statusTagType(detail.data.status)" size="small" effect="light">
            {{ statusLabel(detail.data.status) }}
          </el-tag>
          <span>作者：{{ detail.data.author_name || '-' }}</span>
          <span>浏览：{{ detail.data.views }}</span>
          <span>更新：{{ formatDateTime(detail.data.updated_at) }}</span>
        </div>
        <p class="detail__summary">{{ detail.data.summary || '（无摘要）' }}</p>
        <el-divider />
        <pre class="detail__content">{{ detail.data.content || '（无正文）' }}</pre>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  createArticle,
  deleteArticle,
  fetchArticle,
  fetchArticles,
  updateArticle,
  updateArticleStatus,
} from '@/api/article'
import PageHeader from '@/components/PageHeader.vue'
import { ARTICLE_STATUS, statusLabel, statusTagType } from '@/constants'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)

const rows = ref([])
const total = ref(0)

const query = reactive({ page: 1, page_size: 10, keyword: '', status: '' })

const formRef = ref(null)
const dialog = reactive({ visible: false, isEdit: false })
const detail = reactive({ visible: false, data: null })

const defaultForm = () => ({
  id: null,
  title: '',
  summary: '',
  content: '',
  tags: '',
  status: 'draft',
})
const form = reactive(defaultForm())

const formRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 200, message: '标题最多 200 个字符', trigger: 'blur' },
  ],
}

function splitTags(tags) {
  if (!tags) return []
  return tags.split(',').filter(Boolean).slice(0, 3)
}

function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.status) params.status = query.status
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchArticles(buildParams())
    rows.value = data.items
    total.value = data.total
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
  query.status = ''
  handleSearch()
}

function resetForm() {
  Object.assign(form, defaultForm())
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  dialog.isEdit = false
  dialog.visible = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content || '',
    tags: row.tags,
    status: row.status,
  })
  dialog.isEdit = true
  dialog.visible = true
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  submitting.value = true
  try {
    const payload = {
      title: form.title.trim(),
      summary: form.summary,
      content: form.content,
      tags: form.tags,
      status: form.status,
    }
    if (dialog.isEdit) {
      await updateArticle(form.id, payload)
      ElMessage.success('文章已更新')
    } else {
      await createArticle(payload)
      ElMessage.success('文章已创建')
    }
    dialog.visible = false
    loadData()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function openDetail(row) {
  try {
    detail.data = await fetchArticle(row.id)
    detail.visible = true
    // 浏览量 +1，同步刷新列表
    const target = rows.value.find((item) => item.id === row.id)
    if (target) target.views = detail.data.views
  } catch (error) {
    // 拦截器已提示
  }
}

async function handleStatus(row, status) {
  try {
    await updateArticleStatus(row.id, status)
    row.status = status
    ElMessage.success(status === 'published' ? '已发布' : '已撤稿')
  } catch (error) {
    // 拦截器已提示
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除文章「${row.title}」吗？该操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }

  try {
    await deleteArticle(row.id)
    ElMessage.success('删除成功')
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    loadData()
  } catch (error) {
    // 拦截器已提示
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;

  &__item {
    font-size: 11px;
  }
}

.detail {
  &__title {
    margin: 0 0 10px;
    font-size: 20px;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    font-size: 12px;
    color: var(--app-text-secondary);
  }

  &__summary {
    margin: 14px 0 0;
    padding: 12px 14px;
    border-radius: var(--app-radius-sm);
    background: var(--app-primary-soft);
    color: var(--app-text);
    font-size: 13px;
  }

  &__content {
    margin: 0;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.8;
    color: var(--app-text);
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
