<template>
  <div class="page-container">
    <PageHeader title="技能标签" description="个人网站 · 技能标签（一个分类 + 多个标签）">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 新增技能标签
      </el-button>
    </PageHeader>

    <el-card shadow="never" class="app-card">
      <!-- 筛选栏 -->
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="姓名 / 分类 / 标签"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <AvatarSelect
            v-model="query.personal_info_id"
            :options="personalOptions"
            placeholder="全部个人"
            clearable
            style="width: 190px"
          />

          <el-select v-model="query.is_active" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="已启用" :value="true" />
            <el-option label="已停用" :value="false" />
          </el-select>

          <el-button type="primary" plain @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon> 重置
          </el-button>
        </div>
      </div>

      <!-- 数据表 -->
      <el-table
        v-loading="loading"
        :data="rows"
        stripe
        row-key="id"
        empty-text="暂无技能标签"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="姓名" min-width="110" show-overflow-tooltip />
        <el-table-column label="标签分类" width="170" show-overflow-tooltip>
          <template #default="{ row }">{{ row.category || '-' }}</template>
        </el-table-column>
        <el-table-column label="标签列表" min-width="340">
          <template #default="{ row }">
            <div v-if="row.tag_list?.length" class="tag-list">
              <el-tag
                v-for="tag in row.tag_list"
                :key="tag"
                size="small"
                effect="plain"
                type="primary"
              >
                {{ tag }}
              </el-tag>
            </div>
            <span v-else class="tag-list__empty">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="是否启用" width="110">
          <template #default="{ row }">
            <el-switch
              :model-value="row.is_active"
              :loading="statusLoadingId === row.id"
              @change="(value) => handleStatusChange(row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
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

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑技能标签' : '新增技能标签'"
      width="580px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="92px">
        <el-form-item label="所属个人" prop="personal_info_id">
          <AvatarSelect
            v-model="form.personal_info_id"
            :options="personalOptions"
            placeholder="请选择个人信息（简历主体）"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="标签分类" prop="category">
          <el-input v-model="form.category" maxlength="50" placeholder="如：测试与自动化 / 语言与数据" />
        </el-form-item>

        <el-form-item label="标签列表" prop="tags">
          <el-input
            v-model="form.tags"
            type="textarea"
            :rows="3"
            placeholder="一个输入框填多个，用分号隔开，如：Python;pytest;Playwright"
          />
          <div class="form-tip">
            多个标签用分号分隔（中文分号、逗号也认），重复的会自动去掉
          </div>
          <div v-if="previewTags.length" class="tag-list form-preview">
            <el-tag
              v-for="tag in previewTags"
              :key="tag"
              size="small"
              effect="plain"
              type="primary"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="是否启用">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
          <span class="form-tip form-tip--inline">越小越靠前</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  createSkillTag,
  deleteSkillTag,
  fetchPersonalInfos,
  fetchSkillTags,
  updateSkillTag,
  updateSkillTagStatus,
} from '@/api/resume'
import PageHeader from '@/components/PageHeader.vue'
import AvatarSelect from '@/components/AvatarSelect.vue'
import { formatDateTime } from '@/utils/format'

/** 和输入框里的分隔符保持一致：中英文分号、逗号、顿号都当作分隔符 */
const TAG_SPLITTER = /[;；,，、]/

const loading = ref(false)
const submitting = ref(false)
/** 正在切换启用状态的行 id，避免一行点多次 */
const statusLoadingId = ref(null)

const rows = ref([])
const total = ref(0)
/** 「所属个人」下拉数据源（技能标签必须绑定到某个个人信息） */
const personalOptions = ref([])

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  personal_info_id: '',
  is_active: undefined,
})

const formRef = ref(null)
const dialog = reactive({ visible: false, isEdit: false })

const defaultForm = () => ({
  id: null,
  personal_info_id: null,
  category: '',
  tags: '',
  is_active: true,
  sort: 0,
})
const form = reactive(defaultForm())

/** 把输入框里那串按分隔符拆开：只用于弹窗里实时预览，真正落库的规整在后端 */
const previewTags = computed(() => {
  const tags = []
  String(form.tags || '')
    .split(TAG_SPLITTER)
    .forEach((piece) => {
      const tag = piece.trim()
      if (tag && !tags.includes(tag)) tags.push(tag)
    })
  return tags
})

/** 标签列表必填：拆完一个都不剩就算没填 */
function validateTags(rule, value, callback) {
  const tags = String(value || '')
    .split(TAG_SPLITTER)
    .map((tag) => tag.trim())
    .filter(Boolean)
  if (!tags.length) {
    callback(new Error('至少填一个标签，多个用分号分隔'))
    return
  }
  callback()
}

const formRules = {
  personal_info_id: [{ required: true, message: '请选择所属个人', trigger: 'change' }],
  category: [{ required: true, message: '请输入标签分类', trigger: 'blur' }],
  tags: [{ required: true, validator: validateTags, trigger: 'blur' }],
}

/** 拉「所属个人」下拉选项；打开弹窗时也刷新一次，保证刚建的个人能选到 */
async function loadOptions() {
  try {
    const data = await fetchPersonalInfos({ page: 1, page_size: 200 })
    personalOptions.value = data.items
  } catch (error) {
    // 拦截器已提示
  }
}

/** 组装查询参数，过滤空值 */
function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.personal_info_id) params.personal_info_id = query.personal_info_id
  // 注意用 undefined 判断：false（已停用）是有效筛选值
  if (query.is_active !== undefined && query.is_active !== '') params.is_active = query.is_active
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchSkillTags(buildParams())
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
  query.personal_info_id = ''
  query.is_active = undefined
  handleSearch()
}

function resetForm() {
  Object.assign(form, defaultForm())
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  loadOptions()
  dialog.isEdit = false
  dialog.visible = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    personal_info_id: row.personal_info_id ?? null,
    category: row.category || '',
    // 回填用后端存的那串（分号分隔），改完再提交
    tags: row.tags || (row.tag_list || []).join(';'),
    is_active: row.is_active,
    sort: row.sort || 0,
  })
  loadOptions()
  dialog.isEdit = true
  dialog.visible = true
}

/** 列表里直接启用 / 停用某条记录 */
async function handleStatusChange(row, value) {
  statusLoadingId.value = row.id
  try {
    await updateSkillTagStatus(row.id, value)
    row.is_active = value
    ElMessage.success(value ? '已启用' : '已停用')
  } catch (error) {
    // 拦截器已提示，保持原状态
  } finally {
    statusLoadingId.value = null
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  const payload = {
    personal_info_id: form.personal_info_id,
    category: form.category.trim(),
    tags: form.tags,
    is_active: form.is_active,
    sort: form.sort,
  }

  submitting.value = true
  try {
    if (dialog.isEdit) {
      await updateSkillTag(form.id, payload)
      ElMessage.success('技能标签已更新')
    } else {
      await createSkillTag(payload)
      ElMessage.success('技能标签已创建')
    }
    dialog.visible = false
    loadData()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.name}」的「${row.category || '未分类'}」这组技能标签吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch (error) {
    return
  }

  try {
    await deleteSkillTag(row.id)
    ElMessage.success('删除成功')
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    loadData()
  } catch (error) {
    // 拦截器已提示
  }
}

onMounted(() => {
  loadData()
  loadOptions()
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

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--app-text-placeholder);
}

.form-tip--inline {
  margin-top: 0;
  margin-left: 10px;
}

.form-preview {
  margin-top: 8px;
}
</style>
