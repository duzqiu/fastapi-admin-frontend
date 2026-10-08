<template>
  <div class="page-container">
    <PageHeader
      title="菜品分类"
      description="分类是菜品的归属维度，一个菜品只能属于一个分类；分类下仍有菜品时不允许删除"
    >
      <el-button type="primary" @click="openForm()">
        <el-icon><Plus /></el-icon> 新建分类
      </el-button>
    </PageHeader>

    <el-card shadow="never" class="app-card">
      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无分类">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="分类名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="菜品数" width="90" align="right">
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
      :title="dialog.isEdit ? '编辑分类' : '新建分类'"
      width="460px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="82px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="50" placeholder="如：热菜 / 凉菜 / 主食" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" maxlength="200" placeholder="选填" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.is_active" />
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

import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/api/dish'
import PageHeader from '@/components/PageHeader.vue'

const loading = ref(false)
const submitting = ref(false)
const rows = ref([])

const formRef = ref(null)
const dialog = reactive({ visible: false, isEdit: false })
const defaultForm = () => ({ id: null, name: '', description: '', sort: 0, is_active: true })
const form = reactive(defaultForm())
const rules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    rows.value = await fetchCategories()
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
      description: row.description || '',
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
      description: form.description,
      sort: form.sort,
      is_active: form.is_active,
    }
    if (dialog.isEdit) {
      await updateCategory(form.id, payload)
      ElMessage.success('分类已更新')
    } else {
      await createCategory(payload)
      ElMessage.success('分类已创建')
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
    await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }
  try {
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 分类下有菜品时后端会给出提示
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.text-muted {
  color: var(--app-text-placeholder);
}
</style>
