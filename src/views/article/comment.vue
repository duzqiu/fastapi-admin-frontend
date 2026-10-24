<template>
  <div class="page-container">
    <PageHeader
      title="评论管理"
      description="用户在 App 里发的评论默认「待审核」，审核为「已通过」后才会在帖子详情页展示；已拒绝 / 已通过的评论结果是终态。"
    />

    <el-card shadow="never" class="app-card">
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="评论内容 / 评论人 / 帖子ID"
            clearable
            style="width: 240px"
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

      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无评论">
        <el-table-column label="帖子ID" width="150">
          <template #default="{ row }">
            <!-- 只展示对外的 12 位帖子编号，样式与「帖子管理」一致 -->
            <span class="post-no">{{ row.post_no || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="post_title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="publisher" label="评论人" width="120" show-overflow-tooltip />
        <el-table-column label="评论内容" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">{{ row.content || '-' }}</template>
        </el-table-column>
        <el-table-column label="评论时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="postStatusTagType(row.status)" size="small" effect="light">
              {{ postStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
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
              :title="row.status === 'pending' ? '拒绝评论' : '已审核，结果不可更改'"
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

    <el-dialog v-model="detail.visible" title="评论详情" width="600px">
      <div v-if="detail.row" class="detail">
        <div class="detail__head">
          <span class="detail__title">{{ detail.row.publisher || '匿名用户' }}</span>
          <el-tag :type="postStatusTagType(detail.row.status)" size="small" effect="light">
            {{ postStatusLabel(detail.row.status) }}
          </el-tag>
        </div>
        <div class="detail__meta">
          帖子标题：{{ detail.row.post_title || '-' }}
          <span class="detail__sep">·</span>
          帖子ID：{{ detail.row.post_no || '-' }}
          <span class="detail__sep">·</span>
          评论时间：{{ formatDateTime(detail.row.created_at) }}
        </div>
        <div class="detail__content">{{ detail.row.content || '（无内容）' }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { auditComment, deleteComment, fetchComments } from '@/api/comment'
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
    const data = await fetchComments(buildParams())
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

/** 审核：通过 / 拒绝，结果不可再改 */
async function handleAudit(row, status) {
  auditLoadingId.value = row.id
  try {
    const data = await auditComment(row.id, status)
    row.status = data.status
    ElMessage.success(status === 'approved' ? '已通过' : '已拒绝')
  } catch (error) {
    // 拦截器已提示
  } finally {
    auditLoadingId.value = null
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.publisher || '匿名用户'}」的这条评论吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch (error) {
    return
  }

  try {
    await deleteComment(row.id)
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
/* 已审核的行：两个审核按钮明显置灰，避免看起来还能点（与「帖子管理」一致） */
.audit-btn.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 12 位帖子ID：等宽数字 + 轻微字距，和「帖子管理」保持一致 */
.post-no {
  font-weight: 600;
  letter-spacing: 0.4px;
  font-variant-numeric: tabular-nums;
  color: var(--app-text);
}

.detail__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.detail__title {
  font-size: 15px;
  font-weight: 600;
}

.detail__meta {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.detail__sep {
  margin: 0 6px;
  color: var(--app-text-placeholder);
}

.detail__content {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--app-bg-page);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
