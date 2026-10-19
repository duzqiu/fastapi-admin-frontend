<template>
  <div class="page-container">
    <PageHeader
      title="帖子管理"
      description="新帖默认「待审核」；审核为「已通过」或「已拒绝」后结果不可再更改。被拒绝的帖子需作者修改后重新提交，才会回到待审核重新走一遍审核。"
    />

    <el-card shadow="never" class="app-card">
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="帖子ID / 标题 / 正文 / 发布人"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option
              v-for="item in POST_STATUS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>

          <el-button type="primary" plain @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon> 重置
          </el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无帖子">
        <el-table-column label="帖子ID" width="150">
          <template #default="{ row }">
            <span class="post-no">{{ row.post_no || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="publisher" label="发布人" width="120" show-overflow-tooltip />
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="正文" min-width="200">
          <template #default="{ row }">
            <span class="content-preview">{{ row.content || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="150">
          <template #default="{ row }">
            <div v-if="row.images && row.images.length" class="thumbs">
              <el-image
                v-for="(img, index) in row.images.slice(0, 3)"
                :key="img"
                :src="img"
                :preview-src-list="row.images"
                :initial-index="index"
                preview-teleported
                fit="cover"
                class="thumb"
              >
                <template #error>
                  <div class="thumb__error"><el-icon><Picture /></el-icon></div>
                </template>
              </el-image>
              <span v-if="row.images.length > 3" class="thumbs__more">
                +{{ row.images.length - 3 }}
              </span>
            </div>
            <span v-else class="sub-text">无</span>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.published_at) }}</template>
        </el-table-column>
        <el-table-column label="审核状态" width="110">
          <template #default="{ row }">
            <el-tag :type="postStatusTagType(row.status)" size="small" effect="light">
              {{ postStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <!-- 只有「待审核」能下结论；已通过 / 已拒绝都是终态，按钮置灰 -->
            <el-button
              link
              type="success"
              class="audit-btn"
              :disabled="row.status !== 'pending'"
              :title="row.status === 'pending' ? '通过审核' : '已审核，结果不可更改'"
              :loading="auditLoadingId === row.id"
              @click="handleAudit(row, 'approved')"
            >
              通过
            </el-button>
            <el-button
              link
              type="warning"
              class="audit-btn"
              :disabled="row.status !== 'pending'"
              :title="row.status === 'pending' ? '拒绝帖子' : '已审核，结果不可更改'"
              :loading="auditLoadingId === row.id"
              @click="handleAudit(row, 'rejected')"
            >
              拒绝
            </el-button>
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

    <el-dialog v-model="detail.visible" title="帖子详情" width="640px">
      <div v-if="detail.row" class="detail">
        <div class="detail__head">
          <span class="detail__title">{{ detail.row.title }}</span>
          <el-tag :type="postStatusTagType(detail.row.status)" size="small" effect="light">
            {{ postStatusLabel(detail.row.status) }}
          </el-tag>
        </div>
        <div class="detail__meta">
          帖子ID：{{ detail.row.post_no || '-' }}
          <span class="detail__sep">·</span>
          发布人：{{ detail.row.publisher }}
          <span class="detail__sep">·</span>
          发布时间：{{ formatDateTime(detail.row.published_at) }}
        </div>
        <div class="detail__content">{{ detail.row.content || '（无正文）' }}</div>
        <div v-if="detail.row.images && detail.row.images.length" class="detail__images">
          <el-image
            v-for="(img, index) in detail.row.images"
            :key="img"
            :src="img"
            :preview-src-list="detail.row.images"
            :initial-index="index"
            preview-teleported
            fit="cover"
            class="detail__image"
          >
            <template #error>
              <div class="thumb__error"><el-icon><Picture /></el-icon></div>
            </template>
          </el-image>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { auditPost, deletePost, fetchPosts } from '@/api/post'
import PageHeader from '@/components/PageHeader.vue'
import { POST_STATUS, postStatusLabel, postStatusTagType } from '@/constants'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const auditLoadingId = ref(null)

const rows = ref([])
const total = ref(0)

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  status: '',
})

const detail = reactive({ visible: false, row: null })

/** 组装查询参数，过滤空值 */
function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.status) params.status = query.status
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchPosts(buildParams())
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

function openDetail(row) {
  detail.row = row
  detail.visible = true
}

async function handleAudit(row, status) {
  // 双重保险：按钮已置灰，这里再拦一次，避免误触
  if (row.status !== 'pending') {
    ElMessage.warning('该帖子已审核，结果不可再更改')
    return
  }

  const label = postStatusLabel(status)
  if (status === 'rejected') {
    try {
      await ElMessageBox.confirm(`确定把「${row.title}」拒绝吗？`, '审核确认', {
        type: 'warning',
        confirmButtonText: '拒绝',
        cancelButtonText: '取消',
      })
    } catch (error) {
      return
    }
  }

  auditLoadingId.value = row.id
  try {
    const updated = await auditPost(row.id, status)
    // 就地更新，避免整页重载后丢失当前滚动位置
    Object.assign(row, {
      status: updated.status,
      status_text: updated.status_text,
      updated_at: updated.updated_at,
    })
    // label 本身就是「已通过 / 已拒绝」，不能再拼一个「已」，否则会变成「已已拒绝」
    ElMessage.success(label)
  } catch (error) {
    // 拦截器已提示
  } finally {
    auditLoadingId.value = null
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除帖子「${row.title}」吗？该操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }

  try {
    await deletePost(row.id)
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
/* 已审核的行：两个审核按钮明显置灰，避免看起来还能点 */
.audit-btn.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.content-preview {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  color: var(--app-text-secondary);
  line-height: 1.5;
}

.sub-text {
  color: var(--app-text-placeholder);
  font-size: 12px;
}

/* 12 位帖子ID：等宽数字 + 轻微字距，方便一眼核对 */
.post-no {
  font-weight: 600;
  letter-spacing: 0.4px;
  font-variant-numeric: tabular-nums;
  color: var(--app-text);
}

.thumbs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.thumb {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  overflow: hidden;
  cursor: zoom-in;
  background: var(--app-bg);
}

.thumb__error {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--app-text-placeholder);
  font-size: 14px;
}

.thumbs__more {
  font-size: 12px;
  color: var(--app-text-placeholder);
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text);
}

.detail__meta {
  font-size: 12px;
  color: var(--app-text-placeholder);
}

.detail__sep {
  margin: 0 6px;
}

.detail__content {
  padding: 12px;
  border-radius: 8px;
  background: var(--app-bg);
  color: var(--app-text);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 320px;
  overflow-y: auto;
}

.detail__images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail__image {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
  background: var(--app-bg);
}
</style>
