<template>
  <div class="page-container">
    <PageHeader
      title="菜品标签"
      description="标签用于多维度标记，一个菜品可以有多个标签；删除标签不会删除关联的菜品"
    >
      <el-button type="primary" @click="openForm()">
        <el-icon><Plus /></el-icon> 新建标签
      </el-button>
    </PageHeader>

    <el-card shadow="never" class="app-card">
      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无标签">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="标签" min-width="140">
          <template #default="{ row }">
            <el-tag :type="row.color || 'info'" effect="light">{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="颜色" width="110">
          <template #default="{ row }">
            <span class="text-muted">{{ colorLabel(row.color) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="关联菜品" min-width="100" align="right">
          <template #default="{ row }">
            <el-tag v-if="row.dish_count" type="info" size="small" effect="plain">
              {{ row.dish_count }}
            </el-tag>
            <span v-else class="text-muted">0</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="right" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small" effect="light">
              {{ row.is_active ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openForm(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑标签' : '新建标签'"
      width="460px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="82px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="30" placeholder="如：招牌 / 新品 / 微辣" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-select v-model="form.color" style="width: 100%">
            <el-option v-for="item in TAG_COLORS" :key="item.value" :label="item.label" :value="item.value">
              <el-tag :type="item.value || 'info'" size="small" effect="light">{{ item.label }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.is_active" />
          <span class="form-tip">停用后不再出现在 C 端菜单的标签列表中</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { createTag, deleteTag, fetchTags, updateTag } from '@/api/dish'
import PageHeader from '@/components/PageHeader.vue'
import { TAG_COLORS } from '@/constants'

const loading = ref(false)
const submitting = ref(false)
const rows = ref([])

const formRef = ref(null)
const dialog = reactive({ visible: false, isEdit: false })
const defaultForm = () => ({ id: null, name: '', color: '', sort: 0, is_active: true })
const form = reactive(defaultForm())
const rules = { name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }] }

const colorLabel = (value) => TAG_COLORS.find((item) => item.value === (value || ''))?.label || '默认'

async function loadData() {
  loading.value = true
  try {
    rows.value = await fetchTags()
  } finally {
    loading.value = false
  }
}

function openForm(row) {
  Object.assign(form, defaultForm())
  if (row) {
    Object.assign(form, {
      id: row.id,
      name: row.name,
      color: row.color || '',
      sort: row.sort,
      is_active: row.is_active,
    })
  }
  dialog.isEdit = Boolean(row)
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
      name: form.name.trim(),
      color: form.color,
      sort: form.sort,
      is_active: form.is_active,
    }
    if (dialog.isEdit) {
      await updateTag(form.id, payload)
      ElMessage.success('标签已更新')
    } else {
      await createTag(payload)
      ElMessage.success('标签已创建')
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
    await ElMessageBox.confirm(`确定删除标签「${row.name}」吗？关联的菜品不会被删除。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }
  try {
    await deleteTag(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 拦截器已提示
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.text-muted {
  color: var(--app-text-placeholder);
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: var(--app-text-placeholder);
}
</style>
