<template>
  <div class="page-container">
    <PageHeader title="分类与标签" description="为菜品分类归档，并用标签做多维度标记（招牌 / 新品 / 口味等）" />

    <el-card shadow="never" class="app-card">
      <el-tabs v-model="activeTab">
        <!-- 分类 -->
        <el-tab-pane label="菜品分类" name="category">
          <div class="toolbar">
            <span class="toolbar__tip">分类是菜品的归属维度，一个菜品只能属于一个分类</span>
            <el-button type="primary" @click="openCategoryForm()">
              <el-icon><Plus /></el-icon> 新建分类
            </el-button>
          </div>

          <el-table v-loading="loading.categories" :data="categories" stripe empty-text="暂无分类">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="name" label="分类名称" min-width="140" />
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column label="菜品数" width="90" align="right">
              <template #default="{ row }">{{ row.dish_count }}</template>
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
                <el-button link type="primary" @click="openCategoryForm(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteCategory(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 标签 -->
        <el-tab-pane label="菜品标签" name="tag">
          <div class="toolbar">
            <span class="toolbar__tip">标签用于多维度标记，一个菜品可以有多个标签</span>
            <el-button type="primary" @click="openTagForm()">
              <el-icon><Plus /></el-icon> 新建标签
            </el-button>
          </div>

          <el-table v-loading="loading.tags" :data="tags" stripe empty-text="暂无标签">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="标签" min-width="140">
              <template #default="{ row }">
                <el-tag :type="row.color || 'info'" effect="light">{{ row.name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="color" label="颜色" width="100">
              <template #default="{ row }">{{ row.color || '默认' }}</template>
            </el-table-column>
            <el-table-column label="关联菜品" width="100" align="right">
              <template #default="{ row }">{{ row.dish_count }}</template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="80" align="right" />
            <el-table-column label="操作" width="130" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openTagForm(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteTag(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 分类表单 -->
    <el-dialog
      v-model="categoryDialog.visible"
      :title="categoryDialog.isEdit ? '编辑分类' : '新建分类'"
      width="460px"
      destroy-on-close
    >
      <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="82px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="categoryForm.name" maxlength="50" placeholder="如：热菜 / 凉菜 / 主食" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="categoryForm.description" maxlength="200" placeholder="选填" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="categoryForm.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCategorySubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 标签表单 -->
    <el-dialog
      v-model="tagDialog.visible"
      :title="tagDialog.isEdit ? '编辑标签' : '新建标签'"
      width="460px"
      destroy-on-close
    >
      <el-form ref="tagFormRef" :model="tagForm" :rules="tagRules" label-width="82px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="tagForm.name" maxlength="30" placeholder="如：招牌 / 新品 / 微辣" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-select v-model="tagForm.color" style="width: 100%">
            <el-option v-for="item in TAG_COLORS" :key="item.value" :label="item.label" :value="item.value">
              <el-tag :type="item.value || 'info'" size="small" effect="light">{{ item.label }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="tagForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleTagSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
  fetchCategories,
  fetchTags,
  updateCategory,
  updateTag,
} from '@/api/dish'
import PageHeader from '@/components/PageHeader.vue'
import { TAG_COLORS } from '@/constants'

const activeTab = ref('category')
const submitting = ref(false)
const loading = reactive({ categories: false, tags: false })

const categories = ref([])
const tags = ref([])

const categoryFormRef = ref(null)
const tagFormRef = ref(null)
const categoryDialog = reactive({ visible: false, isEdit: false })
const tagDialog = reactive({ visible: false, isEdit: false })

const defaultCategoryForm = () => ({ id: null, name: '', description: '', sort: 0, is_active: true })
const defaultTagForm = () => ({ id: null, name: '', color: '', sort: 0 })
const categoryForm = reactive(defaultCategoryForm())
const tagForm = reactive(defaultTagForm())

const categoryRules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }
const tagRules = { name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }] }

async function loadCategories() {
  loading.categories = true
  try {
    categories.value = await fetchCategories()
  } finally {
    loading.categories = false
  }
}

async function loadTags() {
  loading.tags = true
  try {
    tags.value = await fetchTags()
  } finally {
    loading.tags = false
  }
}

function loadAll() {
  loadCategories()
  loadTags()
}

// ---------------- 分类 ----------------
function openCategoryForm(row) {
  Object.assign(categoryForm, defaultCategoryForm())
  if (row) {
    Object.assign(categoryForm, {
      id: row.id,
      name: row.name,
      description: row.description || '',
      sort: row.sort,
      is_active: row.is_active,
    })
  }
  categoryDialog.isEdit = Boolean(row)
  categoryDialog.visible = true
}

async function handleCategorySubmit() {
  try {
    await categoryFormRef.value.validate()
  } catch (error) {
    return
  }
  submitting.value = true
  try {
    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description,
      sort: categoryForm.sort,
      is_active: categoryForm.is_active,
    }
    if (categoryDialog.isEdit) {
      await updateCategory(categoryForm.id, payload)
      ElMessage.success('分类已更新')
    } else {
      await createCategory(payload)
      ElMessage.success('分类已创建')
    }
    categoryDialog.visible = false
    loadCategories()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function handleDeleteCategory(row) {
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
    loadCategories()
  } catch (error) {
    // 分类下有菜品时后端会给出提示
  }
}

// ---------------- 标签 ----------------
function openTagForm(row) {
  Object.assign(tagForm, defaultTagForm())
  if (row) {
    Object.assign(tagForm, { id: row.id, name: row.name, color: row.color || '', sort: row.sort })
  }
  tagDialog.isEdit = Boolean(row)
  tagDialog.visible = true
}

async function handleTagSubmit() {
  try {
    await tagFormRef.value.validate()
  } catch (error) {
    return
  }
  submitting.value = true
  try {
    const payload = { name: tagForm.name.trim(), color: tagForm.color, sort: tagForm.sort }
    if (tagDialog.isEdit) {
      await updateTag(tagForm.id, payload)
      ElMessage.success('标签已更新')
    } else {
      await createTag(payload)
      ElMessage.success('标签已创建')
    }
    tagDialog.visible = false
    loadTags()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function handleDeleteTag(row) {
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
    loadTags()
  } catch (error) {
    // 拦截器已提示
  }
}

onMounted(loadAll)
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;

  &__tip {
    font-size: 12px;
    color: var(--app-text-secondary);
  }
}
</style>
